# Auditoria: código do Atlas × briefing Placar UFU (03/jul/2026)

> Primeira sessão do pivô. Protocolo da seção 6.5 do briefing cumprido:
> inventário do código feito lendo os arquivos diretamente (edge functions,
> schema, taxonomia), depois confronto com o roadmap. Os docs de `_contexto/`
> foram usados como mapa, mas as afirmações abaixo foram validadas no código.

## Inventário honesto (o que existe e a qualidade)

**Stack:** Vite + React + TS + shadcn (origem Lovable), Supabase (19 tabelas,
zero views, ~35 migrations, 24 edge functions), Stripe, PWA, passkeys.
Testes existem só para a taxonomia (não rodaram no sandbox por problema de
node_modules Windows/Linux, não é defeito do código).

**Motor pedagógico — existe e é melhor que a premissa.**
`generate-pedagogy` (edge function) gera `pre_concept` ("antes de responder,
saiba isso" = o primer do briefing), `cognitive_pattern` (= "o que a banca quis
testar"), `deep_lesson` e sugestões de vídeo — e **já verifica cache e faz
upsert em `question_pedagogy`** (gera 1x por questão, nunca on-the-fly).
O padrão que o briefing pede para a `conteudo_ia` já está implementado.
ENEM está hardcoded só no prompt.

**Etiquetagem — o item 3 do roadmap já está construído.**
`classify-question` classifica disciplina/tópicos/skills/dificuldade/nível
cognitivo com validação contra taxonomia embarcada, marca `confidence` e
`needs_review`; `pre-classify-batch` roda em lote; `reclassify-questions` para
correção via admin. Taxonomia canônica de ~150 tópicos com IDs estáveis em
`src/taxonomy/taxonomy.ts` (com teste). Falta apenas: escrever a taxonomia UFU
e trocar o espelho embarcado na edge function.

**Priorização/trilha:** `adaptiveStudy.ts` (score por accuracy, nível, revisão
vencida, recência), `user_mastery` bayesiano, modo diagnóstico, SRS de
flashcards, plano diário via `useDayBlocks`. Sofisticado de verdade.

**Extração de PDF:** `parse-exam-pdf` (Gemini Vision, chunks, placeholders
`{{IMG_N}}`, markdown, `requires_image`) + UI `/importar` com grid de revisão
manual (`QuestionEditor`). Foi desenhado justamente para provas fora da
enem.dev (cita PSC, Fuvest, UERJ).

**Corretor de redação:** `analyze-essay` (GPT-4.1-mini, 5 competências ENEM,
notas em múltiplos de 40, quota validada no backend, salva em `essays`) +
`improve-essay` (reescreve mantendo as ideias e o nº de parágrafos).
`improve-essay` é ~70% da "versão evoluída" do briefing — a feature diferencial
do passe já tem esqueleto. **Porém:** o analisador assume estrutura fixa
intro + dev1 + dev2 + conclusão e as competências ENEM. Incompatível direto
com UFU (gêneros: carta, notícia, resenha, relato — estruturas próprias;
critérios 20/20/20/12/8, total 80; nota zero eliminatória).

**Cruft:** JSONs de extração v2–v9, workflow Python redundante com
`parse-exam-pdf`, diagnóstico do Complexity. Nada disso bloqueia; só não portar.

## Veredito das 4 premissas (seção 6.5)

| Premissa | Veredito |
|---|---|
| 1. Motor primer/explicação portável | **CONFIRMADA+.** Não são só prompts: função + cache prontos. Portar = trocar prompt e taxonomia. |
| 2. Portar < reconstruir | **CONFIRMADA para trilha/etiquetagem/import. PARCIAL para redação:** reaproveitar arquitetura (quota, `essays`, loop do improve), reescrever prompts e o modelo de blocos (UFU não tem 4 parágrafos fixos). |
| 3. Schema não conflita | **NÃO VERIFICÁVEL POR COMPLETO** — `modelo-dados-trilha-ufu.md` não está na pasta nem foi enviado. Compatível em espírito: `question_pedagogy` ≈ `conteudo_ia`; `questions` tem tudo menos pesos. Faltam `curso_pesos`, cortes históricos e a view `frequencia_topicos` (não existe nenhuma view hoje). Ponto de decisão real: taxonomia hoje vive em CÓDIGO (duplicada dentro da edge function), não em tabela — se o modelo UFU a quiser no banco, é divergência arquitetural a resolver antes de migrar. |
| 4. Extração adaptável à DIRPS | **PROVÁVEL, mas é hipótese até rodar 1 prova.** O mecanismo é agnóstico; riscos: layout DIRPS vs padrão "QUESTÃO N" do prompt, fidelidade não byte-fiel, custo por página. Teste barato: 1 prova pela UI `/importar`. |

## Divergências plano × realidade (código ganha no tático)

1. **Roadmap 1 (calibrar corretor) está bloqueado por arquivo, não por código:**
   `prototipo-corretor-ufu.jsx` e a redação-teste não estão na pasta. Além
   disso existe decisão não prevista no briefing: evoluir o protótipo novo ou
   adaptar `analyze-essay`/`improve-essay` (que já têm quota, persistência e
   o loop de reescrita prontos). Minha leitura: adaptar o par existente e usar
   o protótipo como referência de prompt/UI.
2. **Roadmap 3 (etiquetagem) encolhe de "construir" para "configurar":**
   pipeline pronto; o trabalho real é a taxonomia UFU + revisão manual das 200.
3. **Roadmap 4 (portar motor) idem:** `generate-pedagogy` já é o motor com
   cache; trabalho = prompt UFU + campo "o que a banca quis testar" (o
   `cognitive_pattern` já cobre ~isso).
4. **Roadmap 2 (schema) não pode começar** sem o `modelo-dados-trilha-ufu.md`
   — e quando vier, adaptar ao que existe (não criar `conteudo_ia` do zero se
   `question_pedagogy` serve).
5. **Não existe nada** de calculadora, card compartilhável, `curso_pesos` ou
   cortes históricos (esperado — são as pendências da seção 8).

## Próximo passo sugerido

Enviar os 3 arquivos-irmãos (`modelo-dados-trilha-ufu.md`,
`prototipo-corretor-ufu.jsx`, `spec-card-resultado-ufu.md`) + a redação-teste.
Com eles: (a) diff schema proposto × existente, (b) decidir protótipo novo vs
adaptação do `analyze-essay`, e (c) rodar o teste de extração de 1 prova DIRPS
— que valida a premissa 4 de uma vez.
