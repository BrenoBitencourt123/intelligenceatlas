# Diagnóstico do Complexity + Estratégia Freemium do Atlas

> Análise cruzando: código do Complexity (prompts, pipeline, constants, buildImagePrompt), funcionalidades do Atlas (Landing + Founders + Plan) e os 31 roteiros do Ciência Todo Dia enviados.
> Foco: **o que está errado no Complexity** e como isso afeta a venda do Atlas via freemium.

---

## TL;DR (o que está errado, em uma frase)

O Complexity foi construído **como se Shorts fosse o formato único** e depois tentou encaixar Carrossel e Stories como variações. Na prática, os três formatos compartilham os mesmos agentes, as mesmas regras de roteiro, o mesmo framework de curiosidade e o mesmo prompt de imagem — quando cada um deveria ter pipeline próprio. E existe um arquivo (`scriptFramework.js`) com toda a lógica correta para tratar os três formatos, **mas ele não está conectado à produção** — só a `benchmark.js`. É código órfão.

---

## Parte 1 — O problema central: o viés vertical

### 1.1. `scriptFramework.js` existe e está órfão

O arquivo `src/services/scriptFramework.js` já implementa toda a lógica correta por formato:

- `CAROUSEL_STRUCTURES`: breakdown_visual, antes_depois, passo_a_passo, lista_curada, erro_vs_correto
- `STORIES_STRUCTURES`: prova_social, cta_relacional, cta_comercial, bastidor, enquete
- `deriveWriterProfile()`, `deriveFormatGoal()`, `deriveFormatStructure()`, `deriveNarratorPresence()` com comportamento distinto por formato

**Problema**: `grep -r "scriptFramework" src/` mostra que nada em `prompts.js`, `contentPlanner.js` ou `campaignBrain.js` importa esse arquivo. Ele só é usado em `benchmark.js` (avaliação), nunca na produção real. Resultado: o sistema *sabe* tratar formatos diferentes, mas não *usa* esse conhecimento quando está gerando conteúdo de verdade.

### 1.2. O Estrategista só fala em CTD — e CTD é 100% de vídeo

O Estrategista (em `prompts.js`, `promptEstrategista`) força a escolha de um dos 5 tipos do `CTD_FRAMEWORK`: cotidiano_revelado, hipotese_absurda, narrativa_historica, mito_desmontado, misterio_em_aberto. Esses são **motores narrativos de vídeo falado** — nasceram da análise do canal Ciência Todo Dia, que é 100% vídeo curto narrado.

Quando o CMO pede um Carrossel, o Estrategista mesmo assim escolhe um desses 5 tipos (ex: "narrativa_historica"), e essa escolha é propagada pelo pipeline inteiro via `tipo_roteiro` no YAML. A consequência é que o Roteirista recebe um "tipo" feito para áudio sequencial e tenta cumpri-lo num formato estático onde não tem locutor, ritmo de fala, pausa dramática ou corte de cena.

Os `CAROUSEL_STRUCTURES` e `STORIES_STRUCTURES` de `constants.js` não aparecem em nenhum prompt — a única menção deles é dentro do próprio `scriptFramework.js` órfão.

### 1.3. O Roteirista aplica regras de vídeo em todos os formatos

A maior parte do `promptRoteirista()` está fora dos blocos condicionais `isVideo / isCarrossel / isStories`. Ou seja: carrossel e stories herdam tudo isso como se fossem vídeo:

- "DENSIDADE: ~80 palavras para 30-35s | ~115 para 45-50s | ~150 para 55-60s" — métrica de narração em segundos aplicada a formato sem narração
- "Punches" (micro-resets de atenção de 1-4 palavras entre blocos de explicação) — conceito de ritmo de fala
- "Fecho memorável" = a penúltima sentença antes do CTA — lógica de locutor, não de última lâmina
- "Narrador presente", "auto-depreciação leve", "pergunta + resposta curtíssima" — tudo fala do Atlas como voz, não como design
- "A Extensão Absurda — o fecho compartilhável" — recurso de vídeo
- "Escrita para voz (regra crítica)" — explícito para áudio, aplicado a carrossel mesmo assim
- "Registro coloquial brasileiro" — ok, isso se aplica, mas a justificativa toda é falada

