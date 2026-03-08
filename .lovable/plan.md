

## Plano: Landing Page de Captação + Cupom Fundadores 50%

### Parte 1 — Cupom "Membros Fundadores" no Stripe

Criar um cupom no Stripe via ferramenta com:
- **50% off**, duração **forever** (aplica em todas as cobranças futuras)
- **Max redemptions: 20** (limite hard no Stripe — após 20 usos, o cupom para de funcionar automaticamente)
- Nome: "Membro Fundador - 50%"

O usuário verá na tela de checkout o preço original (R$49,90) riscado e o valor com desconto (R$24,95), gerando o ancorament visual desejado. Isso já funciona nativamente com o `EmbeddedCheckoutModal` existente que aceita `couponId`.

### Parte 2 — Landing Page (`/fundadores`)

Criar uma nova rota **pública** (sem `ProtectedRoute`) com uma página de alta conversão.

**Estrutura da página:**

1. **Hero Section**
   - Headline forte e direto (ex: "Seja um dos 20 Membros Fundadores")
   - Subtítulo com a proposta de valor + desconto vitalício de 50%
   - Contador de vagas restantes (pode ser estático inicialmente, ou dinâmico via Stripe)
   - Botão CTA principal → scroll para o formulário

2. **Espaço para Vídeo**
   - Placeholder/embed area para o vídeo que será gravado depois
   - Proporção 16:9 com fallback visual elegante

3. **Benefícios rápidos**
   - 3-4 blocos visuais com ícones mostrando o que o membro recebe
   - Questões ilimitadas, redações com IA, flashcards inteligentes, 50% para sempre

4. **Formulário de Captação**
   - Campos: Nome, Email, WhatsApp
   - Salva os leads na tabela `vip_leads` no banco de dados
   - Após envio: tela de confirmação com link/instrução para entrar no grupo WhatsApp

5. **Footer mínimo**
   - Logo + link para o app principal

**Estilo visual:** Consistente com a identidade Atlas — fundo claro, tipografia grande e bold, muito espaço negativo, botões CTA em preto com destaque. Elementos visuais atrativos como badges de "50% OFF VITALÍCIO", contadores de vagas, e micro-animações CSS nos CTAs.

### Parte 3 — Banco de Dados

Nova tabela `vip_leads`:
- `id` (uuid, PK)
- `name` (text)
- `email` (text)
- `whatsapp` (text)
- `created_at` (timestamptz)
- RLS: insert público (sem auth), select apenas admin

### Parte 4 — Integração no App

- Nova rota `/fundadores` pública no `App.tsx`
- Página standalone (sem `MainLayout` / `BottomNav`)

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/Founders.tsx` — Landing page completa |
| Editar | `src/App.tsx` — adicionar rota pública `/fundadores` |
| Criar | Migração SQL — tabela `vip_leads` |
| Criar | Cupom Stripe — 50% forever, max 20 redemptions |

