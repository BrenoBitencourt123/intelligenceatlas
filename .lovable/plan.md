

# Plano: Melhorias Prioritárias do Atlas (sem trial de 7 dias)

Baseado na análise estratégica aprovada, vamos implementar as correções e melhorias de maior impacto na conversão e retenção. Dividido em 5 tarefas.

---

## 1. Corrigir link placeholder do WhatsApp no FounderSignup

**Arquivo:** `src/pages/FounderSignup.tsx` (linha 205)

O link `"https://chat.whatsapp.com/SEU_LINK_AQUI"` precisa ser substituído por um link real. Como não temos o link ainda, vamos perguntar ao usuário qual é o link do grupo VIP.

---

## 2. Adicionar "Esqueci minha senha" no Login + criar rota de reset

**Arquivos:**
- `src/pages/Login.tsx` — adicionar link "Esqueci minha senha?" abaixo do campo de senha, que dispara `supabase.auth.resetPasswordForEmail(email)` com toast de confirmação
- `src/pages/ResetPassword.tsx` — nova página que captura o token da URL e permite definir nova senha via `supabase.auth.updateUser({ password })`
- `src/App.tsx` — adicionar rota `/reset-password` (pública)

---

## 3. Criar landing page pública para visitantes não logados

**Arquivos:**
- `src/pages/Landing.tsx` — nova página pública com: hero (headline + CTA cadastro), 3 pilares (reutilizar dados de `PILLARS`), seção de preços (Free vs Pro), FAQ básico, footer
- `src/App.tsx` — a rota `/` para visitantes não logados mostra Landing; logados vão para Today (manter `ProtectedRoute` mas adicionar redirect inteligente)

A landing deve ser indexável (SEO), ter copy focada em ENEM, e CTAs para `/cadastro` e `/fundadores`.

---

## 4. Adicionar link "Esqueci minha senha" e links de Termos/Privacidade funcionais

**Arquivo:** `src/pages/Founders.tsx` (linhas 573-579)

Os links de "Termos de uso" e "Política de privacidade" apontam para `#`. Vamos criar páginas estáticas simples (`/termos` e `/privacidade`) com conteúdo genérico mas válido legalmente, e atualizar os links.

**Novos arquivos:**
- `src/pages/Terms.tsx`
- `src/pages/Privacy.tsx`

---

## 5. Tornar telefone opcional no Onboarding

**Arquivo:** `src/pages/Onboarding.tsx`

Remover o `*` (obrigatório) do campo telefone e ajustar a validação para permitir envio sem telefone. Reduz fricção no cadastro.

---

## Resumo de arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/pages/FounderSignup.tsx` — link WhatsApp |
| Editar | `src/pages/Login.tsx` — link esqueci senha |
| Criar | `src/pages/ResetPassword.tsx` |
| Criar | `src/pages/Landing.tsx` |
| Criar | `src/pages/Terms.tsx` |
| Criar | `src/pages/Privacy.tsx` |
| Editar | `src/pages/Founders.tsx` — links footer |
| Editar | `src/pages/Onboarding.tsx` — telefone opcional |
| Editar | `src/App.tsx` — novas rotas |