As únicas 4 linhas específicas de carrossel que existem no Roteirista são:
```
1. Gancho na 1ª lâmina (título grande).
2. Entregue valor denso e fácil de ler (bullet points se necessário).
3. Texto focado em leitura deslizante (poucas palavras por tela).
4. Última lâmina é o CTA pra conta ou pro sistema PRO.
```
Isso é raso. Não trata hierarquia tipográfica, psicologia do save (que é o KPI real do carrossel), papel funcional de cada lâmina, repetição estratégica do hook na última lâmina para reter quem pulou, design para scroll parado no feed, alt text para acessibilidade.

Stories também tem só 4 regras genéricas e não trata a mecânica real: stickers (quiz, slider, enquete, caixinha, contador), duração percebida por tela, diferença entre stories de topo (atração) e de conversão (CTA urgente com link), sequência que mantém o dedo no "próximo".

### 1.4. O Diretor Visual gera "CENAS" mesmo para carrossel

Em `promptDiretorVisual()` o vocabulário é sempre CENA. Não existe um caminho paralelo para LÂMINA. O carrossel é tratado como "vídeo em imagens estáticas", mas carrossel não é isso — é um documento visual onde cada lâmina tem **papel funcional** (capa, desenvolvimento, revelação, virada, CTA), e cada uma precisa funcionar como imagem-cartaz independente no feed.

### 1.5. `buildImagePrompt.js` aplica câmera de vídeo em carrossel

`CAMERA_INSTRUCTIONS` tem só 4 posições: opening (plano médio), middle (close-up), closing (visão ampla), final (perspectiva criativa). Isso é linguagem cinematográfica para vídeo. Em carrossel, a lâmina 3 de 7 pode precisar ser um infográfico (visão ampla) e não um close-up — mas `deriveSubPosition()` força ela a ser close-up. A proporção (1:1) é ajustada, mas a câmera não.

### 1.6. O Distribuidor só sabe falar TikTok, Reels e Shorts

`promptDistribuidor()` tem blocos hardcoded só para:
- TIKTOK (título + descrição + hashtags)
- INSTAGRAM REELS (legenda + hashtags)
- YOUTUBE SHORTS (título + descrição + tags)

Não existe bloco para:
- **Instagram Carrossel**: capa, texto da última lâmina, legenda do feed, hashtags de save, alt text, peso de share/save vs watch time
- **Instagram Stories**: texto por tela, sticker sugerido (quiz, enquete, caixinha), link com UTM, ordem das telas, tempo em cada tela
- **Instagram Feed estático**: se algum dia virar um caminho, nem existe

### 1.7. O QA (Revisor) herda o mesmo viés

O `promptRevisor()` tem um `criteriosEspeciais` que muda entre Shorts/Carrossel/Stories, mas os dois critérios principais continuam os mesmos:
- Critério 2 é "HOOK CURIOSITY-FIRST — a PRIMEIRA FRASE começa por um objeto/fato/data?" — pergunta formulada como se sempre houvesse uma "primeira frase" falada. Em carrossel a primeira lâmina é tipografia visual, não prosa.
- O QA não avalia: legibilidade no feed, peso do texto na capa, se a última lâmina reprisa o hook, se o carrossel funciona sem áudio (ele sempre funciona sem áudio), se stories está usando stickers interativos.

---

## Parte 2 — Problemas adicionais do Complexity (fora do viés de formato)

### 2.1. O CTD está sendo usado como "framework universal", mas é só uma voz

