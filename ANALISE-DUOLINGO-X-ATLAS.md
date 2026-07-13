# Duolingo × Placar UFU — engenharia reversa do vício e blueprint de aplicação
> 11/07/2026. Fontes: prints reais do Breno (sessão 12:30–12:35) + código do Atlas
> (Today.tsx, TrilhaNo.tsx, TrilhaDiagnostico.tsx, useStudyStats, adaptiveStudy)
> + ESPEC-TRILHA-PLACAR-UFU.md. Complementa o espec; não o substitui.

## 0. A descoberta dos prints: a proporção 60/40

Cronologia da tua própria sessão: lição começa ~12:30, termina 12:33.
De 12:33 a 12:35 vêm **sete telas de recompensa em sequência**: combo x11 →
streak 2 dias → widget desbloqueado ("amanhã tem mais") → uniforme do torneio →
missão do dia → baú MEGA (dois toques pra abrir) → +50 cristais → oferta de
dobrar. ~3 min de esforço, ~2 min de celebração. **40% da sessão é colheita.**

O Atlas hoje: sessão inteira de esforço → 1 tela de resultado (3 números) →
"Voltar". A lição do print não é "adicione gamificação"; é **a celebração é
parte do produto, com o mesmo peso de engenharia do exercício.**

## 1. Dor ou desejo? (o motor do Duolingo)

Mistura, em camadas:
- **Aquisição por desejo**: "ser alguém que fala inglês" (identidade).
- **Retenção por dor**: medo de perder o streak. O widget "2 dias — não esquece
  de mim!" com Duo triste ao lado do fogo é loss aversion pura na home do
  celular. O usuário não abre o app pra aprender; abre pra **não perder**.
- A genialidade: o Duolingo **fabrica a dor que depois alivia**. O streak não
  existia antes do app. Ele cria um ativo (dias acumulados) e cobra manutenção.

**No vestibular a dor já existe de fábrica** (data da prova, corte, 6×
candidatos por vaga). Você não precisa fabricar o ativo — o placar rumo ao
corte É o ativo. Vantagem estrutural: o streak do Duolingo é abstrato; a
bolinha do Placar aponta pra uma consequência real.

## 2. A emoção embaixo do produto

- Rótulo: "aprenda inglês grátis".
- Real: **absolvição diária da culpa**. 5 minutos compram o direito de se
  sentir "alguém que está fazendo algo pela própria vida". Por isso lições
  curtas e fáceis: o produto vendido é a sensação de cumprimento, e ela
  precisa caber em qualquer dia ruim.
- No Placar UFU a emoção equivalente: **"hoje eu fiquei mais perto da vaga —
  e tenho prova disso"**. A prova é a bolinha andando contra o corte do curso
  DELE. Isso o Duolingo não tem: XP não converge pra nada verificável (defeito
  que o espec já vacinou com o cume DIRPS).

## 3. A tradução concreta

Duolingo traduziu "aprender idioma" (abstrato, anos) em unidades mínimas e
visíveis: 1 lição = 3 min · streak = número que cresce 1/dia · liga = ranking
semanal · coruja = a promessa personificada. Cada abstração virou um número
ou um desenho na tela.

Traduções equivalentes já decididas no Placar (e corretas): "34/52 · zona de
risco" · "corte + 22% = folga" · nó dourado = questão real acertada. O que
falta traduzir: **o ganho do dia**. No Duolingo, fim de sessão = chuva de
números (+25 XP, x11 combo, +50 cristais). No Atlas, `acertos = 0 // TODO`
— o número mais importante do produto ainda não anda.

## 4. Como criaram desejo antes da confiança (mecanismo a mecanismo)

Dos teus prints, cada tela com sua função:

| Print | Mecânica | Função psicológica |
|---|---|---|
| Widget "2 dias, não esquece de mim" | Streak fora do app + arte que muda por dia ("Duo Feliz, amanhã tem mais") | Loss aversion + curiosidade de colecionador NA HOME do celular — reentrada sem push |
| "Você começou um combo! 11 acertos" | Micro-recompensa DENTRO da lição | Recompensa não espera o fim; acerto em sequência vira evento |
| Barra "PERFEITO" gradiente | Sinal de execução impecável | Cria meta interna acima de "só terminar" |
| "PARABÉNS PRA MIM" (botão) | Copy em 1ª pessoa | O usuário se auto-celebra; o app só entrega o palco |
| "NÃO POSSO FALAR AGORA" | Válvula de escape | Nunca encurralar: sair do exercício ≠ sair do app |
| Baú que pede 2º toque ("MEGA — toque de novo") | Antecipação ritualizada | O abrir é o prêmio; variable reward estilo caça-níquel |
| +50 cristais → "receber mais 50" (ad) | Economia com moeda e dobra | Recompensa variável + monetização de grátis |
| Uniforme "Torcida Gana" (torneio, dia 2) | Evento temporal + cosmético colecionável | Escassez de tempo + identidade + share |
| "Sabia que você ia voltar" + calendário da semana | Relação com o mascote + carimbo visível | O app "acredita em você"; a semana é um cartão fidelidade |
| "EXPLIQUE MINHA RESPOSTA" | IA sob demanda no erro | Momento de ouro do erro (espec §4 já prevê) |

