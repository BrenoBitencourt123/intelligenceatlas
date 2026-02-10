

## Cápsulas de Conhecimento nas Questões Objetivas

### Ideia

Transformar cada questão em uma oportunidade de aprendizado, adicionando **cápsulas explicativas** que ensinam o conceito-chave por trás da pergunta. Exemplo:

- Questão pergunta "o que caracteriza esse texto como uma crônica?"
- Aparece uma tag clicável **"Crônica"** que, ao expandir, mostra: *"Crônica é um gênero textual que mistura jornalismo e literatura, geralmente curto, com linguagem coloquial e tom reflexivo ou humorístico sobre o cotidiano."*

### Como funciona

A IA que já extrai as questões do PDF passará a gerar também:

1. **Tags conceituais** (ex: "Crônica", "Figuras de linguagem", "Regra de três") -- já existe o campo `tags` na tabela
2. **Explicação pedagógica** -- já existe o campo `explanation` na tabela

Ambos os campos já existem no banco de dados, só precisam ser preenchidos pela IA durante a importação e exibidos na interface.

### O que muda na interface (tela de Objetivas)

Após o aluno responder (na área de feedback), aparecerão:

1. **Tags clicáveis** acima da explicação -- badges coloridas com os conceitos-chave (ex: "Crônica", "Interpretação de texto")
2. **Explicação expandida** -- além de dizer por que a alternativa X está certa, inclui uma mini-aula sobre o conceito

### Mudanças técnicas

**1. Edge Function `parse-exam-pdf/index.ts`**

Atualizar o `SYSTEM_PROMPT` para instruir a IA a gerar dois campos adicionais por questão:

- `explanation`: Uma explicação pedagógica que vai além de "a resposta é X". Deve ensinar o conceito central da questão (o que é crônica, como funciona regra de três, etc.) em 2-4 frases
- `tags`: Array de 1-3 palavras-chave conceituais (ex: `["Crônica", "Gêneros textuais"]`)

Atualizar também o JSON de exemplo no prompt para incluir esses campos.

**2. Hook `useImportExam.ts`**

Verificar se o insert na tabela `questions` já salva `explanation` e `tags`. Se não, adicionar esses campos ao insert.

**3. Página `Objectives.tsx`**

Na seção de feedback (que já aparece após responder), adicionar:

- Badges coloridas com as tags conceituais acima da explicação
- Renderizar a explicação com o componente `MarkdownText` para suportar formatação
- Estilizar como um card de "mini-aula" com ícone de livro/cérebro

**4. Hook `useStudySession.ts`**

Incluir `tags` na interface `Question` e no mapeamento dos dados vindos do banco.

### Arquivos alterados

| Arquivo | O que muda |
|---------|-----------|
| `supabase/functions/parse-exam-pdf/index.ts` | Prompt atualizado para gerar `explanation` e `tags` |
| `src/hooks/useImportExam.ts` | Garantir que `explanation` e `tags` são salvos no insert |
| `src/hooks/useStudySession.ts` | Adicionar `tags` à interface Question |
| `src/pages/Objectives.tsx` | Exibir tags + explicação formatada no feedback |

### Observações

- Apenas novas importações terão as cápsulas -- questões já importadas ficarão sem tags/explicação
- O campo `tags` (jsonb) e `explanation` (text) já existem na tabela, não precisa de migração
- O custo de IA não aumenta significativamente pois os campos extras são pequenos dentro do mesmo request