O `referencia-ciencia-todo-dia.md` deixa explícito: "NÃO é um guia de imitar — é um guia de ENTENDER para adaptar ao contexto educacional do ENEM." Os 5 tipos do framework foram derivados daquela análise. Mas no código, eles foram materializados como se fossem **a única tipologia de roteiro possível**, e o Estrategista é obrigado a escolher um deles. Isso empobrece:

- Conteúdo **factual direto** ("como funciona a correção da redação ENEM") não se encaixa em nenhum dos 5 tipos com naturalidade — vira uma narrativa_historica forçada ou um cotidiano_revelado sem mundo cotidiano.
- Conteúdo **de demonstração do produto** ("olha o Atlas corrigindo essa redação") não é nenhum dos 5 — é um sexto tipo (Feature Reveal) que não existe.
- Conteúdo **de prova social** ("aluno usou o Atlas e tirou 960 na redação") não se encaixa em nada.

O canal CTD não tem esses problemas porque o CTD não vende nada — todo post dele é curiosidade. O Atlas vende.

### 2.2. O canal está forçando ENEM cedo demais

Olhando os 31 roteiros do CTD que você mandou, quantos começam com "ENEM" ou "vestibular"? Zero. O CTD começa pelo mundo (24 horas, formigas, relógios de sol, pontos pretos no vidro, reclamação de 3700 anos atrás) e *às vezes* aterrissa num patrocinador que se conecta por lógica — e esse patrocinador quase nunca é sobre ENEM. O CTD não é educacional ENEM. É curiosidade.

O Atlas, por outro lado, tem regras tipo "CONTEXTO ENEM: faltam X dias" injetado em todo prompt do Estrategista, e o arco obrigatório "MUNDO → MECANISMO → ENEM" força toda produção a desaguar no ENEM, mesmo quando o tema é amplo. Isso mata alcance: o aluno que está no TikTok por curiosidade pura sai do vídeo quando ele vira "dica de prova".

A solução do CTD (e que vale a pena copiar) é: 70% dos vídeos **nunca mencionam o patrocinador**. A conexão com patrocinador só acontece em temas onde ela é orgânica. O Complexity já tem o mix 70/20/10 (crescimento/retenção/conversão), mas a instrução de conteúdo de crescimento ainda carrega "ENEM" como âncora obrigatória. Deveria ser: crescimento = **mundo**, sem ENEM, sem Atlas. A ponte para o ENEM só acontece nos 30% de retenção/conversão.

### 2.3. Os 20% de retenção estão vagos

O mix 70/20/10 define retencao como "Menciona o Atlas de passagem, sem CTA" — isso é ambíguo. Na prática, os scripts de retenção acabam parecendo conteúdo de crescimento com um "o Atlas faz isso" grudado no final. Não é demo do freemium, não é prova social, não é comparação antes/depois. É uma menção perdida.

Esse é o maior bug do funil — porque retenção é exatamente o ponto onde o freemium deveria brilhar, e ele está invisível.

### 2.4. O CMO/campaignBrain desequilibra Stories na fase SEMEAR

Em `campaignBrain.js`, a fase SEMEAR (abril-maio) diz "STORIES: máximo 1 por semana — alcance é quase zero com poucos seguidores". Isso faz sentido para alcance, mas gera um efeito colateral: como Stories é o formato de conversão direta do Atlas (link sticker, caixinha de perguntas, CTA de teste grátis), zerar Stories nessa fase significa que **a primeira venda só aparece no código em BROTAR**. E aí, quando BROTAR chega, o time nunca treinou Stories — porque o Complexity nunca gerou Stories bons.

Além disso, o mesmo Complexity que está enviesado para Shorts vai entregar Stories ruins quando finalmente precisar gerar um — porque nunca foi testado no fluxo.

### 2.5. Duração por tipo travando Shorts curtos

