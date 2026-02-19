
# Análise: O que falta para o sistema ser perfeito para estudar ENEM

## Estado atual do sistema

O Atlas já tem uma base muito sólida:
- Questões objetivas com sessões adaptativas
- Sistema de flashcards SRS (repetição espaçada)
- Editor de redação com IA e análise por competências
- Painel "Hoje" com agenda semanal
- Mapa de fraquezas/forças por tópico
- Pedagógico por questão (micro-aulas)

---

## O que está faltando ou quebrado

### 1. Inconsistência de 45 vs 20 questões
A memória do sistema registra "45 questões em 3 blocos" mas o código usa 20. Isso gera confusão na UI (texto diz "45", lógica usa 20). **Precisamos decidir e padronizar**: 20 para dias de semana é muito bom, mas a descrição dos blocos no código ainda referencia divisões de 45.

### 2. Tela "Hoje" não reflete o progresso real do dia
O botão "Revisar" de flashcards leva para `/objetivas` (errado — deveria ir para `/flashcards`). Os cards de fraqueza/força aparecem mesmo quando o usuário ainda não estudou nada (estado vazio sem CTA claro).

### 3. Fluxo de imagens nas questões ainda incompleto
O sistema importa questões com imagens via PDF, mas na UI de sessão (`Objectives.tsx`) a exibição de imagens das alternativas usa `image_url` direto nas alternativas (campo que pode não existir no JSONB). Precisa usar o mesmo sistema de `QuestionImage` padronizado.

### 4. Falta uma tela de "Simulado" real
O sábado está marcado como "Simulado de 90 questões" mas não existe uma página de simulado. Ao clicar em "Começar" no sábado, abre o mesmo fluxo de objetivas com 90 questões sem diferenciação de UI — sem timer, sem modo fullscreen, sem resultado estilo ENEM.

### 5. Falta rastreamento de tempo por questão
A tabela `question_attempts` tem `response_time_ms` mas o frontend nunca envia esse dado. O tempo por questão é fundamental para o adaptativo (questões que o aluno demora são indicadores de insegurança).

### 6. A página de "Erros por Tópico" é muito crua
Atualmente é uma tabela com dados brutos. Seria muito mais útil como um mapa visual com indicadores claros de "estudar agora", "revisar em X dias", "dominado".

### 7. Importação de provas — status de questões anuladas e imagens
O fluxo de importação de PDF funciona, mas as imagens das questões dependem de upload manual após importação. Não há fluxo guiado para adicionar imagens às questões já importadas.

---

## Prioridades sugeridas (da maior para menor impacto)

```text
Alta Prioridade
├── [BUG] Botão "Revisar" flashcards → rota errada (/objetivas → /flashcards)
├── [BUG] Rastreamento de tempo por questão (response_time_ms nunca enviado)
├── [MELHORIA] Padronizar 20 questões em toda a UI (textos, blocos, labels)
└── [MELHORIA] Tela "Hoje" com estado vazio mais claro para novos usuários

Media Prioridade  
├── [FEATURE] Simulado de sábado com timer e UI diferenciada
├── [MELHORIA] Erros por Tópico como dashboard visual (não tabela crua)
└── [MELHORIA] Fluxo guiado para adicionar imagens às questões importadas

Baixa Prioridade
└── [FEATURE] Histórico de questões respondidas (ver o que errei ontem)
```

---

## Plano de implementação sugerido

### Fase 1 — Bugs críticos (impacto imediato no usuário)

**1. Corrigir rota dos flashcards no painel "Hoje"**
- Arquivo: `src/pages/Today.tsx` linha 145
- Mudar `navigate('/objetivas')` → `navigate('/flashcards')`

**2. Enviar `response_time_ms` em cada tentativa**
- Arquivo: `src/hooks/useStudySession.ts`
- Adicionar `startTime` por questão ao entrar em cada questão
- Calcular `Date.now() - questionStartTime` ao responder
- Passar para o insert em `question_attempts`

**3. Padronizar 20 questões na UI**
- Arquivo: `src/hooks/useStudySchedule.ts` — já está com 20
- Remover qualquer referência a "45" em textos visíveis
- Ajustar os nomes dos blocos para 3 blocos de ~7 questões (ou 2 de 10)

### Fase 2 — Experiência de estudo

**4. Reformular "Erros por Tópico" como dashboard visual**
- Arquivo: `src/pages/ErrorsByTopic.tsx`
- Cards por área com barra de progresso de domínio
- Badge "Revisar Hoje" para tópicos com `next_review_at <= hoje`
- Botão "Estudar este tópico" que inicia sessão filtrada por tópico

**5. Estado vazio na tela "Hoje" para novos usuários**
- Se `stats.questionsToday === 0` e não tem histórico, mostrar onboarding suave
- CTA claro: "Comece sua primeira sessão de [área do dia]"

### Fase 3 — Features novas

**6. Modo Simulado no sábado**
- Nova rota `/simulado` com UI diferenciada
- Timer visível (5h30min estilo ENEM ou configurável)
- Bloqueio de feedback durante (só vê acertos no final)
- Resultado com gráfico por área e comparação com sessões anteriores

---

## Resumo do que será alterado

| Arquivo | Mudança |
|---|---|
| `src/pages/Today.tsx` | Corrigir rota flashcards |
| `src/hooks/useStudySession.ts` | Adicionar tracking de tempo por questão |
| `src/pages/ErrorsByTopic.tsx` | Reformular como dashboard visual |
| `src/hooks/useStudySchedule.ts` | Revisar contagem de questões |
| `src/pages/Today.tsx` | Melhorar estado vazio |

A implementação pode ser feita de forma incremental — começando pelos bugs que impactam o usuário agora, e depois evoluindo para as features novas.
