
# Plano para Corrigir Acesso ao Painel Admin

## Problema Identificado

Após investigação detalhada, encontrei **dois problemas** que causam o "Acesso Negado":

### 1. Race Condition no useIsAdmin
O hook `useIsAdmin` executa antes do `AuthContext` terminar de carregar a sessão do usuário:

```text
Timeline do problema:
+--------------------+--------------------+--------------------+
| AuthContext        | useIsAdmin         | Admin.tsx          |
+--------------------+--------------------+--------------------+
| loading = true     |                    |                    |
| user = null        | user = null        |                    |
|                    | isAdmin = false    |                    |
|                    | isLoading = false  | !isAdmin? REDIRECT!|
|                    |                    | << Acesso negado   |
| loading = false    |                    |                    |
| user = {...}       | (tarde demais)     |                    |
+--------------------+--------------------+--------------------+
```

O hook decide `isAdmin = false` **antes** do auth terminar de carregar.

### 2. Rota /admin Desprotegida
A rota `/admin` não usa `ProtectedRoute`, então não há garantia de que o auth está pronto.

## Confirmação no Banco de Dados

O usuário `brenobitencourt123@gmail.com` (ID: `ac04c1d0-7534-4ce5-8399-722a655e4e93`) **TEM** a role admin corretamente configurada no banco:
- Tabela `user_roles`: role = 'admin'
- Função `has_role()` retorna `true` quando testada diretamente

## Solução Proposta

### Correção do useIsAdmin (src/hooks/useIsAdmin.ts)

Modificar o hook para:
1. Usar o estado `loading` do AuthContext
2. Só verificar admin quando o auth estiver pronto
3. Manter `isLoading = true` enquanto auth carrega

```typescript
export const useIsAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Esperar o auth terminar de carregar
      if (authLoading) {
        return; // Mantém isChecking = true
      }

      if (!user) {
        setIsAdmin(false);
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) {
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading]);

  // isLoading é true enquanto auth OU verificação de admin estiver pendente
  return { isAdmin, isLoading: authLoading || isChecking };
};
```

### Opcional: Proteger Rota Admin (src/App.tsx)

Adicionar `ProtectedRoute` à rota `/admin`:

```typescript
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <Admin />
    </ProtectedRoute>
  }
/>
```

Isso garante que o usuário está autenticado antes de tentar verificar admin.

## Alternativa: Código Único de Acesso

Se preferir adicionar uma camada extra de segurança (como mencionado), posso implementar um sistema de código único:

1. Admin digita um código (ex: PIN de 6 dígitos)
2. Código é validado contra hash no banco
3. Sessão admin fica ativa por tempo limitado

Esta seria uma feature adicional, não substitui a correção do bug atual.

## Detalhes Técnicos

### Arquivos a Modificar

1. **src/hooks/useIsAdmin.ts** - Adicionar dependência do `authLoading`
2. **src/App.tsx** - Opcional: Proteger rota com ProtectedRoute

### Impacto

- Nenhuma alteração no banco de dados
- Correção compatível com código existente
- Melhora a UX eliminando flash de "acesso negado"

## Resultado Esperado

Após a correção:
1. Usuário acessa `/admin`
2. Tela de loading aparece enquanto auth carrega
3. Hook verifica admin via RPC
4. Painel admin é exibido para usuários com role 'admin'
