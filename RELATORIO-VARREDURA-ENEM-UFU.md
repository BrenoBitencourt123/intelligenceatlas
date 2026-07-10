# Varredura precisa: ENEM × UFU no mesmo repo
> Gerada em 10/07/2026 por análise do grafo de imports (a partir das rotas do
> App.tsx), das chamadas a edge functions e do uso de tabelas. Não é opinião
> por nome de arquivo — cada item abaixo foi rastreado por dependência real.

## O mapa em números

| Categoria | Arquivos | O que é |
|---|---|---|
| UFU puro | 14 | O funil novo (calculadora, lista, passe, corretor, trilha, landing) |
| ENEM puro | 71 | O app antigo inteiro, ainda roteado e vivo |
| Compartilhado (ambos) | 11 | Auth, layout, supabase client — infraestrutura |
| Compartilhado (auth/admin) | 21 | Login, Signup, Profile, Admin e seus componentes |
| Código morto (inalcançável) | ~30 | Nada importa; já está desligado sem você saber |

Nota boa: a **Landing.tsx da raiz já é UFU** ("Placar UFU") — o visitante
anônimo em `/` vê o produto certo. O vazamento é só pós-login/pós-cadastro.

---

## LISTA 1 — Eliminar AGORA (zero risco, nada referencia)

### Dados na raiz do repo (~60MB, nenhum import no código)
```
_extracao_enem2023_dia1/            (41MB)
json das questões/                  (9,7MB)
questoes_2025_dia1_com_imagens.json (5,8MB)
questoes_2025_dia1_classificado.json
questoes_2025_dia1_v9.json
imagens_enem2025_dia1/              (4,1MB)
Banco de Conteúdo ENEM 2010-2025.xlsx
_extracao_scripts/
```
Ação: mover pra uma pasta `_arquivo-enem/` fora do projeto (backup), tirar do git.

### Código morto (inalcançável a partir do App — já não roda)
- `src/pages/Essay.tsx` — o corretor ENEM antigo **já está desplugado** (sem rota)
- `src/lib/ai.ts`, `src/lib/mockAI.ts`, `src/lib/precheck.ts`, `src/lib/storage.ts`
- `src/hooks/useEssayState.ts`, `useQuotaCheck.ts`, `useOnboardingStatus.ts`, `useUserMastery.ts`
- `src/components/atlas/` — 16 componentes (BlockCard, ResultPanel, ThemeCard...)
- `src/components/home/` — 4 componentes (DailyThemeCard, StatsCard...)
- `src/components/study/EnemQuestionCard.tsx`, `src/types/enemQuestion.ts`
- `src/components/skeletons/EssaySkeleton.tsx`

Consequência em cadeia: com `lib/ai.ts` morto, as edge functions
`analyze-essay` e `improve-essay` (versão ENEM) **não têm mais nenhum
chamador no front** — podem ser removidas do deploy junto.

---

## LISTA 2 — ENEM vivo: desligar rotas primeiro, eliminar depois do sprint (28/07)

O app ENEM inteiro ainda é servido. São 71 arquivos + estas rotas no App.tsx:
`/hoje` `/objetivas` `/flashcards` `/historico` `/onboarding` `/errors`
`/plano` `/bem-vindo` `/diagnostico` `/simulado` `/simulado/sessao`
`/fundadores` `/fundadores/cadastro`

Edge functions só do ENEM: `check-subscription`, `customer-portal`,
`clean-flashcards`, `flashcards-smart`, `generate-flashcard`,
`founders-slots`, `import-enem-api`, `generate-theme`.

Tabelas só do ENEM: `flashcards`, `flashcard_reviews`, `question_attempts`,
`study_sessions`, `user_question_history`, `user_topic_profile`,
`daily_themes`, `vip_leads`.

**Pré-condição pra eliminar:** confirmar que não existe assinante ENEM ativo
(Stripe → subscriptions do produto antigo). Se houver 1 que seja, desligar
rota é quebra de contrato; migrar/reembolsar antes.

**Por que não apagar esta semana:** a onda de tráfego é dia 15/07. O conserto
do vazamento (pós-cadastro → `/hoje`) resolve o dano real com ~10 linhas;
apagar 71 arquivos a 5 dias do lançamento é risco sem retorno.

### Armadilhas mapeadas (o que impede um "delete tudo" cego)
1. `Today.tsx` (ENEM) importa `components/ufu/GoalCard.tsx` — dependência
   cruzada na direção errada. Ao remover Today, o GoalCard fica órfão (ok).
2. `/fundadores` é a página de fundadores do **Atlas ENEM antigo**. Colide
   conceitualmente com a pré-venda "fundadora" UFU do passe. Remover ou
   redirecionar antes da pré-venda pra não confundir comprador.
3. `Onboarding.tsx` é ENEM **e** é o destino do e-mail de confirmação
   (`emailRedirectTo` no AuthContext). Não pode ser deletado sem antes
   trocar o redirect — é o item 1 da lista de conserto do funil.
4. `manifest.json` do PWA ainda diz "Atlas Intelligence" — usuário que
   instalar o app no celular vê marca ENEM. Trocar pra Placar UFU.
5. `EmbeddedCheckoutModal` + `create-checkout` (sem sufixo) são o checkout
   ENEM. Não confundir com `create-checkout-ufu` ao limpar.
6. `index.html`: title/OG "Vestibular UFU 2026" → atualizar pra 2027.

---

## LISTA 3 — Parece ENEM mas é MOTOR: não eliminar

Justificativa: a auditoria de 03/07 concluiu que o valor do pivô é portar
este motor (trocar prompt/taxonomia, não reconstruir). A trilha UFU real —
que o passe de R$ 149 promete — vai rodar em cima disso.

- `generate-pedagogy` (function) — vira o "o que a banca DIRPS quis testar"
- `classify-question`, `pre-classify-batch`, `reclassify-questions` — etiquetagem das questões UFU
- `parse-exam-pdf` (function) + `/importar` (`Import.tsx`, `QuestionEditor`, `QuestionGrid`, `useImportExam`, `useExamPdf`) — é como as provas DIRPS entram no banco
- `src/lib/adaptiveStudy.ts` — priorização da trilha
- `src/taxonomy/taxonomy.ts` (+ teste) — base pra escrever a taxonomia UFU
- Tabelas: `questions`, `question_pedagogy`, `user_mastery`, `essays`
  (o corretor UFU **já grava** em `essays`), `profiles`, `token_usage`
- `analyze-essay-ufu` / `improve-essay-ufu` — óbvio, é o produto
- Passkeys, push (`send-push`, `get-vapid-key`), admin — infra que serve os dois

Obs.: hoje `Import.tsx` e o motor de etiquetagem estão acessíveis só via
rotas/admin ENEM. Quando desligar as rotas ENEM, preservar acesso a
`/importar` (ou mover pro Admin).

---

## Ordem de execução recomendada

1. **Hoje (faxina segura):** Lista 1 inteira — dados da raiz + código morto.
   Build continua verde porque nada referencia.
2. **Hoje (funil, já era prioridade):** trocar `emailRedirectTo` e o
   `navigate('/hoje')` pra devolver o usuário UFU ao destino; manifest e
   title.
3. **Antes da pré-venda:** matar/redirecionar `/fundadores` antigo.
4. **Depois de 28/07 + confirmação de zero assinante ENEM:** Lista 2 —
   remover rotas, depois páginas, depois functions e por último tabelas
   (nessa ordem; tabela é o único passo irreversível de verdade).
5. **Nunca:** Lista 3.