O prompt do Estrategista diz: "narrativa_historica e misterio_em_aberto: duracao_alvo MÍNIMO 45-60s". Isso é ok para YouTube Shorts (onde vídeos mais longos performam), mas no TikTok 2026 o algoritmo está empurrando vídeos de 21-30 segundos de novo. A regra deveria ser sensível à plataforma, não só ao tipo.

### 2.6. A Memória Narrativa não diferencia por formato

`narrativeMemory.js` registra temas cobertos, mas sem segmentar por formato. Isso faz com que, ao evitar repetir "Lei de Ohm", o sistema não saiba distinguir se a Lei de Ohm foi coberta em Shorts ou em Carrossel — e deveria saber, porque a mesma lei dá um Shorts e um Carrossel completamente diferentes. Forçar no `addTemaCoberto()` um `formato` e deixar o CMO decidir se o tema-em-outro-formato ainda é válido liberaria mais planejamento.

### 2.7. Distribuidor gera UM pacote para três plataformas

O mesmo texto gerado pelo Roteirista vira legenda de TikTok, legenda de Reels e descrição de YouTube Shorts. Cada plataforma tem peso algorítmico diferente:
- TikTok: primeiros 3s de hook, hashtags trending, som
- Reels: retention, compartilhamento, saves
- YouTube Shorts: watch time, sub inline, busca (SEO no título)

O Distribuidor atual é copypaste — daria mais performance se cada plataforma gerasse seu próprio "hook escrito" otimizado para seu comportamento de feed.

### 2.8. Não há avaliação fechando o loop de aprendizado

O `dataAnalyst.js` lê métricas, mas não há um mecanismo que pegue os 10 piores vídeos e gere "lições" estruturadas que voltem como restrições no próximo Estrategista. O loop está desenhado em `Home.md` ("performance → cientista → memória → CMO") mas na prática o cientista só popula `brand_intel` — sem regras duras do tipo "evite hook sobre tema X porque última vez viralizou negativo".

---

## Parte 3 — Comparando os 31 roteiros CTD com o output esperado

Cruzando os 31 roteiros que você enviou com o framework em `constants.js`:

| Tipo no constants.js | Roteiros CTD que se encaixam |
|---|---|
| cotidiano_revelado | 1 (24h), 19 (pontinhos vidro), 17 (janelas avião), 27 (velcro), 22 (CEP), 26 (cartão perfurado), 31 (radiação), 16 (Antártida) |
| hipotese_absurda | 7 (lua virar buraco negro), 25 (formiga 1Mkm/h), 30 (suor humanidade), 20 (meteoro) |
| narrativa_historica | 8 (Lattes), 12 (reclamação 3700 anos), 23 (Krikalev), 29 (guerra Google Maps), 13 (chuva meteoros 1833), 28 (cafeterias) |
| mito_desmontado | 4 (foto Terra pálida), 15 (estrelas verdes), 24 (tsunamis no BR), 27 (nome "velcro") |
| misterio_em_aberto | 3 (dodecaedro), 9 (batalha 1561), 18 (sinais vida em Marte) |

Observações importantes:

1. **CTD tem um 6º tipo que seu framework não captura: "Pergunta revelada"**. Roteiros como 2 (retrato falado de ETs), 10 (quantas pessoas já viveram), 11 (erro 404 + CERN), 21 (o que aliens veriam primeiro da Terra) são perguntas capciosas que o narrador responde. Eles não são nenhum dos 5 tipos — são híbridos. O framework poderia ter um `pergunta_capciosa` dedicado.

2. **CTD mistura patrocinador com raciocínio de forma orgânica** (Alura Python em cima de "CEP é sistema de coordenadas", Alura em cima de "cartão perfurado", LATAM em cima de "dinheiro compra felicidade em experiências"). Seu sistema não tem esse "ponte lógica para produto" em nenhum prompt — só tem "MENCIONA ATLAS NA ÚLTIMA LINHA" como diretriz genérica. Um módulo `buildAtlasBridge()` que recebe o raciocínio central e gera uma ponte honesta para uma feature do Atlas seria o equivalente.

