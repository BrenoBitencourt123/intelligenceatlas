# Prompt Lovable — Home "Trilha" (substitui a Hoje pro usuário UFU)
> Gatilho pra colar: player (`PROMPT-LOVABLE-trilha-player.md`) funcionando
> e testado no nó `red-generos-zeros`. NÃO colar antes.
> Princípio (ESPEC-TRILHA-PLACAR-UFU.md §4): UMA tela, UMA ação — decisões
> entre abrir o app e o 1º exercício: 1.

Refaça a rota `/hoje` (Today.tsx) como a home **Trilha**:

## Estrutura da tela (de cima pra baixo)

1. **Placar compacto (1 linha, sempre visível):** "{acertos_estimados}/{meta}
   · {zona}" usando os dados do GoalCard atual (curso/cota/corte/meta do
   profile) — versão condensada, não o card inteiro. Ao lado: streak (🔥 N).
   Tocar → expande o GoalCard completo (colapsável).
2. **Card-missão (o herói da tela):** "Missão de hoje · ~10 min" com o
   conteúdo composto assim (v0, sem motor novo):
   - Se é dia de redação (por ora: sábado; depois virá da preferência do
     onboarding): missão = "Redação da semana" → botão **COMEÇAR** →
     `/redacao-ufu`.
   - Senão, se existe nó ativo não-dourado: missão = "Continuar: {titulo do
     nó}" → botão **COMEÇAR** → `/ufu/no/{id}`.
   - Senão (tudo dourado): missão = "Revisão livre" → `/flashcards`.
   Um botão só, grande. Nada de lista de opções.
3. **A trilha (lista vertical de nós):** buscar `trilha_nos` ativos +
   `trilha_progresso` do usuário. Cada nó = círculo grande com estado:
   - dourado (concluído) · aceso/pulsando (atual — é o próximo a jogar) ·
     cinza (à frente). Título + disciplina embaixo. Tocar no aceso abre o
     player; nos outros, tooltip do estado.
   - Com 1 nó ativo hoje a lista é curta — tudo bem, ela cresce com o banco.
4. **Calendário da semana (rodapé):** 7 bolinhas (D-S-T-Q-Q-S-S), check nos
   dias com sessão feita (derivar de `trilha_respostas`/`question_attempts`
   do dia), ícone de caneta no(s) dia(s) de redação.

## Navegação
Reduzir o menu pra **Trilha · Redação · Perfil**. Remover da navegação:
Objetivas, Flashcards, Simulado, Histórico (as ROTAS continuam existindo —
só saem do menu; acesso via Perfil > "mais ferramentas" se quiser).

## O que NÃO fazer
- Não criar tabelas novas nem edge functions.
- Não implementar o compositor completo (aquecimento/núcleo/fecho) — v0 é
  a regra simples do item 2. O compositor vem depois, com dados.
- Não usar tom infantil: celebração aqui é número e progresso, sem confete.

## Verificação
1. Usuário com nó em progresso → missão "Continuar: Os 7 gêneros..." → play.
2. Sábado → missão vira Redação da semana.
3. Nó dourado aparece dourado na lista; calendário marca o dia de hoje após
   jogar 1 item.
4. Menu: só Trilha/Redação/Perfil.
