
## Checklist de Prontidão para Lançamento

### 🔴 Críticos (Devem ser corrigidos)

**1. Autenticação no `generate-flashcard`**
- A edge function não valida sessão do usuário
- Qualquer pessoa pode consumir API AI sem login
- **Fix**: Adicionar validação de `Authorization` header e verificar `supabase.auth.getUser()`

**2. Storage bucket `question-images` muito permissivo**
- Qualquer usuário autenticado pode deletar/modificar imagens de outros
- **Fix**: Restringir policies para `(storage.foldername(name))[1] = auth.uid()::text`

---

### 🟡 Recomendados (Baixo risco, bom fazer)

**3. Leaked Password Protection desabilitado**
- Senhas vazadas não são bloqueadas no signup
- **Ação**: Ativar em Lovable Cloud → Auth → Security settings

**4. React warning no `ProfileMenu`**
- Warning de ref em `DropdownMenuContent` (cosmético)
- **Fix**: Adicionar `forwardRef` no componente

---

### ✅ Já está OK

| Área | Status |
|------|--------|
| RLS em todas as tabelas | ✓ Coberto |
| Fluxo de pagamento Stripe | ✓ Sincroniza plan_type |
| Onboarding simplificado | ✓ Recém implementado |
| Autenticação (signup/login) | ✓ Funcionando |
| Admin protegido server-side | ✓ via `has_role` |
| check-subscription | ✓ Com sync automático |

---

### 📋 Ações sugeridas

1. **Corrigir `generate-flashcard`** — adicionar auth check
2. **Restringir storage policies** — question-images bucket
3. (Opcional) Ativar leaked password protection
4. **Testar fluxo completo**: Signup → Onboarding → Plano → Checkout → PRO ativo

Esses 2 fixes de segurança são rápidos (~20 min total) e eliminam os riscos de abuso de API e manipulação de dados.