3. **Nenhum dos 31 CTD começa com "você"**. Zero. O máximo que chega perto é "Você conhece a história de..." e "Você sabia que..." — ambos apontam para o mundo, nunca para a dor. Seu prompt já trata isso explicitamente e bem (regra do "você aponta pra fora vs pra dentro") — é um dos acertos do sistema.

4. **Os roteiros de 15-30s do CTD têm estrutura mais apertada que o framework atual prescreve**. O Estrategista força "15-20 cenas para 45-60s" — mas CTD real tem em média 8-12 cenas em 60s, porque cada cena dura mais (e a imagem respira). Sua métrica provavelmente está empurrando cortes demais.

---

## Parte 4 — Plano de correção do Complexity (priorizado)

### P0 (ataca o problema central, alto impacto)

1. **Conectar o `scriptFramework.js` ao pipeline real** (1-2 dias)
   - Importar `enrichStrategyDefaults()` no `contentPlanner.js` antes de chamar o CMO
   - Passar `writer_profile`, `format_structure`, `format_goal` para dentro do `promptEstrategista`
   - Remover a exigência de `tipo_roteiro` dos 5 tipos CTD quando o formato é Carrossel ou Stories — nesses casos, usar `CAROUSEL_STRUCTURES` ou `STORIES_STRUCTURES` respectivamente

2. **Criar três pipelines diferenciados no `prompts.js`**
   - `promptRoteiristaShorts()` (o atual, purificado de referências a lâmina)
   - `promptRoteiristaCarrossel()` (novo, com: hierarquia tipográfica, papel funcional por lâmina, psicologia do save, repetição do hook na última lâmina, alt text)
   - `promptRoteiristaStories()` (novo, com: stickers interativos, duração por tela, mecânica de link sticker)
   - O `App.jsx`/`usePipeline.js` escolhe qual chamar baseado no `formato_imposto`

3. **Criar `promptDiretorCarrossel()` e `promptDiretorStories()`**
   - Carrossel fala em "LÂMINAS" com papéis (capa / desenvolvimento / virada / CTA) e gera prompt de imagem adequado à função (capa = texto tipográfico grande; virada = visão ampla com dado; CTA = texto+setinha)
   - Stories fala em "TELAS" com sticker associado

4. **Refatorar `buildImagePrompt.js` para ser format-aware**
   - Para carrossel: substituir `CAMERA_INSTRUCTIONS` por `LAMINA_ROLES` (capa, desenvolvimento, revelação, transição, fechamento), com composição adequada a cada uma
   - Para stories: overlay de texto grande, safe zones para stickers, brand bar

5. **Especializar o Distribuidor por formato**
   - Bloco Instagram Carrossel (capa + última lâmina + legenda + hashtags save + alt text)
   - Bloco Instagram Stories (texto por tela + sticker + link + ordem)
   - Bloco Instagram Feed (se/quando aplicável)

### P1 (melhora qualidade e funil)

6. **Adicionar o 6º tipo ao CTD: `pergunta_capciosa`** (inspirado em ETs, quantas pessoas, erro 404)

7. **Criar um "motor" explícito para demo do freemium do Atlas: `feature_reveal`**
   - Gatilho: "Atlas faz X que você nunca viu antes — olha isso"
   - Estrutura: dor concreta → ação no app → resultado surpreendente → "isso é grátis"
   - Posicionamento: é o post de retenção real, não uma menção perdida

8. **Criar `buildAtlasBridge(raciocinioCentral, featureAtlas)`** 
   - Recebe o raciocínio do roteiro e a feature que vai aparecer
   - Gera uma frase de ponte orgânica (como CTD faz com Alura/LATAM)
   - Roteirista chama isso como último passo quando o objetivo é retencao/conversao

