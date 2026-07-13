# Relatório do teste ao vivo — 11/07/2026 (Claude pilotando o Chrome)

> Persona: aluno que veio de um Reel querendo Medicina, zero contexto.
> Roteiro 1 = funil público. Roteiro 2 = conta nova até dourar a 1ª fase.
> Veredito geral: **o produto do dia 2 está bom de verdade** (player, escada,
> coroação, copy). Os problemas graves estão nas BORDAS: entrada, saída e
> atualização.

## O que está funcionando (visto ao vivo, produção)

- Player: 6 tipos de exercício rodando, feedback que ensina no erro, reveal
  após 2 tentativas, escada info→toque→ligue→ordene→jogada→proposta real.
- Conteúdo do nó de redação: copy afiada ("crachás na cabeça", "15 linhas é
  o piso", pegadinha do recorte do tema) e cume com proposta DIRPS real.
- Cascata: fase completa → COROAÇÃO (confete dourado, "PRIMEIRA QUESTÃO REAL
  VENCIDA") → resultado só com números positivos (14 acertos · 16 degraus ·
  7min) → streak "Primeiro dia. Amanhã continua."
- Bolinha nasce em 8/65 "estimado", vermelho com distância ("faltam 49").
- Combo x5 no header. Vocabulário "fase" no lugar de "nó" (quase todo).
- Calculadora: card de resultado forte ("onde seu curso mais pune erro").

## Bugs e fricções, por gravidade

### P0 — perde o aluno sozinho
1. **Service worker segura build velha.** Conta nova recebeu o app ANTIGO
   (nav Hoje/Questões/Redação, "banco de questões chegando", plano PRO) até
   hard-reload. Usuário real nunca faz Ctrl+Shift+R → dias vendo produto
   morto. Fix: vite-plugin-pwa `registerType: 'autoUpdate'` + skipWaiting +
   clientsClaim, e banner "nova versão disponível" como rede de segurança.
2. **Beco sem saída pós-dourar:** dourei a única fase e a trilha ficou SÓ
   com o nó dourado — os "Em breve" que apareciam antes SUMIRAM (o
   placeholder só renderiza quando há nó ativo?). O melhor momento do funil
   (primeira vitória) termina em tela morta. Fix do render + real: publicar
   a fase 2 (Carta de reclamação).
3. **Funil público não leva ao produto.** Calculadora termina em captura de
   e-mail; trilha invisível pro visitante; sem válvula "não sei meus acertos"
   (o prompt do /placar de 10 questões nunca foi executado). O dia 0 do
   espec (calculadora → diagnóstico → conta) não existe na prática.

### P1 — machuca a primeira impressão
4. **Erro de senha em inglês** no cadastro ("Password is known to be weak…").
   Traduzir erros de auth do Supabase.
5. **Streak screen abre com dado velho**: mostrei "🔥 0 dias · nada
   carimbado" por ~2s antes de virar "🔥 1". Celebração não pode nascer
   errada — aguardar refetch antes de montar a tela (skeleton se demorar).
   (O print do Breno com 7/7 carimbados + streak 2 é a mesma família.)
6. **Meta 65–65 pra Medicina**: corte 57 × 1,22 = 70 > 65 questões. A
   promessa de folga vira "gabarite". Regra pra cortes altos: meta =
   min(corte+22%, ~63) + copy "nesses cursos a folga vem da redação".
7. **Curso não atravessa o funil**: escolhi Medicina na calculadora e o
   onboarding perguntou de novo.
8. **Calculadora: 11 steppers +/− começando em 0** (≈35 toques pra preencher)
   e "Ver meu placar" aceita tudo zerado ("0/65 · faltam 57" sem aviso).

### P2 — polimento do player
9. Item "info" pede 2 cliques ("Entendi, bora" → barra "Continuar").
10. Acerto quase não se vê: opções só esmaecem, sem verde/check na escolhida.
11. Erro não aponta qual opção/par estava errado (no ligar especialmente).
12. Combo x5 é um pill minúsculo no canto — passa batido.
13. Sobrou um "Nó dourado 🥇" no feedback do cume (vocab não trocado ali).
14. Dropdown de curso: 51 itens sem campo de busca (typeahead só desktop).
15. Hero da landing leva ~2s pra aparecer (fade-in na primeira dobra).
16. Missão de sábado manda quem disse "não sei nada de redação" direto pro
    corretor (escrever redação inteira) — degrau alto demais; oferecer a
    trilha como alternativa explícita nesse caso.

## Leitura honesta

O miolo (fase → coroação) já entrega a promessa "Duolingo de vestibular" — eu
senti a subida e o cume é questão real. O que mata hoje não é falta de
gamificação: é (1) ninguém chega na trilha, (2) quem chega e vence encontra
tela morta, (3) quem instala o PWA pode ficar preso numa versão velha. Bordas,
não miolo. Consertos no PROMPT-LOVABLE-08.
