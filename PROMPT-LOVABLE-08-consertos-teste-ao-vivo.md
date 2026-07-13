# Prompt para Lovable — Consertos do teste ao vivo de 11/07

Origem: teste real em produção (relatório RELATORIO-TESTE-AO-VIVO-11-07.md).
Ordem interna: itens 1-3 são os que perdem aluno sozinhos.

## 1. PWA: nunca mais servir build velha (P0)

Conta nova recebeu a versão ANTIGA do app até hard-reload (service worker
segurando cache). Fix no vite-plugin-pwa:
- `registerType: 'autoUpdate'`, `skipWaiting: true`, `clientsClaim: true`.
- Rede de segurança: quando o SW detectar versão nova já instalada, toast
  discreto "Atualização pronta — recarregar" que chama `updateSW()`.
- Verificar que navegação SPA não fica cacheada com HTML velho (network-first
  pro index.html).

## 2. Trilha sem beco: horizonte permanente (P0)

Ao dourar a última fase ativa, os placeholders "Em breve" desaparecem e a
trilha vira tela morta — exatamente após a primeira vitória.
- Os 2 placeholders "Em breve: {próxima fase}" devem renderizar SEMPRE que
  não existir fase ativa seguinte (dourado incluído), com subtítulo "sendo
  construída — te aviso quando abrir".
- Quando todas as fases da disciplina estão douradas, o card-missão do dia
  seguinte NÃO pode apontar pro vazio: cair pra revisão/flashcards com copy
  "revisão do que você dourou" até existir fase nova.

## 3. Auth em português (P1)

Interceptar erros do Supabase auth no Signup/Login e mapear os comuns:
- weak/leaked password → "Essa senha é muito comum — escolhe uma mais
  difícil de adivinhar."
- user already registered → "Já existe conta com esse e-mail. Quer entrar?"
- invalid login credentials → "E-mail ou senha errados."
- Fallback genérico em PT pra qualquer outro.

## 4. Streak screen só nasce com dado fresco (P1)

A tela de streak da cascata montou com "0 dias / nada carimbado" e piscou
pro valor certo ~2s depois. Celebração não pode nascer errada:
- Invalidar/refetch a query de stats ANTES de exibir a tela (aguardar o
  refetch resolver; spinner/skeleton de até 2s se precisar).
- Garantir que a resposta recém-gravada da sessão conte no cálculo (o insert
  da última resposta precisa ter resolvido antes do refetch).

## 5. Meta honesta em corte alto (P1)

Medicina: corte 57, meta ceil(57×1,22)=70 → clampado em 65 = "gabarite".
- Nova regra em um único helper (usado por GoalCard, Today, calculadora):
  `metaBruta = ceil(corte*1.22)`; se `metaBruta > 63` → `meta = max(corte+2,
  63)` e flag `folgaComprimida = true`.
- Com a flag: trocar a copy da zona segura por "corte alto: aqui a folga
  real vem da redação (peso 3)" + CTA discreto pro corretor.

## 6. Curso atravessa o funil (P1)

- Calculadora: ao calcular, gravar `localStorage.ufu_curso_pretendido` (slug)
  + cota se selecionada.
- Onboarding: se existir, pré-selecionar curso/modalidade com o texto "vi
  que você quer {curso} — confirma?" (1 toque pra confirmar, opção de trocar).

## 7. Polimento do player (P2, tudo pequeno)

a. Item `info`: o botão "Entendi, bora" avança DIRETO (sem barra Continuar).
b. Acerto visível: opção correta escolhida ganha borda/fundo verde + check
   antes de esmaecer as outras.
c. Erro visível: a opção/par errado ganha borda âmbar; no `ligar`, marcar os
   pares errados no estado de reveal.
d. Combo: badge maior com pulso (mesmo pill, scale 1→1.2→1 ao subir) e
   contador persistente "x7" enquanto vivo.
e. Trocar o "Nó dourado 🥇" do feedback do cume por "Fase dourada 🥇"
   (sobra do vocab — conferir com grep por "nó" em strings visíveis).
f. Select de curso (onboarding e calculadora): virar combobox com busca
   (shadcn Command) — 51 itens sem busca não funciona no touch.
g. Landing: remover/acelerar o fade-in do hero (conteúdo visível < 0,5s).

## 8. Missão de sábado pra quem está no zero de redação (P2)

Se `diagnostico_niveis.redacao === 'nada'` E a fase de redação não está
dourada: missão do dia de redação vira a FASE de redação (não o corretor),
com sublinha "primeiro a base, semana que vem você escreve". Quem já dourou
ou declarou básico+ segue pro corretor normalmente.

## Verificação
1. Deploy novo → aba antiga aberta mostra toast de atualização; conta nova
   nunca vê layout antigo.
2. Dourar a última fase → trilha mostra 2 "Em breve" + missão seguinte cai
   em revisão (sem link morto).
3. Cadastro com senha "12345678" → erro em português.
4. Fase completa → streak screen já abre com o número certo (sem piscar).
5. Medicina AC → meta ≤63 com copy de folga comprimida; Administração segue
   corte+22% normal.
6. Calculadora com Medicina → onboarding pré-preenchido.
7. Info avança com 1 toque; acerto fica verde; combo pulsa; grep sem "nó"
   visível; select tem busca.
