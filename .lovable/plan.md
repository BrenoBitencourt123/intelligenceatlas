
## Historico via Perfil + Importacao real de provas ENEM

### Resumo

Duas entregas:
1. Card de "Historico de Redacoes" na pagina de Perfil com link para `/historico`
2. Pagina de importacao funcional com upload de PDF, extracao via IA, input de gabarito por dia, e preview antes de salvar

---

### 1. Historico no Perfil

**Arquivo: `src/pages/Profile.tsx`**
- Importar icone `History` do lucide-react
- Inserir novo Card entre "Plano Atual" (linha 414) e "Quota Settings" (linha 417)
- Titulo: "Historico de Redacoes", descricao: "Veja todas as suas redacoes corrigidas"
- Botao "Ver Historico" que navega para `/historico`

---

### 2. Importacao real de provas ENEM

#### 2a. Edge function `parse-exam-pdf`

**Arquivo: `supabase/functions/parse-exam-pdf/index.ts`**

- Recebe `{ pdfText: string, year: number, day: number }`
- Usa OpenAI API (`gpt-4.1-mini`) -- mesmo modelo e padrao das outras edge functions existentes (usa `OPENAI_API_KEY` ja configurada)
- Divide o texto em chunks de ~15 questoes e processa em batches
- Prompt instruido com a estrutura do ENEM:
  - Dia 1: questoes 1-45 = Linguagens, 46-90 = Humanas
  - Dia 2: questoes 1-45 = Natureza, 46-90 = Matematica
- Retorna array de questoes: `{ number, area, statement, alternatives, correct_answer: null }`
- Trata erros 429 (rate limit) e 401

#### 2b. Frontend -- pagina de importacao com 3 etapas

**Arquivo: `src/pages/Import.tsx` (reescrever)**

**Etapa 1 -- Upload e Gabarito**
- Seletor de ano da prova (input numerico)
- Seletor de dia: 1 ou 2 (radio/select)
- Upload de PDF da prova (drag-and-drop ou file input)
- Campo de gabarito obrigatorio: textarea para colar no formato "1-D, 2-A, 3-C..." ou "DADBC..."
  - O usuario ja traz o gabarito junto com a prova de cada dia
  - Parser que aceita formatos comuns: "1-D, 2-A" / "1D 2A" / "DACBE..."
- Botao "Extrair Questoes"
- Extrai texto do PDF no frontend usando `pdfjs-dist`
- Envia texto para edge function

**Etapa 2 -- Preview**
- Lista as questoes extraidas pela IA, ja com gabarito preenchido
- Cada questao mostra: numero, area, enunciado (resumido), alternativas, resposta correta
- Usuario pode remover questoes problematicas ou editar a area
- Indicador visual de questoes sem gabarito (caso o gabarito tenha menos itens que questoes)

**Etapa 3 -- Confirmacao**
- Resumo: "90 questoes de Linguagens e Humanas, ENEM 2025, Dia 1"
- Botao "Importar" que salva na tabela `questions`
- Barra de progresso durante o salvamento

#### 2c. Hook `useImportExam`

**Arquivo: `src/hooks/useImportExam.ts`**

- Estado: `stage` (upload | preview | confirm), `questions`, `loading`, `progress`
- `extractFromPdf(file, year, day)`: extrai texto com pdfjs-dist, envia para edge function
- `parseAnswerKey(text)`: converte string de gabarito em mapa `{ 1: "D", 2: "A", ... }`
- `applyAnswerKey(questions, answerKey)`: preenche `correct_answer` de cada questao
- `saveQuestions(questions)`: batch insert na tabela `questions` com user_id

---

### Detalhes tecnicos

**Dependencia nova**: `pdfjs-dist` para extracao de texto do PDF no browser

**Config.toml**: Adicionar `[functions.parse-exam-pdf]` com `verify_jwt = false`

**Nao precisa de storage bucket**: o texto e extraido no frontend e apenas o texto (string) e enviado para a edge function -- nenhum arquivo binario e armazenado

**Ordem de execucao**:
1. Adicionar card de historico no `Profile.tsx`
2. Criar edge function `parse-exam-pdf`
3. Atualizar `config.toml`
4. Instalar `pdfjs-dist`
5. Criar hook `useImportExam.ts`
6. Reescrever `Import.tsx` com as 3 etapas
