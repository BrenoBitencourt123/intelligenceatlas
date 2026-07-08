# Prompt para Lovable — Página de captura da lista de interesse (UFU)

Cole na Lovable. É a peça que transforma o tráfego do pSEO em lista (a métrica da
fase). O pSEO já está no ar e as 51 páginas mandam a CTA principal para
`/ufu/lista?curso=<slug>`. Falta existir essa rota.

---

## 1. Banco (Supabase) — tabela + RLS + contagem pública

Rode esta migration. Segue o mesmo padrão da `ufu_events` (anon insere, ninguém
lê linhas pela API; contagem exposta por função, sem vazar dados pessoais):

```sql
-- Lista de interesse UFU. Gatilho de negócio: 50 interessados -> pré-venda
-- fundadora (20 vagas).
create table if not exists public.ufu_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  whatsapp text,
  curso text,               -- slug do curso de origem (vindo do pSEO)
  origem text default 'pseo',
  created_at timestamptz not null default now()
);

create unique index if not exists ufu_leads_email_idx
  on public.ufu_leads (lower(email));

alter table public.ufu_leads enable row level security;

-- Visitante (anon) pode inserir; ninguém lê as linhas via API pública.
create policy "ufu_leads_insert_anon"
  on public.ufu_leads for insert
  to anon, authenticated
  with check (true);

-- Contagem pública SEM expor linhas (para o "Nº X de 50" na tela).
create or replace function public.ufu_leads_count()
  returns integer
  language sql security definer set search_path = public as $$
    select count(*)::int from public.ufu_leads;
  $$;
grant execute on function public.ufu_leads_count() to anon, authenticated;
```

## 2. Rota nova: `/ufu/lista`

Adicione em `src/App.tsx`:
```tsx
<Route path="/ufu/lista" element={<ListaUfu />} />
```
Crie `src/pages/ListaUfu.tsx`. Página pública (sem login), mobile-first, marca
**Placar UFU** (não "Atlas"). Comportamento:

- Lê o query param `?curso=<slug>`. Deriva um nome de exibição a partir do slug:
  pega o trecho antes da palavra de turno (`integral|matutino|noturno|vespertino`),
  troca hífens por espaço e capitaliza. Ex.: `medicina-integral-uberlandia` →
  "Medicina". Se não houver `curso`, use "seu curso".
- Título: **"Guia de folga de {Nome}"** (ou "do seu curso").
- Subtítulo que ancora no gancho do produto: *"Passar no corte não é vaga — a UFU
  classifica ~6× as vagas. O guia mostra quantos acertos te dão folga real em
  {Nome} e onde focar pelos pesos. E você é avisado quando abrir a pré-venda
  fundadora (20 vagas)."*
- Formulário:
  - **E-mail** (obrigatório)
  - **WhatsApp** (opcional — deixa claro "opcional")
  - `curso` (hidden, do query param) e `origem: 'pseo'` (hidden)
- Ao enviar: `insert` em `ufu_leads`. Trate e-mail duplicado como SUCESSO
  (o índice único vai barrar; capture o erro de unique-violation ou use
  `upsert(..., { onConflict: 'email', ignoreDuplicates: true })`) e mostre
  "Você já está na lista ✅".
- Estado de sucesso: mostrar a contagem chamando `supabase.rpc('ufu_leads_count')`
  → **"Você está na lista. Faltam {50 - n} para abrirmos a pré-venda fundadora
  (20 vagas)."** Se n ≥ 50, mostrar "As 20 vagas fundadoras já vão abrir — fique
  de olho no seu e-mail/WhatsApp."
- Ao carregar a página, buscar `ufu_leads_count()` e mostrar um contador discreto
  de prova social (ex.: "{n} pessoas já na lista").
- Instrumentação: registre em `ufu_events` um evento (pode reaproveitar payload)
  ao enviar, se quiser acompanhar conversão pSEO→lista.

## 3. Coerência de marca no funil (só string voltada ao usuário)

O visitante do pSEO cai em "Placar UFU" e hoje bate em telas "Atlas". Alinhe **só
as superfícies do funil** (NÃO varra o app ENEM legado, NÃO renomeie chaves
internas como `atlas-install-dismissed` ou eventos de analytics `atlas_*` — isso
quebra continuidade sem ganho):

- `index.html`: `<title>` hoje "Atlas Intelligence" → **"Placar UFU — Vestibular
  UFU 2026"**; `apple-mobile-web-app-title` e `og:title` idem.
- `src/pages/CalculadoraUfu.tsx` e `src/pages/Landing.tsx`: cabeçalho/logo visível
  = **Placar UFU**.
- Mantenha "Atlas" como marca-mãe onde fizer sentido ("por Atlas"), sem prioridade.

## 4. Depois de aplicar, confirme
1. `inteligenciatlas.com/ufu/lista?curso=medicina-integral-uberlandia` abre, mostra
   "Guia de folga de Medicina" e envia o e-mail para `ufu_leads`.
2. Enviar duas vezes o mesmo e-mail não gera erro feio (trata como já-na-lista).
3. O contador ("Nº X") aparece via `ufu_leads_count()`.
4. As páginas estáticas em `public/ufu/` continuam no deploy.