Nota do que NÃO copiar: **energia/corações e cristais-por-anúncio existem para
monetizar usuário grátis e criar dor de escassez**. O Passe é pagamento único —
importar essas fricções seria copiar o mecanismo sem a função. Ligas/ranking
precisam de massa de usuários simultâneos; com N pequeno geram tabela morta
(pior que não ter).

## 5. Leitura de cientista, não de fã

A narrativa de capa é "gamificação genial". O contraexemplo mata essa tese:
**Memrise, Busuu e Lingodeer tinham streak, pontos e moedas — e perderam.**
No Brasil, **AppProva** gamificou simulado de ENEM, teve milhões de downloads
e morreu como produto de consumo (pivotou pra B2B, vendido à Arco). Streak não
é o fosso.

O que o Duolingo tinha que os mortos não tinham:
1. **Máquina de experimentos**: centenas de A/B tests por trimestre sobre uma
   base grátis gigante. Cada mecânica dos teus prints sobreviveu a um teste de
   retenção contra uma variante. O baú de 2 toques não foi "criatividade" —
   foi medido.
2. **Custo marginal zero do core**: exercícios gerados/reaproveitados por
   máquina, sem professor. Permitiu ser 100% grátis, o que alimentou a escala,
   que alimentou os experimentos. (AppProva tinha o grátis mas não tinha loop
   diário — simulado é episódico, lição de 3 min é diária.)
3. **Fricção do core loop ≈ zero**: responder tocando em palavras, 3 min,
   impossível travar. A gamificação só funciona porque o miolo é indolor.
   Gamificar aula de 50 min não salva a aula (Estratégia que o diga).

A lacuna verdadeira: **não é ter as mecânicas, é ter o sistema que descobre
quais mecânicas funcionam PRO SEU público.** Com N pequeno você não roda A/B
com poder estatístico. Teu substituto: (a) importar as mecânicas que o
Duolingo JÁ validou com bilhões de sessões (eles publicam os resultados —
blog de engenharia, palestras do Luis von Ahn e da equipe de retenção; é
pesquisa grátis), e (b) qualitativo denso: assistir 5 alunos reais usando,
toda semana. Com 20 usuários, 1 conversa vale mais que 1 A/B.

## 6. Fazer ou comprar a variável crítica

Duas variáveis críticas separadas:

**A) "Game feel" (a celebração que paga o esforço — animação, som, timing).**
- *Fazer*: framer-motion + canvas-confetti + haptics de PWA cobrem 80%. O
  padrão Duolingo é decomponível: toda recompensa tem (1) antecipação (baú
  fechado), (2) revelação com física (números sobem contando, confete), (3)
  registro permanente (calendário carimbado). Custo: aprender ~2 semanas de
  tentativa e erro; o risco é sobre-engenharia — regra: nenhuma animação >
  1,5s e todas puláveis com toque.
- *Comprar*: motion designer freelance. Reconhecer competência: portfólio com
  micro-interações EM APPS REAIS (não vinhetas de After Effects), entrega em
  Lottie/Rive ou código React, fala em "duração/easing/feedback háptico" e
  pergunta pelo seu funil antes de desenhar. Red flag: mostra showreel
  cinematográfico e cobra por vídeo.

**B) A máquina de descobrir o que retém (a variável que matou os Memrise).**
- *Fazer*: instrumentar 5 eventos (sessão iniciada, sessão completa, tela de
  celebração vista até o fim vs pulada, retorno D1, retorno D7) + ritual de
  sexta já existente no espec §9 + assistir gravações/alunos ao vivo. É
  desconfortável (falar com usuário) e é exatamente o que o Atlas-ENEM não fez.
- *Comprar*: não se compra — analytics tool (PostHog grátis até 1M eventos,
  com session replay) é só o instrumento. A interpretação é o trabalho. Se
  contratar alguém de "growth": competência real = te pede acesso aos dados
  brutos e propõe UMA hipótese testável por vez; picareta = chega com
  checklist de 40 growth hacks.

## 7. Gap: o que o código JÁ tem vs o que falta pro loop viciante

**Já existe (não refazer):** missão única do dia · trilha com cadeado e nó
dourado · player 6 tipos com feedback por item · diagnóstico que pinta nós
(endowed progress) · streak calculado · calendário da semana com carimbo ·
placar compacto com zonas · SRS + mastery bayesiano · share card do placar.
É mais Duolingo do que você talvez perceba. O esqueleto está pronto.

