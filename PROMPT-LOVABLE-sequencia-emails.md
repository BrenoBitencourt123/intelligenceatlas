# Prompt para Lovable — Sequência automática de 7 dias (Resend)

⏳ GATILHO PRA COLAR ESTE PROMPT: lista com 30+ contatos. Antes disso,
mensagem manual no grupo resolve e o esforço vai pra aquisição.
Pré-requisito: conta no Resend (resend.com) com domínio inteligenciatlas.com
verificado; salvar RESEND_API_KEY como secret das edge functions.

Contexto: hoje o lead entra em `ufu_leads` e esfria. Esta sequência faz o
lead andar sozinho: guia → vilão → correção grátis → folga → pré-venda.

## 1. Migration — controle de envio

```sql
alter table public.ufu_leads
  add column if not exists nurture_step int not null default 0,
  add column if not exists nurture_last_at timestamptz,
  add column if not exists unsubscribed boolean not null default false;
```

## 2. Edge function `send-nurture` (agendada de hora em hora)

Agendar via pg_cron (ou Supabase scheduled functions). Lógica:
- Buscar leads com `unsubscribed = false` e `nurture_step < 5` em que
  `now() - coalesce(nurture_last_at, created_at)` ≥ o intervalo do próximo
  passo (D0: imediato; D1: +1 dia; D2: +1; D4: +2; D6: +2).
- Enviar via Resend (from: "Breno · Placar UFU <breno@inteligenciatlas.com>")
  e atualizar `nurture_step`/`nurture_last_at`. Máx. 50 envios por execução.
- TODO e-mail termina com link de descadastro:
  `https://inteligenciatlas.com/descadastro?email=...` → rota pública simples
  que seta `unsubscribed = true` (obrigatório, LGPD).

## 3. Os 5 e-mails (texto pronto — {nome_curso} vem do campo curso do lead)

**E-mail 1 (D0) — assunto: "Seu guia de folga de {nome_curso} 📊"**
Oi! Aqui está seu guia: [link do guia do curso]. Ele mostra o número que
quase ninguém olha: a diferença entre passar no corte e ter a vaga.
Spoiler: a UFU chama ~6× mais gente pra 2ª fase do que tem vaga.
— Breno, Placar UFU (também candidato, Mecatrônica 2027)

**E-mail 2 (D1) — assunto: "o erro que reprova quem passou"**
Esse ano teve gente que cruzou o corte da objetiva e ficou sem vaga.
Não por burrice — por mirar no alvo errado. O corte só te coloca na
disputa da redação, com até 6 candidatos por vaga. [3 linhas explicando
zona perigosa] O guia mostra sua meta com folga: [link].

**E-mail 3 (D2) — assunto: "sua redação, corrigida como a banca corrige (grátis)"**
A DIRPS corrige em 5 critérios que quase ninguém conhece — e zera fuga de
gênero. Eu montei um corretor que aplica a rubrica oficial do edital.
A primeira correção é por minha conta: [link /redacao-ufu]. Leva 3 minutos
e você descobre exatamente onde está perdendo ponto.

**E-mail 4 (D4) — assunto: "45, 38, 47 não é folga — é sorte"**
Folga de verdade é média MENOS variação acima da meta. [2 parágrafos:
como medir com simulado, por que peso 3 muda tudo pro curso dele]
Calcule seu cenário: [link calculadora].

**E-mail 5 (D6) — assunto: "tô abrindo 20 vagas (você viu primeiro)"**
Tô construindo o Placar UFU em público: trilha pelos pesos do SEU curso,
simulados, correções. Vou abrir 20 vagas fundadoras a R$ 149 (depois
R$ 249). Quem está nesta lista fica sabendo primeiro. Enquanto isso,
me responde: qual sua maior trava hoje? Eu leio tudo.
(⚠ Este e-mail só entra quando a pré-venda estiver armada — deixar o passo
5 desativado por flag até o Breno ligar.)

## 4. Verificação
1. Lead novo recebe o e-mail 1 em até 1h; steps avançam nos dias certos.
2. Descadastro funciona e para os envios.
3. Nenhum lead recebe o mesmo passo duas vezes (checar nurture_step).
