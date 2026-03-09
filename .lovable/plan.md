

## Plano: Reorganizar navegação — Desempenho dentro de Objetivas, Flashcards só na Home

### Resumo
Mover o "Desempenho" (Mapa de Tópicos) para dentro da tela de Objetivas como uma aba/seção integrada, remover da bottom nav. Remover flashcards da tela de Objetivas e manter apenas na Home.

### Mudanças

**1. Bottom Nav — remover "Desempenho"**
- Remover o item `{ title: 'Desempenho', path: '/errors', icon: BarChart2 }` do `BottomNav.tsx`
- A nav fica com 4 itens: Hoje, Objetivas, Redação, Perfil

**2. Objetivas — integrar Mapa de Tópicos como aba**
- Na tela idle de Objetivas, adicionar um sistema de abas (Tabs) com duas seções:
  - **Estudar** (padrão): o conteúdo atual (sessão, progresso do dia, tópicos fracos)
  - **Desempenho**: o conteúdo completo da página ErrorsByTopic (cards por área, insights sheet)
- Extrair o conteúdo de `ErrorsByTopic` para um componente reutilizável (`TopicMap`) que pode ser usado tanto na aba quanto na rota `/errors` (mantendo a rota para acesso direto/desktop)

**3. Objetivas — remover Flashcards**
- Remover o bloco de flashcard line (linhas ~819-844) do idle dashboard
- Remover o modo flashcard do componente (estado `flashcardMode`, hook `useFlashcardReview`, e toda a UI de review de flashcards ~linhas 547-646)
- Limpar imports não utilizados

**4. Home — manter Flashcards como está**
- A seção de Flashcards na Home (linhas 139-150 de Today.tsx) já existe e continua funcionando normalmente
- Pode opcionalmente adicionar link para `/flashcards` como rota standalone

### Detalhes técnicos
- Usar `@radix-ui/react-tabs` (já instalado via shadcn) para as abas em Objetivas
- O componente `TopicMap` receberá `userId` como prop e encapsulará toda a lógica de fetch + UI do ErrorsByTopic
- A rota `/errors` continua existindo (para links diretos e "Ver todos" da seção de tópicos fracos)