**Os gaps, em ordem de impacto:**

1. **A bolinha nasce em zero** (`acertos = 0 // TODO` no Today.tsx). Viola a
   Lei Zero do teu próprio espec. O diagnóstico de auto-avaliação pinta a
   trilha mas não alimenta o placar. Enquanto isso, a tela mais importante do
   app mostra "0/52 · fora do corte" — punição no primeiro segundo.
2. **Fim de sessão sem colheita.** 1 tela seca vs 7 do Duolingo. Faltam, na
   ordem barata→cara: tela de streak pós-sessão ("🔥 3 · calendário
   carimbando com animação") → selo PERFEITO quando 100% na 1ª tentativa (o
   dado `acertou_primeira` JÁ é gravado) → bolinha do placar andando na tela
   final → share.
3. **Streak sem proteção nem cerimônia.** Duolingo perdoa (freeze) porque
   streak quebrado = churn. O espec já prevê "sistema que perdoa" (§2
   domingo); falta: 1 congelamento/semana automático + push de risco ("seu
   fogo de 5 dias apaga em 3h") — o push de perda retém mais que o de convite.
4. **Zero recompensa DENTRO da sessão.** Combo de acertos seguidos é barato
   (contador + 1 animação) e quebra a monotonia da fila.
5. **Reentrada depende do aluno lembrar.** Sem widget (PWA não tem widget
   iOS), o substituto é: push diário no horário que o aluno escolheu no
   onboarding + badge no ícone (PWA suporta) + e-mail de streak em risco.
6. **Recompensa variável inexistente.** Versão mínima sem economia: baú ao
   final da missão com conteúdo variável (frase do dia sobre a UFU, dado
   curioso do teu acervo DIRPS, +1 revelação do mapa). NÃO lançar moeda sem
   loja — cristal que não compra nada é número morto.

## 8. O diferencial que o Duolingo NÃO tem (tua arma)

O streak do Duolingo é circular: você mantém o fogo para manter o fogo. O
Placar tem o que nenhum app de gamificação tem: **um dia de acerto de contas
real e datado** (a prova) e um número externo verificável (corte do curso).

- **"Placar como previsão"**: cada sessão atualiza "se a prova fosse hoje:
  34/52 — faltam 8 pra zona segura". Duolingo mataria por um número desses.
- **Mapa da vaga por curso** (peso 3 no SEU curso): personalização com dado
  proprietário DIRPS. É defensável; streak não é.
- **A honestidade como casca**: "aqui progresso = acertar questão REAL da
  DIRPS" é o anti-Duolingo-defeito e é argumento de venda pro pai que paga.

## 9. Princípios testáveis (validar no pequeno antes de apostar)

1. **Celebração paga esforço**: implementar cascata de 3 telas pós-sessão e
   medir % de sessões-dia-seguinte nos primeiros 20 usuários vs baseline
   atual. Se D1 não mexer, parar de investir em juice.
2. **Perda > ganho**: push "seu fogo apaga em 3h" vs push "vem estudar" —
   alternar por semana, comparar taxa de retorno. Testável com 30 usuários.
3. **Bolinha nunca nasce em zero**: coorte pós-fix vs registros antigos —
   % que completa a 1ª missão após onboarding.
4. **Selo PERFEITO cria replay**: medir se sessões refeitas/nível repetido
   aparecem após o selo existir (hoje = 0 por definição).
5. **Recompensa variável exige economia**: só lançar baú se o conteúdo do baú
   for consumível de verdade; medir taxa de abertura vs pulo. Baú ignorado
   2 semanas = remover sem dó.

## 10. Encaixe na ordem de execução do espec (§8)

Nada aqui cria fase nova; encaixa nas existentes:
- **Entrega #0-1 (já):** fix da bolinha (diagnóstico alimenta placar) — é a
  Lei Zero, não é gamificação.
- **Entrega #3 (sessão única):** cascata de celebração + selo PERFEITO +
  combo entram AQUI, no player, não depois — celebração é parte do player.
- **Entrega #3.5 (novo, barato):** push de streak em risco + 1 freeze/semana.
- **Entrega #5-6 (trilha/mapa):** baú variável e cosméticos só depois de
  retenção D7 medida — recompensa variável em cima de loop fraco é maquiagem.
- **Instrumentação (PostHog ou eventos ufu_events)**: antes da onda 15/07 se
  der, senão junto com #3. Sem medição, todo o resto é fé.

## Prints que ainda me ajudariam (quando quiser aprofundar)

1. Loja de cristais do Duolingo (pra dissecar a economia completa — o que os
   cristais compram e por quanto).
2. Tela de liga/ranking semanal (mecânica social que ficou fora desta leva).
3. Fim de sessão em dia de marco de streak (7, 30 dias) — as cerimônias de
   marco são as mais copiáveis pro "placar como previsão".
