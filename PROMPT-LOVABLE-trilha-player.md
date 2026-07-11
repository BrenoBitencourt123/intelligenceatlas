# Prompt Lovable — Player da Trilha (nó v0)
> Gatilho pra colar: migration `20260711150000_trilha_v0.sql` aplicada
> (push feito). Contrato completo dos itens: **TRILHA-SCHEMA-ITEM.md** na
> raiz do repo — leia antes. Conteúdo de exemplo já está no banco
> (nó `red-generos-zeros`, 14 itens em `trilha_itens`).

Crie a rota **`/ufu/no/:noId`** (ProtectedRoute) — o player que toca um nó
da trilha, estilo Duolingo:

## Comportamento

1. Carrega `trilha_nos` (titulo/descricao) + `trilha_itens` do nó, ordenados
   por (nivel, ordem). Retoma do `nivel_atual` em `trilha_progresso`
   (upsert ao entrar).
2. **Um item por tela**, barra de progresso no topo (posição/total), botão X
   pra sair (salva onde parou).
3. Renderização por `payload.tipo` (payload é o JSONB — schema no
   TRILHA-SCHEMA-ITEM.md):
   - `tocar`: botões-pill; múltipla seleção quando gabarito tem 2+ ids;
     confirmar com botão "Verificar".
   - `ligar`: duas colunas; toca um da A, um da B → par formado vira um chip
     conectado; erro no par → treme e desfaz.
   - `ordenar`: lista embaralhada (embaralhe no client), toca na sequência
     desejada (1º toque = posição 1...); "Verificar".
   - `completar`: enunciado com `___` destacado + opções-pill (single).
   - `multipla`: alternativas A-D formato prova.
   - Se `payload.proposta_id` existir: renderizar ANTES do enunciado o texto
     da proposta correspondente de `PROPOSTAS_UFU` em
     `src/data/ufu/redacao.ts` (card scrollável).
4. **Feedback (regra de ouro — nunca "errou ✗")**: errou → banner com
   `feedback_erro` + tentar de novo; 2º erro → gabarito destacado com o
   mesmo texto. Acertou → banner verde com `feedback_acerto` (auto-avança
   após 1,5s ou botão Continuar).
5. Grava em `trilha_respostas` (acertou_primeira, tentativas) a cada item.
   Ao fechar todos os itens de um nível → atualiza `nivel_atual`.
6. **Fim do nó (acertou o item do nível 5)**: marcar `dourado=true` e
   mostrar a celebração em 2 tempos (padrão baú do Duolingo):
   - Tela 1: "Nó completo" + botão **"VER MEU RESULTADO"** (a anticipação)
   - Tela 2: 3 números (itens, % de acerto na 1ª tentativa, tempo) +
     título "Você subiu do 'quais são os gêneros' até a proposta real." +
     se o payload final tiver `cta`, botão primário com `cta.texto` →
     `cta.href`; secundário "Voltar" → /hoje.
   - Botões de celebração SEMPRE em primeira pessoa quando forem
     compromisso (padrão do produto).
7. Mobile-first (público é celular). Sem timer. Sem sons.

## Verificação
1. Logado, abrir `/ufu/no/red-generos-zeros` → jogar os 14 itens até o fim.
2. Errar de propósito no item 0.1 → ver feedback de ensino, não "X".
3. Sair no meio (X) e voltar → retoma do mesmo nível.
4. Terminar → dourado no banco + celebração 2 tempos + CTA pro corretor.
5. `trilha_respostas` populada (conferir no Supabase).
