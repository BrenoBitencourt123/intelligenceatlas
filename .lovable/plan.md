

## Plano: Remover "Desempenho" do TopNav + Substituir abas por link direto nos tópicos fracos

### Mudanças

**1. TopNav — remover "Desempenho"**
- Em `src/components/layout/TopNav.tsx`, remover o item `{ title: 'Desempenho', path: '/errors', icon: BarChart2 }` da lista `navItems`
- Limpar import do `BarChart2`

**2. Objetivas — remover sistema de abas, transformar "Tópicos para reforçar" em porta de entrada**
- Remover `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` — o conteúdo da aba "Estudar" volta a ser renderizado diretamente
- Remover a aba "Desempenho" (o `TopicMap` fica acessível apenas via `/errors`)
- Na seção "Tópicos para reforçar", adicionar:
  - Um botão/link "Ver mapa completo →" no header que navega para `/errors`
  - Cada item de tópico fraco também clicável, levando ao mapa de desempenho
- Isso transforma os tópicos fracos na porta de entrada natural para o desempenho detalhado

### Resultado
- Nav desktop e mobile ficam consistentes: sem "Desempenho" em nenhuma
- Tópicos fracos ganham interatividade e servem como CTA para o mapa completo
- Fluxo mais intuitivo: vê o que precisa reforçar → clica → vê detalhes

