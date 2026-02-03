

# Plano: Corrigir Checkout do Stripe no Mobile

## Problema Identificado

O código atual usa `window.open(data.url, '_blank')` dentro de uma Promise assíncrona:

```typescript
const handleUpgrade = async () => {
  const { data } = await supabase.functions.invoke('create-checkout', {...});
  if (data?.url) {
    window.open(data.url, '_blank');  // BLOQUEADO no mobile!
  }
};
```

Navegadores móveis bloqueiam `window.open` quando chamado fora do contexto direto de clique do usuário. Como há uma chamada assíncrona antes, o navegador não considera mais como ação iniciada pelo usuário.

## Solucao

Usar `window.location.href` para redirecionar na mesma aba, em vez de tentar abrir uma nova aba. Isso funciona consistentemente em todos os dispositivos.

## Alteracoes

### Arquivo: `src/pages/Plan.tsx`

**Antes (linha 80-82):**
```typescript
if (data?.url) {
  window.open(data.url, '_blank');
}
```

**Depois:**
```typescript
if (data?.url) {
  window.location.href = data.url;
}
```

Mesma alteracao para o `handleManageSubscription` (linha 98-100):

**Antes:**
```typescript
if (data?.url) {
  window.open(data.url, '_blank');
}
```

**Depois:**
```typescript
if (data?.url) {
  window.location.href = data.url;
}
```

## Por que Isso Funciona

- `window.location.href` redireciona o usuario na mesma aba
- Funciona em todos os navegadores (desktop e mobile)
- Apos o pagamento, o Stripe redireciona de volta para `/plano?success=true`
- O fluxo de verificacao de assinatura ja esta preparado para isso

## Comportamento Apos a Mudanca

1. Usuario clica em "Fazer upgrade para Pro"
2. Pagina redireciona para o Stripe Checkout (mesma aba)
3. Usuario completa o pagamento
4. Stripe redireciona para `/plano?success=true`
5. Sistema verifica a assinatura e atualiza o plano

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Plan.tsx` | Substituir `window.open(url, '_blank')` por `window.location.href = url` em 2 lugares |

## Secao Tecnica

A razao tecnica e que navegadores implementam uma politica de seguranca onde popups so podem ser abertos em resposta direta a uma acao do usuario (clique). Quando ha codigo assincrono entre o clique e o `window.open`, o navegador perde a conexao com o evento original e bloqueia a abertura.

