
# Trilha estilo Duolingo — MVP em 3 blocos

Objetivo: aluno abre o app, faz um diagnóstico curto, sai posicionado num ponto da trilha, e sobe nó a nó de forma linear (cadeado no próximo até o anterior dourar). Zero fricção, 6 níveis sempre dentro de cada nó (já implementado no player).

Nada disso mexe em edge functions novas nem cria motor de IA. Conteúdo continua vindo por migration (seu contrato: "no local scripts").

---

## Bloco 1 — Diagnóstico que pinta a trilha

Já existe `/diagnostico-ufu` (`DiagnosticoUfu.tsx`) e a tabela `ufu_diagnostico_questoes`. Vou aproveitar em vez de criar novo.

**O que muda:**
- Ao fim do diagnóstico, além do placar de acertos já existente, calcular o **nó de entrada** por disciplina:
  - Regra v0 simples: para cada disciplina com nó ativo, pega a última pergunta acertada e marca todos os nós anteriores como `dourado=true` em `trilha_progresso` (endowed progress — nunca nascer em zero).
  - O primeiro nó ainda não dourado vira o `atual` (aceso).
- Salva num campo novo `profiles.diagnostico_feito_at` (timestamp) pra saber se já passou.
- Se o usuário loga e nunca fez diagnóstico → redireciona pra `/diagnostico-ufu` antes de `/hoje`.

**Onboarding recap:** o `Onboarding.tsx` continua igual (curso/cota/meta). O diagnóstico é o passo seguinte, antes de cair na home.

---

## Bloco 2 — Trilha linear com cadeado

Hoje `Today.tsx` já lista os `trilha_nos` ativos com estados dourado/current/locked, mas a regra de "locked" precisa ser real:

- **Regra:** um nó só fica `disponivel` quando o nó imediatamente anterior (mesma disciplina, ordem crescente) está `dourado`. Tudo depois disso é `bloqueado` (cadeado cinza, sem clique).
- Adicionar campo `trilha_nos.ordem` (int) e `trilha_nos.disciplina` já existe — ordenar por (disciplina, ordem).
- Card-missão do topo aponta pro primeiro nó `disponivel` não-dourado de qualquer disciplina (priorizando a disciplina do dia se houver — regra por dia da semana já parcialmente no Today).
- Tentar abrir `/ufu/no/:noId` de um nó bloqueado → toast "Termine {nó anterior} primeiro" + volta pra `/hoje`.

Sem mapa visual complexo ainda (esse é o Bloco 6 da espec, gatilho é 30+ nós).

---

## Bloco 3 — Seed de nós (via migration, manual)

Pra trilha fazer sentido linear, precisa de mais que 1 nó. Este bloco é só a **estrutura** — o conteúdo você/Cowork prepara e vira migration depois:

- Estrutura de disciplinas iniciais: `redacao` (já tem `red-generos-zeros`), `matematica`, `linguagens`.
- Convenção de IDs: `{disciplina}-{slug}` (ex: `mat-porcentagem-basica`).
- Cada nó novo entra por migration com seus 14+ itens em `trilha_itens` seguindo o schema em `TRILHA-SCHEMA-ITEM.md` (já canônico).
- Um seed inicial com **2-3 nós placeholder por disciplina** (só título + ordem, sem itens ainda) só pra visualizar a trilha crescer e testar o cadeado. Você desativa (`ativo=false`) até ter conteúdo real.

---

## O que fica de fora deste plano (gatilhos futuros)

- **Modo Resgate + generate-ladder** → gatilho: 1º caso real de aluno travando (espec §8, item 4).
- **Mapa visual por matéria** → gatilho: 30-40 nós com conteúdo (espec §8, item 6).
- **Admin UI de geração de escadinhas por IA** → você pediu "só migrations manuais por enquanto".
- **Compositor de sessão** (aquecimento/núcleo/fecho) → v0 continua sendo a regra simples atual do Today.

---

## Detalhes técnicos

**Migration necessária (schema, 1 só):**
- `ALTER TABLE trilha_nos ADD COLUMN ordem int DEFAULT 0;`
- `ALTER TABLE profiles ADD COLUMN diagnostico_feito_at timestamptz;`
- (opcional) Índice `(disciplina, ordem)` em `trilha_nos`.

**Arquivos a tocar (frontend):**
- `src/pages/DiagnosticoUfu.tsx` — no submit final, calcular e persistir `trilha_progresso` inicial + `diagnostico_feito_at`.
- `src/App.tsx` ou um wrapper — gate: se logado + sem `diagnostico_feito_at` → redirect `/diagnostico-ufu`.
- `src/pages/Today.tsx` — regra de cadeado linear real usando `ordem`.
- `src/pages/TrilhaNo.tsx` — guard: bloquear entrada em nó não disponível.

**Ordem de execução (dentro do plano):**
1. Migration schema.
2. Regra de cadeado + guard no player (Bloco 2).
3. Diagnóstico que pinta trilha + gate de rota (Bloco 1).
4. Seed placeholder de 2-3 nós por disciplina (Bloco 3) — commit separado, você popula depois.

**Verificação:**
- Usuário novo → login → cai em diagnóstico → responde → cai em `/hoje` com 1-2 nós dourados e o próximo aceso.
- Tenta abrir nó bloqueado pela URL → toast + redirect.
- Dourar o nó atual → o próximo destrava automaticamente na volta pra `/hoje`.