9. **Permitir tema de crescimento sem âncora ENEM**
   - Adicionar `mundo_puro: true` como flag no Estrategista
   - Quando ativo, remove o bloco "MUNDO → MECANISMO → ENEM" e vira só "MUNDO → MECANISMO → IMPLICAÇÃO DO MUNDO"
   - Meta: 30-50% dos posts de crescimento sem ENEM mencionado

10. **Segmentar a Memória Narrativa por formato**
    - `addTemaCoberto(tema, formato, data, objetivo)` já existe, mas a consulta `temasRecentes` ignora o formato
    - Permitir "Lei de Ohm em carrossel é OK se Shorts foi há >14 dias"

### P2 (otimização e loop fechado)

11. **Gerar copy plataforma-específica no Distribuidor**
    - TikTok hook escrito para algoritmo de 3s
    - Reels hook otimizado para retenção/share
    - YouTube Shorts otimizado para busca/SEO no título

12. **Loop de aprendizado ativo**
    - `dataAnalyst.js` já analisa performance; falta extrair "lições" em forma de restrição
    - Adicionar `getLicoesAtivas()` que retorna ["evite tema X", "hook tipo Y performou"] e injetar no Estrategista

13. **Teste A/B no Roteirista**
    - Roteirista gera 2 hooks, CMO ou humano escolhe
    - Tracking de qual hook rendeu, alimenta o aprendizado

14. **QA (Revisor) format-aware**
    - Critérios diferentes por formato
    - Para carrossel: "primeira lâmina tem <8 palavras? tipografia respira? última reprisa o hook?"
    - Para stories: "tem sticker interativo? link sticker se objetivo é conversão?"

---

## Parte 5 — Estratégia de venda: como o Atlas vira receita via freemium

### 5.1. A jornada real do aluno (o que o funil de conteúdo deve respeitar)

1. **Descoberta** — aluno vê um Shorts do Atlas no feed por curiosidade (não porque buscou ENEM)
2. **Reconhecimento** — aluno começa a ver a marca aparecer 2-3x por semana
3. **Primeira tentativa** — aluno entra no Atlas **grátis** (10 questões/dia, 1 redação/semana)
4. **Valor percebido** — aluno manda uma redação merda, recebe análise das 5 competências + versão nota 1000 da própria voz dele. Esse momento é o "aha"
5. **Conversão para PRO** — quando o aluno quer mais de 1 redação/semana, ou quando o sistema gera flashcards automáticos, ele assina
6. **Programa Fundadores** — desconto decrescente por mês até o ENEM, cria urgência de compra antecipada

Esse funil tem 6 etapas. O Complexity hoje cuida bem da etapa 1 (crescimento) e mal da etapa 3-5 (retenção/conversão).

### 5.2. O que cada tipo de post deveria fazer

| Etapa da jornada | % do mix | Tipo de post | O que o Complexity precisa fazer |
|---|---|---|---|
| Descoberta | 60-70% | Shorts de curiosidade pura do mundo — **sem ENEM, sem Atlas** | Remover a amarra de "MUNDO → MECANISMO → ENEM" em 100% dos posts; liberar posts sem ENEM |
| Reconhecimento | 10% | Carrossel de autoridade — explica um tema do ENEM com profundidade, mas o Atlas só aparece na última lâmina como "olha como a gente vê isso aqui" | Pipeline próprio de Carrossel com assinatura visual Atlas |
| Primeira tentativa | 10% | Shorts ou Stories de "demo do freemium" — mostra a tela do Atlas resolvendo uma dor em 15s | Criar o tipo `feature_reveal`; gerar prompts de imagem que incluem screenshot do app |
| Valor percebido | 5% | Prova social — aluno anônimo que usou e viu nota subir | Criar pipeline para input de prova social; gerar narração emocional respeitosa |
| Conversão | 5% | CTA direto com urgência real do Programa Fundadores | Distribuidor especializado em stories de conversão com link sticker |
| Reativação | 5% | Stories para a base existente: dica prática + "lembrete de que PRO destrava isso" | Roteirista de stories reconhece base aquecida vs topo do funil |

