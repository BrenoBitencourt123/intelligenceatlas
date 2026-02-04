
# Plano: Face ID, Apple Pay e Destaque no Card Bloqueado

## 1. Sobre Apple Pay / Google Pay no Checkout

### Situacao Atual
O Stripe Embedded Checkout ja suporta Apple Pay e Google Pay **automaticamente**. Voce confirmou que habilitou no Stripe Dashboard.

### Por que nao aparece como um "double-click" igual app nativo?

O comportamento que voce descreve (clicar 2x no botao lateral do iPhone para pagar com Face ID) e exclusivo de **apps nativos** usando o Apple Pay SDK nativo. No navegador web:

- Apple Pay aparece como um botao dentro do checkout
- Ao clicar, abre o sheet nativo do Apple Pay
- Usuario confirma com Face ID/Touch ID

Para ter a experiencia nativa completa (double-click no botao lateral), seria necessario:
1. Transformar o app em nativo via **Capacitor**
2. Usar o plugin `@capacitor-community/stripe` ou `cordova-plugin-stripe-apple-pay`

**Limitacao web**: O navegador nao consegue interceptar o gesto de double-click fisico do iPhone - isso so funciona em apps instalados via App Store.

---

## 2. Face ID / Touch ID para Login (WebAuthn/Passkeys)

### O que vamos implementar

Um sistema de login biometrico via **WebAuthn** que permite:
- Usuarios registrarem uma passkey (Face ID/Touch ID)
- Login rapido com biometria, sem digitar senha

### Bibliotecas Necessarias

```bash
npm install @simplewebauthn/browser
```

### Arquitetura

```text
Frontend (React)                    Backend (Edge Function)
+------------------+                +----------------------+
| Login Page       |                | webauthn-register    |
|   - Botao FaceID | ---register--> | - Gera challenge     |
|                  | <--options---- | - Salva credencial   |
|   - Biometria    | ---verify----> +----------------------+
|                  |                | webauthn-authenticate|
|                  | <--session---- | - Verifica assinatura|
+------------------+                +----------------------+
```

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/webauthn-register/index.ts` | Edge function para registrar passkey |
| `supabase/functions/webauthn-authenticate/index.ts` | Edge function para autenticar |
| `src/hooks/usePasskey.ts` | Hook para gerenciar passkeys |
| `src/components/auth/PasskeyButton.tsx` | Botao de login com Face ID |

### Tabela Nova no Banco

```sql
CREATE TABLE passkey_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE passkey_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own passkeys"
ON passkey_credentials FOR ALL
USING (auth.uid() = user_id);
```

### Fluxo de Registro

1. Usuario faz login normal (email/senha)
2. No perfil, botao "Adicionar Face ID"
3. Frontend chama `startRegistration()` do simplewebauthn
4. Navegador mostra prompt de Face ID/Touch ID
5. Credencial salva no banco

### Fluxo de Login

1. Tela de login mostra botao "Entrar com Face ID"
2. Frontend chama `startAuthentication()`
3. Navegador mostra prompt de Face ID/Touch ID
4. Backend verifica e retorna sessao

### Codigo do Botao (Preview)

```tsx
// src/components/auth/PasskeyButton.tsx
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { Fingerprint } from 'lucide-react';

export const PasskeyButton = ({ onSuccess }) => {
  const [supported, setSupported] = useState(false);
  
  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);

  if (!supported) return null;

  const handlePasskeyLogin = async () => {
    const options = await supabase.functions.invoke('webauthn-authenticate', {
      body: { action: 'start' }
    });
    
    const credential = await startAuthentication(options.data);
    
    const result = await supabase.functions.invoke('webauthn-authenticate', {
      body: { action: 'verify', credential }
    });
    
    if (result.data?.session) {
      onSuccess(result.data.session);
    }
  };

  return (
    <Button variant="outline" onClick={handlePasskeyLogin}>
      <Fingerprint className="h-5 w-5 mr-2" />
      Entrar com Face ID
    </Button>
  );
};
```

---

## 3. Destaque no LockedThemeCard

### Mudancas no Componente

Aplicar o mesmo estilo amber do card Pro na pagina de planos:

**Arquivo:** `src/components/home/LockedThemeCard.tsx`

### De (atual):
```tsx
<Card className="border-2 border-dashed border-muted-foreground/30">
```

### Para (novo):
```tsx
<Card className="border-2 border-amber-500/70 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent">
```

### Icone do cadeado tambem em amber:
```tsx
<div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
  <Lock className="h-6 w-6 text-amber-500" />
</div>
```

### Botao com estilo Pro:
```tsx
<Button 
  onClick={() => navigate('/plano')} 
  className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
  size="lg"
>
  Ver Plano Pro
  <ArrowRight className="h-4 w-4" />
</Button>
```

---

## Resumo dos Arquivos

### Tarefa 1: Face ID para Login

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/xxx_passkeys.sql` | Criar tabela passkey_credentials |
| `supabase/functions/webauthn-register/index.ts` | Criar edge function de registro |
| `supabase/functions/webauthn-authenticate/index.ts` | Criar edge function de autenticacao |
| `src/hooks/usePasskey.ts` | Criar hook de gerenciamento |
| `src/components/auth/PasskeyButton.tsx` | Criar componente de botao |
| `src/pages/Login.tsx` | Adicionar botao de Face ID |
| `src/pages/Profile.tsx` | Adicionar opcao de registrar passkey |

### Tarefa 2: Destaque no Card Bloqueado

| Arquivo | Acao |
|---------|------|
| `src/components/home/LockedThemeCard.tsx` | Atualizar estilos para amber |

---

## Dependencias a Instalar

```bash
npm install @simplewebauthn/browser @simplewebauthn/server
```

## Observacoes Importantes

1. **WebAuthn so funciona em HTTPS** - Funciona no preview e producao, mas nao em localhost HTTP
2. **Apple Pay no navegador** - Aparece como botao, nao como double-click nativo
3. **Para experiencia nativa completa** - Seria necessario converter para app via Capacitor

