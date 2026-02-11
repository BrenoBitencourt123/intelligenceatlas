
# Adicionar edição de questões no preview de importação

## Objetivo

Permitir que o admin edite questões diretamente no preview antes de importar, corrigindo problemas como gabarito faltante, área errada ou enunciado truncado.

## O que muda

### 1. Modal de edição por questão

Ao clicar em uma questão no preview, abre um modal (Dialog) com campos editáveis:

- **Resposta correta**: Select com opções A, B, C, D, E, Anulada, ou Nenhuma
- **Área**: Select com linguagens, humanas, natureza, matemática
- **Enunciado**: Textarea editável
- **Alternativas**: Cada alternativa com campo de texto editável
- **Tags**: Campo de texto separado por vírgulas

### 2. Função de update no hook

Adicionar uma função `updateQuestion(number, day, updates)` no `useImportExam` que permite atualizar qualquer campo de uma questão no estado.

### 3. Indicadores visuais melhorados

- Questões sem gabarito ganham borda amarela para facilitar identificação rápida
- Questões editadas manualmente ganham um pequeno ícone de "editado" (Pencil) para rastreabilidade

## Detalhes técnicos

**Arquivos a editar:**

- `src/hooks/useImportExam.ts` — adicionar `updateQuestion` ao retorno do hook
- `src/pages/Import.tsx` — adicionar modal de edição e tornar o card da questão clicável

**Novo estado no `ImportedQuestion`:**
- Sem mudanças no tipo, o campo `correct_answer` já aceita `string | null`
- Quando o usuario selecionar "Anulada" no select, seta `annulled: true` e `correct_answer: null`
- Quando selecionar uma letra, seta `annulled: false` e `correct_answer: letra`

**Fluxo:**
1. Usuario clica no card da questão no preview
2. Abre Dialog com os campos preenchidos
3. Usuario edita e clica "Salvar"
4. Estado atualizado, questão refletida no preview
