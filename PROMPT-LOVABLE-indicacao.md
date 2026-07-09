# Prompt para Lovable — Loop de indicação (card + link de amigo)

⏳ GATILHO PRA COLAR ESTE PROMPT: existirem 10+ compradores (qualquer
produto). Indicação sem base de clientes é motor sem combustível.

Contexto: o card compartilhável já traz gente; este prompt fecha o ciclo
medindo QUEM trouxe e recompensando.

## 1. Migration
```sql
alter table public.profiles
  add column if not exists ref_code text unique;
alter table public.ufu_leads
  add column if not exists ref text;
-- gerar ref_code curto (6 chars) pros perfis existentes e novos (trigger).
```

## 2. Mecânica
- Todo link compartilhável do app (card do placar, card da calculadora,
  botão "desafie um amigo" no resultado do /placar) ganha `?ref={ref_code}`.
- `/placar`, `/calculadora-ufu` e `/ufu/lista` leem `?ref` e propagam até a
  captura → gravar em `ufu_leads.ref`.
- Tela "Indique um amigo" no Perfil: mostra o link do usuário + contador
  ("3 amigos fizeram o placar pelo seu link") via função
  `ref_stats(ref_code)` (security definer, só contagem).
- Recompensa v1 (manual, sem código): a cada 3 indicados capturados,
  Breno adiciona 1 crédito de correção (`ufu_creditos`, motivo 'indicacao')
  e avisa no WhatsApp. Automatizar só se o volume justificar.

## 3. Copy do botão no resultado do /placar
"Desafie um amigo: consegue mais que {acertos}/10?" — compartilha o link
com ref. Competição entre adolescentes > altruísmo.

## 4. Verificação
1. Link com ?ref → captura grava o ref.
2. Contador do perfil bate com as linhas de ufu_leads.
3. Link sem ref continua funcionando normal.
