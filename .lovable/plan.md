
## Problema 1: ENEM 2025 não aparece no Simulado

**Causa raiz:** Todas as 185 questões do ENEM 2025 no banco estão com `day = NULL`. O hook `useSimuladoAvailability` filtra com `.not("day", "is", null)`, então nenhuma questão de 2025 é contabilizada.

**Solução:** Migração SQL para popular o campo `day` nas questões de 2025:
- Questões 1-90 (Linguagens + Humanas) → `day = 1`
- Questões 91-180 (Natureza + Matemática) → `day = 2`

Antes de executar, vou confirmar a distribuição por `number` para garantir o mapeamento correto.

---

## Problema 2: Sessão do Simulado sempre retoma a última questão

**Causa raiz:** A sessão é salva em `localStorage` (`atlas_simulado_session`) e nunca expira. Quando o usuário volta no dia seguinte para fazer outro dia/ano, a sessão antiga ainda está lá. O fluxo atual:

- Na tela de seleção (`/simulado`), se o usuário clica num ano/dia **diferente** do salvo, aparece um `confirm()` para descartar. Isso funciona.
- Mas se clica no **mesmo** ano/dia, vai para `/simulado/sessao?year=X&day=Y` **sem** `resume=1`. Nesse caso, o `useEffect` chama `startSimulado()` que faz um fetch novo e reseta o index para 0. Isso **deveria** funcionar.

Porém, o `resumeSimulado()` é chamado **apenas** quando `resume=1` está na URL. Se o comportamento reportado é que "sempre volta para a última questão", provavelmente o usuário está clicando em "Continuar" (que adiciona `resume=1`).

**Solução proposta:**
1. Quando o usuário clica em "Continuar", funciona como hoje (retoma).
2. Adicionar um botão mais visível de "Começar do zero" que descarta a sessão e inicia nova.
3. Ao selecionar um **dia diferente** na grade, descartar automaticamente sem pedir confirmação (o contexto já é claro).

---

## Passos de implementação

1. **Migração de dados** — Atualizar `day` para questões ENEM 2025 baseado no range de `number`.
2. **UX do Simulado** — Na card "Em andamento", adicionar opção explícita de "Recomeçar" ao lado de "Continuar". Ao clicar num dia diferente, descartar a sessão anterior sem confirm dialog.
