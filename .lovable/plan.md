
## Simplificar Step 3 do Onboarding — Meta + Explicações do sistema

**Diagnóstico completo do arquivo atual (477 linhas):**

Itens a remover:
- `DAYS`, `DAY_LABELS` constants (linhas 19–23)
- `DaySchedule` type (linha 25)
- `WEEKDAYS` const (linha 28) — mantém `ALL_AREAS` e `generateRecommendedSchedule` para uso interno no `handleFinish`
- State `daySchedule` + `customized` (linhas 68–69)
- Funções `toggleScheduleArea` e `applyRecommended` (linhas 86–100)
- Na `goTo`: lógica que chama `applyRecommended` ao ir para step 2 (linha 74–76)
- No step 2 JSX: bloco "Área por dia" inteiro (linhas 388–439)
- Ajustar `handleFinish` para usar `generateRecommendedSchedule` direto (linha 118)

**Redesign do Step 3 — o que fica e o que entra:**

```
📊  Meta de estudo diária

┌─ card informativo ──────────────────────────┐
│ 🎯  Só responda quando tiver certeza        │
│     Chutar prejudica o algoritmo de         │
│     aprendizado. Escolha "Não sei" quando   │
│     não tiver certeza.                      │
└─────────────────────────────────────────────┘

┌─ card informativo ──────────────────────────┐
│ 🧠  O sistema adapta o cronograma           │
│     Com base no seu desempenho, as áreas    │
│     mais urgentes aparecem com mais         │
│     frequência — automaticamente.           │
└─────────────────────────────────────────────┘

[ Select: 10 / 20 / 30 / 40 questões/dia ]

⚠️  Banner laranja condicional (só se 40 selecionado):
    "40 questões por dia é muito intenso. O cansaço
     leva ao chute, que prejudica o algoritmo.
     Recomendamos começar com 20."

[ Voltar ]  [ Começar a estudar → ]
```

**Alterações em `src/pages/Onboarding.tsx`:**

1. Remover imports e constants não mais usados: `DAYS`, `DAY_LABELS`, `DaySchedule`, `WEEKDAYS`
2. Remover `daySchedule`, `customized` do state
3. Remover `toggleScheduleArea`, `applyRecommended`
4. Simplificar `goTo` (sem a chamada a `applyRecommended`)
5. `handleFinish`: trocar `daySchedule` por `generateRecommendedSchedule(focusAreas.length > 0 ? focusAreas : ALL_AREAS)`
6. Step 3 JSX: substituir o bloco da grade por dois info-cards + seletor de meta + banner condicional de aviso para 40 questões
7. Adicionar `AlertTriangle` ao import de `lucide-react`

**Nenhuma alteração em `useStudySchedule.ts`** — já consome corretamente.
