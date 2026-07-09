# Prompt para Lovable — Voltar ao destino após cadastro/onboarding (fecha vazamento do funil)

Problema: usuário deslogado clica em "Corrigir minha redação" (vindo do pSEO/guia),
cai em /login com `state.from` preservado — mas se ele CRIA conta, o fluxo
Signup → Onboarding termina com `navigate('/hoje')` e ele nunca volta ao
corretor. Perde-se o usuário no momento de maior intenção.

## Mudanças

1. **Persistir o destino:** em `/login` e `/signup`, se existir
   `location.state.from`, salvar em `sessionStorage.setItem('redirect_after_auth',
   from.pathname + from.search)`. No link de /login para /signup (e vice-versa),
   repassar o `state.from`.

2. **Onboarding devolve pro destino:** em `Onboarding.tsx`, ao concluir,
   em vez de `navigate('/hoje')` fixo:
   ```ts
   const dest = sessionStorage.getItem('redirect_after_auth');
   sessionStorage.removeItem('redirect_after_auth');
   navigate(dest || '/hoje', { replace: true });
   ```
   Mesma lógica no pós-login/pós-signup quando o usuário JÁ completou onboarding.

3. **Contexto na tela de auth:** em /login e /signup, se o destino for
   `/redacao-ufu`, trocar o subtítulo por: "Crie sua conta grátis para corrigir
   sua redação nos 5 critérios da banca DIRPS — a primeira correção é por nossa
   conta." (mantém o texto padrão nos demais casos).

## Verificação

1. Deslogado → abrir `/redacao-ufu` → criar conta nova → completar onboarding →
   deve cair em `/redacao-ufu`, não em `/hoje`.
2. Mesmo caminho com conta existente (login) → também volta pro corretor.
3. Fluxo normal (entrar pelo site sem destino) → continua caindo em `/hoje`.
