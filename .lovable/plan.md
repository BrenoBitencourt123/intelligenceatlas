
## Tres Modulos para Tornar Funcionais

### 1. Mover Importacao para o Admin

**Problema**: A pagina `/importar` esta acessivel para todos os usuarios. As questoes sao gravadas com `user_id` do importador, entao so ele ve.

**Solucao**:
- Adicionar uma nova aba "Importar" no painel Admin (`/admin`) com o fluxo de upload existente
- Remover a rota `/importar` do acesso publico
- Alterar a tabela `questions`: remover a dependencia de `user_id` para leitura. As questoes importadas pelo admin ficam disponiveis para todos os usuarios.
  - Adicionar coluna `imported_by` (uuid, nullable) para rastrear quem importou
  - Ajustar RLS: qualquer usuario autenticado pode LER questoes; apenas admin pode INSERIR/DELETAR
- Ajustar `useStudyStats` e `Objectives` para buscar questoes sem filtrar por `user_id`
- Remover botoes "Importar Questoes" da pagina Objetivas (usuario nao importa mais)

### 2. Modulo de Objetivas Funcional

**Problema**: O botao "Iniciar Sessao" nao faz nada. Nao existe logica de sessao de estudo.

**Solucao**: Criar o fluxo completo de sessao de estudo:

- Novo componente `StudySession` que:
  - Busca questoes da area do dia (baseado no `useStudySchedule`)
  - Seleciona 45 questoes aleatorias (ou todas disponiveis se menos)
  - Divide em 3 blocos de 15
  - Exibe uma questao por vez com as alternativas
  - Ao responder: feedback imediato (verde = certo, vermelho = errado)
  - Botao "Nao sei" que gera automaticamente um flashcard
  - Ao final: tela de resultado com acertos/erros por bloco
  - Grava na tabela `question_attempts` e `study_sessions`

- Fluxo de tela:

```text
[Objetivas] --> [Iniciar Sessao]
    |
    v
[Questao 1/45]
  Bloco 1: Aquecimento (1-15)
  Bloco 2: Aprendizado (16-30)
  Bloco 3: Consolidacao (31-45)
    |
    v
[Resultado da Sessao]
  - Acertos: 32/45
  - Por bloco: 12/15, 10/15, 10/15
  - Flashcards gerados: 5
```

### 3. Flashcards Funcional (SRS)

**Problema**: A pagina mostra apenas um placeholder. Nao ha interface de revisao nem mecanismo para criar flashcards.

**Solucao**:

- **Geracao automatica**: Quando o usuario erra uma questao ou marca "Nao sei" no modulo de Objetivas, criar um flashcard automaticamente:
  - `front`: enunciado resumido da questao
  - `back`: resposta correta + explicacao
  - `source_type`: 'question'
  - `source_id`: id da questao
  - `next_review`: hoje (disponivel imediatamente)

- **Interface de revisao**: Novo componente na pagina Flashcards:
  - Exibe o card com o `front` (pergunta)
  - Toque/clique para revelar o `back` (resposta)
  - 3 botoes de avaliacao: "Nao lembrei" / "Com esforco" / "Facil"
  - Calcula proximo intervalo baseado no SRS:
    - Nao lembrei: volta para 1 dia
    - Com esforco: mantem intervalo atual
    - Facil: avanca para proximo intervalo (1 -> 2 -> 4 -> 7 -> 15 -> 30 dias)
  - Grava review na tabela `flashcard_reviews`
  - Atualiza `next_review`, `interval_days`, `ease_factor`, `review_count` no flashcard
  - Ao terminar todos: tela de "Revisao completa"

---

### Mudancas no Banco de Dados

1. Alterar RLS da tabela `questions`:
   - SELECT: qualquer usuario autenticado pode ler todas as questoes
   - INSERT: apenas admin (via `has_role`)
   - DELETE: apenas admin

2. Tornar `questions.user_id` nullable ou trocar para `imported_by` (para nao quebrar dados existentes, manter `user_id` mas nao filtrar por ele na leitura)

### Arquivos Alterados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Admin.tsx` | Nova aba "Importar" com o fluxo de upload |
| `src/pages/Import.tsx` | Remover ou redirecionar para admin |
| `src/pages/Objectives.tsx` | Implementar sessao de estudo completa |
| `src/pages/Flashcards.tsx` | Interface de revisao SRS |
| `src/hooks/useImportExam.ts` | Ajustar para nao exigir user_id na insercao (ou usar admin id) |
| `src/hooks/useStudyStats.ts` | Buscar questoes sem filtro de user_id |
| `src/hooks/useStudySession.ts` | **Novo** - logica da sessao de estudo |
| `src/hooks/useFlashcardReview.ts` | **Novo** - logica SRS de revisao |
| `src/App.tsx` | Remover rota `/importar` do acesso publico |
| `src/components/layout/BottomNav.tsx` | Remover link de importar se existir |
| Migracao SQL | Ajustar RLS de `questions` |
