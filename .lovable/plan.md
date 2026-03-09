

# Plano: Nome + Telefone no Cadastro, Onboarding só para configuração

## Mudanças

### 1. `src/pages/Signup.tsx` — Adicionar campos Nome e Telefone

Adicionar dois campos novos entre Email e Senha:
- **Nome** (obrigatório) — `input text`
- **Telefone / WhatsApp** (obrigatório) — `input tel`, placeholder `(11) 99999-9999`

Após `signUp` bem-sucedido (sem erro), salvar nome e telefone no perfil via `supabase.from('profiles').update({ name, phone }).eq('id', data.user.id)`. O `signUp` retorna o `user` no `data`, então precisamos ajustar o retorno no AuthContext.

### 2. `src/contexts/AuthContext.tsx` — Retornar `data` do signUp

Alterar `signUp` para retornar `{ error, data }` em vez de só `{ error }`, para que o Signup.tsx tenha acesso ao `user.id` e possa fazer o update no perfil.

Assinatura atualizada:
```typescript
signUp: (email: string, password: string) => Promise<{ error: Error | null; data: any }>;
```

### 3. `src/pages/Onboarding.tsx` — Remover Step 1 (Nome + Telefone)

- Remover o Step 1 completamente (nome e telefone)
- O onboarding passa de 4 para 3 steps:
  - **Step 1**: Língua estrangeira (antigo step 2)
  - **Step 2**: Áreas de foco (antigo step 3)
  - **Step 3**: Cronograma (antigo step 4)
- Remover states `name` e `phone`
- No `handleFinish`, remover o update de `name` e `phone` no profiles (já foram salvos no cadastro)
- Remover imports não utilizados (`Phone`, `BookOpen`)

### 4. Sobre mensagens automáticas

Para envio automático de WhatsApp após cadastro, existem duas opções viáveis:

- **Webhook + n8n/Make**: Criar uma edge function `on-signup-webhook` que é chamada por um database trigger no insert da tabela `profiles`. A function dispara um webhook para n8n/Make, que envia a mensagem via WhatsApp Business API. Requer conta na API do WhatsApp (~R$0,15/msg).

- **Email de boas-vindas**: Customizar o email de confirmação de cadastro com conteúdo de boas-vindas, regras e link do grupo VIP. Custo zero, funciona nativamente.

A automação de WhatsApp depende de uma API paga externa. Recomendo começar com o email customizado e adicionar WhatsApp quando tiver o volume.

---

## Resumo de arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/pages/Signup.tsx` — campos nome + telefone |
| Editar | `src/contexts/AuthContext.tsx` — retornar data do signUp |
| Editar | `src/pages/Onboarding.tsx` — remover step 1, reordenar steps |

