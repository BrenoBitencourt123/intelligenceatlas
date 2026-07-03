# Feedback critico - honesto, com prioridade

Avaliacao baseada em leitura do codigo do Atlas (read-only), nao em palpite. Onde a opiniao for forte, esta argumentada com referencia.

---

## Sistema de OBJETIVAS

### O que esta MUITO bom
1. **Taxonomia canonica em codigo** (`src/taxonomy/taxonomy.ts`). 150 topicos com IDs estaveis em snake_case, helpers de validacao, output do classifier tipado. Isso eh inveja de muito sistema educacional sediado em empresa grande - tipico em produtos pequenos seria string solta.
2. **Mastery bayesiano** (`user_mastery` com smoothing `(correct+1)/(attempts+2)`). Implementacao matematicamente correta. Resolve o problema classico de "aluno acertou 1 de 1 entao mastery = 100%".
3. **Foco do dia em blocos curados** (`useDayBlocks`). Nao joga questoes random na cara - segmenta em 3 blocos com topico definido. Isso eh planejamento pedagogico de verdade.
4. **Sabado = simulado de 90 questoes na ordem oficial**. Detalhe que mostra cuidado com a experiencia ENEM.
5. **Modo diagnostico antes de personalizar**. Sistema nao "chuta" perfil do aluno - constroi com base em dados.
6. **3 caminhos de import** ja construidos. Capacidade tecnica madura.

### O que esta PROBLEMATICO
1. **Cota free de 10 questoes/dia eh agressiva** mas defensavel para ENEM (volume importa). Suspeito.
2. **O workflow Python local de extracao manual eh redundante** com `import-enem-api` e `parse-exam-pdf`. Voce esta investindo tempo num caminho que ja foi resolvido no proprio Atlas.
3. **Schema da `questions` tem redundancia legada**: existem ao mesmo tempo `topic`/`subtopic` (string) E `topics` (TEXT[]) E `disciplina`. A taxonomy_v2 foi aditiva (nao removeu nada), e isso significa que o codigo precisa lidar com **duas fontes de verdade**. Isso vai dar bug.
4. **Imagens vem como JSONB** mas tem tambem `image_url` legado. Mesmo problema.
5. **`/importar` aceita schema "antigo" (`topic`/`subtopic`/`skills` como strings)** mas o sistema novo usa `topics`/`disciplina`/etc. So o reclassify trata isso depois - mas significa que durante o intervalo (e em paginas que olhem `topic` direto), o aluno ve dado inconsistente.

### O que esta FALTANDO
- **Painel de saude da taxonomia**: quantas questoes estao com `needs_review = true`? Quantas com `confidence < 0.7`? Sem isso, o admin nao sabe quando intervir.
- **Visualizacao de cobertura**: quais topicos da taxonomia tem questoes? Se 30 dos 150 topicos nao tem nem uma questao, o aluno que tem dificuldade naqueles topicos nao recebe pratica.
- **Versionamento de questao**: se o admin corrigir um enunciado, perde-se o historico. `classifier_version` ja existe, mas o `statement` em si nao tem versionamento.

---

## Sistema de REDACAO

### O que esta MUITO bom
1. **5 competencias ENEM tratadas corretamente**: notas em multiplos de 40, 0-200 cada, recalculo de total no backend, validacao de schema. Faz exatamente o que o INEP faz.
2. **Analise por bloco** (intro/dev1/dev2/conclusao) com `summary`, `whyItMatters`, `checklist`, `textEvidence`, `howToImprove`, `strengths`, `cohesionTip`, `tags`. Isso eh **muito mais profundo** que "sua nota foi X".
3. **Versao melhorada mantendo ideias do aluno** (`improve-essay`). Prompt explicito: "MANTENHA as ideias do aluno, NAO adicione informacoes". Isso eh o momento "aha" do produto, e o prompt esta cuidadoso.
4. **Forca os 5 elementos da proposta de intervencao** (agente, acao, meio, finalidade, detalhamento) no improve-essay. Isso eh a regra que mais cai aluno na C5.
5. **Quota gate no backend**, nao no frontend. Aluno espertinho nao consegue burlar.
6. **Tema diario com sources tipadas** (artigo/estatistica/legislacao/noticia). Tentativa correta de dar repertorio.

### O que esta PROBLEMATICO
1. **Tema sempre vazio no carregamento** (linha 62 `Essay.tsx`, comentario justifica). Justificativa: "previne auto-fill confusao para usuarios fazendo multiplas redacoes". Mas o **custo** eh: aluno que veio do `/hoje` (onde viu o tema) chega no editor e tem que **digitar de novo** o tema. Isso eh fricao real, principalmente em mobile. Solucao alternativa: pre-popular com o tema do dia, mas dar botao "Mudar tema" claro.
2. **Sources do `generate-theme` provavelmente alucinam URLs**. GPT-4.1-mini eh ruim em URLs verificaveis. O prompt pede "URLs reais do IBGE/IPEA/governo" mas nao tem validacao posterior (fetch HEAD pra checar se existe, por exemplo). **Aposto que pelo menos 1 em cada 3 URLs gerados quebra**. Verificar isso eh prioridade alta.
3. **`generate-theme` so admin pode chamar**. Combinando com:
4. **Aluno nao tem fluxo pra criar tema proprio**. O pedido do Breno ("aluno conseguir criar/analisar suas proprias redacoes") **nao tem suporte no Atlas hoje**. Aluno pode digitar tema como string no input, mas perde tudo que `PedagogicalSection` oferece (contexto, perguntas guia, fontes). Eh uma versao mancha do produto.
5. **Cota free de 1 redacao/SEMANA eh punitivamente baixa**. Pra produto cuja proposta eh ajudar aluno a treinar redacao pro ENEM, isso nao gera habito. Aluno escreve 1, fica 6 dias sem feedback, esquece. **Aposto que retencao W2 esta ruim por causa disso**.
   - Bonus de boas-vindas de 2 redacoes na 1a semana ajuda, mas nao resolve - a partir da 2a semana o aluno cai para 1/semana.
   - Comparativo: ChatGPT free permite 30+ correcoes/dia. Voce esta competindo com isso.
