

## Melhorias na Tela de Objetivas, Home e Sistema de Planos

Sao 4 frentes de mudancas:

---

### 1. Persistencia da sessao de objetivas

**Problema**: Ao sair da tela e voltar, a sessao zera porque todo o estado vive em useState.

**Solucao**: Salvar o progresso da sessao em `localStorage` (questoes carregadas, indice atual, respostas dadas). Ao voltar na tela, recuperar o estado salvo e continuar de onde parou. Ao completar ou resetar, limpar o storage.

**Arquivos alterados**:
- `src/hooks/useStudySession.ts` - Adicionar persistencia via localStorage no state da sessao

---

### 2. Integrar flashcards dentro da tela de Objetivas

**Problema**: Flashcards ficam numa tela separada e desconectada do fluxo de estudo.

**Solucao**: Na tela de Objetivas (estado `idle`), alem do card de "Iniciar Sessao", exibir:
- Card de flashcards pendentes com botao "Revisar" (inline, sem navegar para outra pagina)
- Historico resumido do dia (questoes respondidas, taxa de acerto)
- A revisao de flashcards acontece inline na propria tela de Objetivas, usando o mesmo hook `useFlashcardReview`

**Arquivos alterados**:
- `src/pages/Objectives.tsx` - Adicionar secao de flashcards e stats na tela idle, e modo de revisao inline

---

### 3. Dar mais destaque ao card de Redacao na Home ("Hoje")

**Problema**: O card de redacao nos dias que nao sao de redacao eh muito simples (so "Acessar").

**Solucao**: Em todos os dias, exibir um card mais completo de redacao com:
- Tema do dia (se Pro/trial), titulo resumido
- Ultimo score obtido
- Progresso mensal de redacoes (ex: "5/30 correcoes usadas")
- CTA mais chamativo ("Escrever Redacao" ou "Praticar Redacao")

**Arquivos alterados**:
- `src/pages/Today.tsx` - Reformular card de redacao para ser mais rico em informacoes

---

### 4. Limitacoes por plano para o modulo de Objetivas

**Regras propostas**:
- **Free**: Acesso limitado a 5 questoes por dia (degustacao)
- **Basico**: Sessoes completas de 45 questoes, sem flashcards automaticos
- **Pro**: Sessoes completas + flashcards automaticos + capsulas de conhecimento

**Arquivos alterados**:
- `src/hooks/usePlanFeatures.ts` - Adicionar flags para objetivas (`hasFullSessionAccess`, `hasAutoFlashcards`, `hasKnowledgeCapsules`)
- `src/hooks/useStudySession.ts` - Aplicar limite de 5 questoes para Free
- `src/pages/Objectives.tsx` - Esconder capsulas e flashcards conforme plano, mostrar CTA de upgrade

---

### 5. Desconto por duracao de assinatura (ate o ENEM)

**Ideia**: Calcular automaticamente o numero de meses ate o proximo ENEM (geralmente novembro) e oferecer desconto progressivo.

**Logica de desconto**:
- 1 mes: 0% (preco cheio)
- 3 meses: 5%
- 6 meses: 10%
- 12 meses: 20%

**Implementacao**:
- Criar cupons no Stripe para cada faixa de desconto
- Na tela de Planos, calcular meses ate o ENEM e sugerir o pacote ideal
- Exibir toggle entre "Mensal" e "Ate o ENEM" com o preco com desconto
- O checkout cria a assinatura mensal com o cupom aplicado (duration_in_months)

**Arquivos alterados**:
- `src/lib/stripe.ts` - Adicionar configuracao dos cupons/descontos
- `src/pages/Plan.tsx` - Adicionar seletor de duracao e calculo de desconto
- `supabase/functions/create-checkout/index.ts` - Aceitar parametro de cupom no checkout

---

### Resumo tecnico

| Mudanca | Arquivos |
|---------|----------|
| Persistencia de sessao | `useStudySession.ts` |
| Flashcards inline | `Objectives.tsx` |
| Card de redacao na Home | `Today.tsx` |
| Gating por plano | `usePlanFeatures.ts`, `useStudySession.ts`, `Objectives.tsx` |
| Desconto por duracao | `stripe.ts`, `Plan.tsx`, `create-checkout/index.ts`, cupons Stripe |

