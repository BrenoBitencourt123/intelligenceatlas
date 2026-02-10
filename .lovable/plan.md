

## Acesso ao PDF Original nas Questões

### Problema
Algumas questões do ENEM possuem imagens que nao sao extraidas pelo processamento de texto do PDF, deixando a questao incompleta. O usuario precisa de uma forma de consultar o PDF original quando isso acontecer.

### Solucao

Armazenar os PDFs originais das provas no storage do backend e adicionar um botao "Ver no PDF" na tela de questoes que abre o arquivo original.

### Fluxo

1. Durante a importacao (Admin), os PDFs enviados sao salvos no storage em um bucket `exam-pdfs`
2. O ano e dia da prova ficam registrados no caminho do arquivo (ex: `2025/dia-1.pdf`)
3. Na tela de Objetivas, um botao "Ver PDF da prova" aparece no cabecalho da questao, abrindo o PDF original em uma nova aba

### Mudancas tecnicas

**1. Criar bucket `exam-pdfs` (migracao SQL)**

Criar um bucket publico para armazenar os PDFs das provas. Publico pois as provas do ENEM sao documentos publicos e todos os usuarios precisam acessar.

**2. Atualizar `useImportExam.ts`**

Apos extrair o texto do PDF, fazer upload do arquivo original para o storage no caminho `{year}/dia-{day}.pdf`. O ano sera determinado ao final (na etapa de confirmacao), entao o upload acontece na funcao `saveQuestions()` que ja recebe o ano como parametro.

**3. Criar hook `useExamPdf.ts`**

Hook simples que, dado um `year` e `day`, retorna a URL publica do PDF no storage. Faz cache para nao recalcular a cada render.

**4. Atualizar `useStudySession.ts`**

Incluir o campo `year` na interface `Question` e no mapeamento, para que a tela de Objetivas saiba de qual ano/prova eh a questao.

**5. Atualizar `Objectives.tsx`**

Adicionar um botao com icone de documento externo (FileText + ExternalLink) no cabecalho da questao. Ao clicar, abre o PDF da prova correspondente em nova aba.

### Arquivos alterados

| Arquivo | O que muda |
|---------|-----------|
| Nova migracao SQL | Cria bucket `exam-pdfs` com politica de leitura publica |
| `src/hooks/useImportExam.ts` | Upload dos PDFs originais no `saveQuestions()` |
| `src/hooks/useExamPdf.ts` | Novo hook para obter URL do PDF |
| `src/hooks/useStudySession.ts` | Adicionar `year` a interface Question |
| `src/pages/Objectives.tsx` | Botao "Ver PDF" no cabecalho da questao |

### Detalhes de implementacao

- O bucket sera publico (provas ENEM sao publicas)
- O upload acontece junto com a importacao das questoes, sem etapa extra para o admin
- Os PDFs originais enviados na importacao serao preservados no state do hook ate o momento do save
- O botao aparece para todas as questoes, pois mesmo sem imagem faltante pode ser util consultar o PDF completo
- Arquivo salvo como `{year}/dia-{day}.pdf`, sobrescrevendo se reimportar o mesmo dia/ano