### 5.3. Onde o Atlas tem vantagem competitiva que o conteúdo precisa explorar

Olhando `FREE_FEATURES` do Landing, o freemium do Atlas tem alguns elementos que **nenhum concorrente direto oferece de graça**:

- Análise das 5 competências do ENEM com IA — **vale conteúdo**
- **Versão melhorada (nota 1000) do próprio texto do aluno** — isso é o momento "aha" do produto. Um Shorts mostrando "aluno manda redação 400, Atlas devolve a mesma redação escrita em nota 1000 mantendo o argumento original" é a demo mais forte possível
- Tema do dia automático com estrutura — **vale recorrência**
- Editor de redação no celular — **vale funcional**

O PRO adiciona:
- Ilimitado
- Flashcards automáticos ao errar (esse é o outro "aha" — o aluno erra uma questão e o sistema já gerou um flashcard daquele erro específico)
- Cápsulas de conhecimento
- Plano diário personalizado

A tese: **o conteúdo de retenção (20%) deve ser demo desses 2 momentos "aha"** — redação nota 1000 da própria voz e flashcard automático do erro. Esses dois vídeos, feitos certo, viralizam porque são visualmente novos. Ninguém mostra isso no TikTok educacional hoje.

### 5.4. Programa Fundadores como motor de conversão

O arquivo `Founders.tsx` existe, e o desconto escalona com os meses até o ENEM (`getDiscountTier(monthsUntilEnem)`). Esse é um elemento de urgência real, não artificial. Mas no Complexity inteiro, **não há um único prompt que saiba contar a história do Fundadores**. Isso tem que virar:

- Um post de conversão mensal que fala "quem entrar até X paga Y% menos para sempre"
- Um Stories semanal de atualização do desconto atual
- Um Carrossel a cada 2 meses explicando por que o programa existe (você quer seguidores que virem assinantes antes do ENEM, não depois)

### 5.5. O teste real: quando o sistema está certo

Um produto do Atlas fica evidente quando, olhando o feed, o usuário consegue:
- Passar por 3 Shorts seguidos e ficar curioso, sem perceber que é marca de ENEM
- Ver 1 Carrossel e guardar para estudar depois — **o Atlas é mencionado só na última lâmina, como "quem monta esse tipo de material aqui é o Atlas"**
- Ver 1 Stories e clicar no link sticker porque ele fez uma pergunta que o Atlas responde

Se o feed atual passar nesse teste, o Complexity está funcionando. Hoje, quase certamente não passa — porque o viés de formato faz tudo parecer o mesmo Shorts reciclado em PowerPoint.

---

## Parte 6 — Próximos passos concretos

1. **Corrigir o órfão primeiro** (scriptFramework.js no pipeline) — 1 dia de trabalho, destrava 50% dos problemas
2. **Três pipelines de roteirista separados** — 2-3 dias
3. **buildImagePrompt.js format-aware** — 1 dia
4. **Distribuidor por plataforma específica** — 1-2 dias
5. **Tipo feature_reveal + buildAtlasBridge** — 1 dia
6. **Flag mundo_puro e tema de crescimento sem ENEM** — 0.5 dia
7. **Stories pipeline para Fundadores** — 1 dia

Total: uma ou duas semanas de trabalho focado para destravar o sistema inteiro.

---

## Resumo em uma linha

O Complexity já tem as peças certas — o problema é que não montou o motor direito. O scriptFramework.js foi escrito para resolver exatamente o viés de formato e ninguém o conectou; o CTD foi adaptado para ENEM mas com amarra demais no ENEM; e o funil de conversão via freemium não tem prompts dedicados para os momentos que vendem o Atlas. Arrumar isso é cirúrgico, não reescrita.
