# Prompt para Lovable — Monetizar o corretor: 1ª correção grátis, depois checkout R$9,90

Cole DEPOIS dos dois prompts anteriores (fix ufu_leads + rota calculadora).

Contexto de negócio: o corretor de redação (/redacao-ufu, requer login) vira o
primeiro produto pago. 1ª correção grátis (captura lead); da 2ª em diante
R$ 9,90 via **link de pagamento hospedado** (Mercado Pago ou Stripe Payment
Link — o Breno cria no painel e cola a URL na config; Pix + cartão, confirmação
automática, nada de chave Pix crua na tela). Liberação do crédito é manual por
enquanto (Breno vê o pagamento no painel e roda 1 SQL); webhook automático
vira um prompt v2.

## 1. Config central — `src/lib/ufu/config.ts` (criar)

```ts
export const UFU_CONFIG = {
  // URLs dos links de pagamento hospedados (Mercado Pago / Stripe) — Breno preenche
  CHECKOUT_CORRECAO_AVULSA: "",   // R$ 9,90 — 1 correção
  CHECKOUT_PACOTE_5: "",          // R$ 39 — 5 correções
  WHATSAPP_BRENO: "5534999999999", // suporte/liberação rápida — Breno preenche
  GRUPO_WHATSAPP_URL: "",          // link do grupo Placar UFU — Breno preenche
  CORRECOES_GRATIS: 1,
};
```

## 2. Migration — créditos + saldo server-side

```sql
-- Créditos comprados/concedidos. Só service_role escreve (liberação manual
-- pelo Breno via SQL editor ou dashboard após confirmar o Pix).
create table if not exists public.ufu_creditos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  qtd integer not null,
  motivo text default 'pix',
  created_at timestamptz not null default now()
);
alter table public.ufu_creditos enable row level security;
create policy "ufu_creditos_select_own" on public.ufu_creditos
  for select to authenticated using (auth.uid() = user_id);
-- (nenhuma policy de insert para authenticated: só service_role insere)

-- Registro de USO server-side. Hoje quem grava a correção é o CLIENTE
-- (insert em `essays` no RedacaoUfu.tsx) — burlável e mistura ENEM.
-- O uso passa a ser gravado pela própria edge function:
create table if not exists public.ufu_correcoes_uso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.ufu_correcoes_uso enable row level security;
create policy "ufu_uso_select_own" on public.ufu_correcoes_uso
  for select to authenticated using (auth.uid() = user_id);
-- (sem insert para authenticated: só a edge function, via service_role)

-- Saldo = grátis(1) + créditos - usos.
create or replace function public.ufu_correcoes_saldo(p_user uuid)
  returns integer language sql security definer set search_path = public as $$
    select 1
      + coalesce((select sum(qtd) from ufu_creditos where user_id = p_user), 0)::int
      - coalesce((select count(*) from ufu_correcoes_uso where user_id = p_user), 0)::int;
  $$;
grant execute on function public.ufu_correcoes_saldo(uuid) to authenticated;
```

## 3. Edge function `analyze-essay-ufu` — checar saldo e registrar uso

No início do handler, com o client service-role:
1. Chamar `ufu_correcoes_saldo(user_id)`. Se `<= 0`, retornar **402** com
   `{ code: "sem_creditos" }` SEM gastar tokens de IA.
2. Se a correção rodar com sucesso, inserir `{ user_id }` em
   `ufu_correcoes_uso` (service_role) antes de responder.

(A checagem e o registro TÊM que ser na edge function — o insert em `essays`
feito pelo cliente continua como está, mas não conta pra quota.)
O `improve-essay-ufu` (versão evoluída) NÃO consome crédito — faz parte da
mesma correção.

## 4. `src/pages/RedacaoUfu.tsx` — paywall + saldo

- Buscar o saldo via `supabase.rpc('ufu_correcoes_saldo', { p_user: user.id })`
  ao carregar; mostrar discreto: "Você tem N correção(ões) disponível(is)".
- Se saldo ≤ 0 (ou a function retornar 402), mostrar o **PaywallCard** no lugar
  do formulário:
  - Título: "Correção completa nos 5 critérios da banca DIRPS"
  - Duas opções lado a lado: **Avulsa R$ 9,90** e **Pacote 5 por R$ 39**
    ("R$ 7,80 cada"). Cada botão "Comprar" abre o link da config
    (CHECKOUT_CORRECAO_AVULSA / CHECKOUT_PACOTE_5) em nova aba.
  - Selo de confiança abaixo dos botões: "Pagamento seguro (Pix ou cartão)
    · Garantia incondicional de 7 dias · Liberação em poucos minutos"
  - Instrução pós-compra: "Pagou? Sua correção é liberada em poucos minutos.
    Demorou? Me chama:" + botão discreto → `https://wa.me/${WHATSAPP_BRENO}?text=`
    com mensagem pré-preenchida "Oi! Comprei a correção do Placar UFU — meu
    e-mail de cadastro é {email do user}." (canal de SUPORTE, não de comprovante)
  - Rodapé: "Placar UFU · um produto Inteligência Atlas"
  - Se os links da config estiverem vazios, mostrar "abrindo em breve" com o
    botão desabilitado (não quebrar).
- Registrar `trackUfu('calc_completed', { evento: 'paywall_visto' })` quando o
  paywall renderizar e `{ evento: 'paywall_click', plano: 'avulsa'|'pacote5' }`
  no clique de compra.

## 5. Cadastro do corretor vira lead

Onde o usuário cria conta para usar o corretor (Signup/Onboarding): adicionar
campo **WhatsApp (opcional)** e, após signup bem-sucedido, inserir em
`ufu_leads` (upsert por email, `origem: 'corretor'`, whatsapp se preenchido).
Ignorar erro de duplicata (23505) como no ListaUfu.

## 6. Convite pro grupo WhatsApp nas telas de sucesso

Se `UFU_CONFIG.GRUPO_WHATSAPP_URL` não estiver vazio, mostrar botão
"Entrar no grupo do Placar UFU no WhatsApp" em: (a) tela de sucesso do
ListaUfu, (b) tela pós-correção do RedacaoUfu. Se vazio, não renderizar nada.

## 7. Verificação

1. Usuário novo: corrige 1 redação grátis → saldo 0 → paywall aparece; edge
   function retorna 402 (não gasta IA) se tentar de novo.
2. `insert into ufu_creditos (user_id, qtd) values ('<id>', 1);` via SQL editor
   → usuário volta a conseguir corrigir.
3. Signup novo gera linha em `ufu_leads` com `origem='corretor'`.
4. Botões "Comprar" abrem os links da config em nova aba; com config vazia,
   aparecem desabilitados sem quebrar a página.
5. Botão do WhatsApp abre conversa com a mensagem pré-preenchida.

## 8. Operação do Breno (fora da Lovable)

1. Criar os 2 links de pagamento no painel (Mercado Pago recomendado: marca
   conhecida + Pix + cartão parcelado; nome do recebedor = "Placar UFU" ou
   "Inteligência Atlas"). Colar as URLs no config.ts.
2. Quando cair pagamento (notificação do painel): achar o user pelo e-mail e
   rodar `insert into ufu_creditos (user_id, qtd, motivo) values ('<id>', 1, 'pix');`
   (qtd 5 no pacote).
3. Ativar a garantia de 7 dias sem burocracia: pediu reembolso, devolve pelo
   próprio painel.