6. **Schema de `essays.blocks` eh fixo (4 blocos)**. Aluno que quer escrever uma redacao de 5 paragrafos (intro + 3 dev + conclusao) ou de 3 paragrafos (intro + 1 dev + conclusao) tem que se adaptar ao Atlas, em vez do Atlas se adaptar a ele.
7. **`analyze-essay` cobra a quota mesmo se a IA retornar erro**. Olhei o codigo: o decremento de quota acontece no inicio (gate), nao depois do sucesso. Se OpenAI retornar 500, a quota foi consumida sem o aluno receber analise. Bug de UX serio para free user.

### O que esta FALTANDO
- **Fluxo "criar meu tema"**: aluno digita titulo + cole motivador + (opcional) IA expande para context + perguntas guia + sources. Reusa `analyze-essay` depois normal.
- **Versionamento de redacao**: aluno reescreve baseado na analise, e o sistema mostra "voce subiu de 720 -> 880". Sem isso, a metrica de progresso eh fraca.
- **Comparacao com versao melhorada lado-a-lado**. Existe `toggleShowOriginal` em `ResultPanel`, mas nao vi diff highlight. Recomendo verificar.
- **Estatisticas pessoais de competencia**. "Sua C3 historicamente eh 120, mas sua C1 eh 180" - aluno precisa saber onde focar.
- **Notificacao pro admin quando `generate-theme` falha** ou quando o tema tem url quebrada.

---

## A pergunta original (extracao de questoes ENEM) - resposta final

**Nao** invista mais tempo no Python local de extracao para provas oficiais. **Sim** se sua tese for byte-fidelidade absoluta para publicar formalmente. Caso contrario:

1. **Para ENEM 1998-2024**: rode `import-enem-api` no admin do Atlas. Levanta 90 questoes em ~2 minutos com gabarito e imagens.
2. **Para ENEM 2025+ ou provas nao-INEP**: use a UI `/importar` que chama `parse-exam-pdf` com Gemini Vision. Workflow ja desenhado, edita no `QuestionEditor`.
3. **Para o ENEM 2023 que voce tem em mao agora**: ele *deve* estar na enem.dev (eh prova de 2023). **Teste isso primeiro** - se estiver, voce tem 90 questoes em 2 cliques.

---

## Priorizacao honesta - o que faria diferenca real

### P0 (impacto alto, esforco baixo)
1. **Validar URLs do `generate-theme`** - HEAD request em cada URL antes de salvar. Se quebrada, marcar como `needs_review` ou re-rolar. Custo: 1 dia.
2. **Pre-popular tema no editor de redacao** com o tema do dia + botao "Mudar tema". Custo: 2 horas.
3. **Mover o decremento de quota para depois do sucesso** em `analyze-essay`. Custo: 1 hora.
4. **Confirmar se ENEM 2023 esta no enem.dev** - se sim, tudo que voce esta tentando fazer manualmente esta a 2 cliques no admin.

### P1 (impacto alto, esforco medio)
5. **Fluxo "criar meu tema"** para aluno. Reusar prompt do `generate-theme` mas permitir aluno fazer (com quota propria). Isso responde diretamente o pedido "aluno criar suas proprias redacoes".
6. **Revisar cota free de redacao**: testar 2/semana ou 1/3-dias. Medir conversao W2 antes/depois. Sem dados, eu aposto que 1/semana esta machucando.
7. **Consolidar schema legacy** (`topic`/`subtopic` vs `topics`/`disciplina`). Decidir qual eh fonte de verdade, deprecar a outra.

### P2 (estrategico)
8. **Painel admin de saude da taxonomia** - questoes com `needs_review`, distribuicao por topico, gap de cobertura.
9. **Versionamento de redacao + diff highlight** com a versao melhorada.
10. **Estatisticas pessoais de competencia** no perfil do aluno.

---

## O que NAO recomendo fazer

- **NAO** continue investindo na pipeline Python local antes de testar enem.dev e parse-exam-pdf no proprio Atlas. Voce vai gastar dias num problema que ja esta resolvido a 2 cliques.
- **NAO** crie skills novas pra esse problema antes de fechar o ponto acima.
- **NAO** confunda "ter Obsidian organizando o contexto" com "ter o sistema funcionando bem". Markdown na pasta `_contexto/` aqui ja faz o trabalho. Obsidian eh ergonomia pra voce navegar, nao requisito tecnico.
