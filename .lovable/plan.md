

## Plano: Push Notifications PWA + Página de Instalação

### Visão geral
Implementar Web Push Notifications para lembretes diários (área de estudo do dia + tema de redação) e criar uma experiência de instalação do PWA como app nativo. A logo do Atlas (triângulo) será usada como ícone das notificações.

### Mudanças

**1. Tabela `push_subscriptions` (migração)**
- `id`, `user_id` (ref profiles), `endpoint`, `p256dh`, `auth`, `created_at`
- RLS: usuário só lê/escreve suas próprias subscriptions

**2. Gerar VAPID keys (secret)**
- Adicionar secrets `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` via tool
- Expor a chave pública no client via variável de ambiente ou edge function

**3. Custom Service Worker (`public/sw-push.js`)**
- Listener `push` que exibe notificação com ícone `/icon-192.png` (logo Atlas)
- Listener `notificationclick` que abre o app na rota relevante (`/` ou `/redacao`)

**4. Hook `useNotifications`**
- Verifica suporte a `Notification` e `PushManager`
- Pede permissão, cria subscription com VAPID public key
- Salva subscription no banco via `push_subscriptions`

**5. Edge function `send-push` (cron ou invocação manual)**
- Consulta `push_subscriptions` + `user_preferences` (schedule do dia)
- Monta payload: "Hoje é dia de [Área] — [X questões]" ou "Tema do dia: [título]"
- Envia via Web Push protocol usando `web-push` lib
- Pode ser agendada via cron (ex: 8h da manhã)

**6. Integração no app**
- No `Today.tsx` ou `MainLayout`, chamar `useNotifications` para solicitar permissão (com UI sutil, tipo banner ou botão)
- Configurar o VitePWA para não cachear `/~oauth` (navigateFallbackDenylist)

**7. Página/componente de instalação PWA**
- Banner ou prompt na Home incentivando "Instalar o Atlas" quando `beforeinstallprompt` estiver disponível
- Instruções para iOS (Safari → Compartilhar → Adicionar à Tela de Início)

### Ordem de execução
1. Gerar VAPID keys e adicionar como secrets
2. Criar tabela `push_subscriptions`
3. Criar `sw-push.js` (service worker de push)
4. Criar hook `useNotifications`
5. Criar edge function `send-push`
6. Integrar UI de permissão + banner de instalação
7. Atualizar `vite.config.ts` (navigateFallbackDenylist)

