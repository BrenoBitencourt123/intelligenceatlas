
# Plano: Corrigir Checkout + Info sobre Pagamentos Móveis

## Correção Principal: Erro Intermitente no Checkout

### Diagnóstico
O `EmbeddedCheckoutProvider` chama `fetchClientSecret` imediatamente ao montar, antes da sessão estar disponível, causando erro 403.

### Solução
Verificar sessão antes de renderizar o checkout.

**Arquivo:** `src/components/checkout/EmbeddedCheckoutModal.tsx`

**Mudanças:**
1. Importar `useAuth` do contexto de autenticação
2. Obter a sessão atual
3. Mostrar loading enquanto sessão não estiver pronta
4. Só renderizar o `EmbeddedCheckoutProvider` após sessão confirmada

```tsx
import { useAuth } from '@/contexts/AuthContext';

// Dentro do componente:
const { session } = useAuth();

// No return, antes do checkout:
{!session ? (
  <div className="text-center py-8">
    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
    <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
  </div>
) : error ? (
  <div className="text-center py-8">
    <p className="text-destructive text-sm">{error}</p>
  </div>
) : (
  <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
    <EmbeddedCheckout />
  </EmbeddedCheckoutProvider>
)}
```

---

## Sobre Apple Pay e Google Pay

O Stripe Embedded Checkout **já suporta** ambos automaticamente. Eles aparecem quando:

| Requisito | Apple Pay | Google Pay |
|-----------|-----------|------------|
| Dispositivo | iPhone, iPad, Mac | Android, Chrome |
| Navegador | Safari | Chrome, Edge |
| Cartão cadastrado | Apple Wallet | Google Pay |
| Habilitado no Stripe | Dashboard → Payment Methods | Dashboard → Payment Methods |

**Ação necessária:** Verificar no [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods) se Apple Pay e Google Pay estão habilitados.

---

## Sobre Face ID para Login

Face ID/Touch ID para login web é possível via **WebAuthn/Passkeys**, mas:

- Requer implementação específica (não é nativo do Supabase)
- Envolve registro de credenciais biométricas no dispositivo
- Para apps nativos (Capacitor), usa-se plugin de biometria

**Recomendação:** Implementar como projeto separado depois das correções atuais.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/checkout/EmbeddedCheckoutModal.tsx` | Verificar sessão antes de renderizar checkout |

## Resultado Esperado

- Modal de checkout só carrega após sessão confirmada
- Elimina erros "No authorization header"
- Funciona consistentemente em preview e produção
- Apple Pay/Google Pay aparecem automaticamente nos dispositivos compatíveis
