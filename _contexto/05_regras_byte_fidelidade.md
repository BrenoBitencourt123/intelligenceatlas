# Regras de byte-fidelidade — extração de provas

Decididas com Breno em 2026-05-14 durante o piloto da ENEM 2023 Dia 1.
Estas regras se aplicam a TODAS as provas extraídas daqui em diante (ENEM 2022, 2024, 2025, Fuvest, UERJ, etc).

---

## Regra 1 — Quebras de linha cosméticas: UNIFICAR

**Contexto**: O PDF do INEP usa coluna estreita e quebra texto em linhas curtas por razão de layout, não editorial. Isso gera `\n` no meio de frases na extração do PyMuPDF.

**Regra**:
- Quebras de linha *dentro* de um parágrafo (em meio a uma frase) → **REMOVER**, substituir por espaço único.
- Quebras de linha *entre* parágrafos reais (separados por linha em branco no PDF, ou separados por mudança lógica de bloco) → **PRESERVAR**, manter como `\n\n`.
- Hifenização no fim de linha (palavra cortada com `-`) → **REUNIFICAR** removendo o hífen e juntando.

**Exemplo**:

PDF/PyMuPDF:
```
The average american tosses 300 pounds of food
each year, making food the number one contributor to
America's landfills.
```

Saída final:
```
The average american tosses 300 pounds of food each year, making food the number one contributor to America's landfills.
```

---

## Regra 2 — Espaços e pontuação anômalos: NORMALIZAR

**Contexto**: O PDF do INEP tem ocasionalmente bugs tipográficos — espaço antes de pontuação, espaços duplos, espaço antes de fechar aspas.

**Regra**:
- Espaços duplos → espaço único.
- Espaço antes de `.`, `,`, `;`, `:`, `!`, `?`, `)`, `]`, `"`, `'` → remover o espaço.
- Espaço depois de `(`, `[`, `"` (de abertura), `'` (de abertura) → remover o espaço.
- `\t` (tab) no meio de texto → espaço único.

**Exemplo**:

PDF: `"No man is an island "` (espaço antes da aspa)
Saída: `"No man is an island"`

PDF: `( exemplo  com 2 espaços )` → Saída: `(exemplo com 2 espaços)`

---

## Regra 3 — Convenção `[continuação` de poemas: PRESERVAR LITERAL

**Contexto**: Em poemas com versos longos, o INEP quebra com colchete inicial na linha de continuação.

**Regra**:
- **Manter exatamente como aparece no PDF**, incluindo `[mother`, `[hearts`, etc. em linhas separadas.
- NÃO unificar com a linha anterior.
- NÃO remover o `[`.

**Exemplo**:

PDF:
```
We carry tears in our eyes: good-bye father, good-bye
[mother
We carry soil in small bags: may home never fade in our
[hearts
```

Saída (idêntica):
```
We carry tears in our eyes: good-bye father, good-bye
[mother
We carry soil in small bags: may home never fade in our
[hearts
```

**Justificativa**: decisão consciente de Breno. Preserva fidelidade ao layout do INEP em obras literárias. Aluno ENEM convive com essa convenção em prova oficial e deve treinar com ela.

---

## Regra 4 — Markdown no statement

Aplicar conforme o sistema `parse-exam-pdf` do Atlas já usa:

- Textos de apoio (poemas, trechos, citações, letras de música) → bloco de citação com `> ` no início de cada linha.
- Título/fonte do texto de apoio → itálico com `*texto*`.
- Pergunta final / comando → **negrito** com `**texto**`.
- Imagens → placeholder `{{IMG_N}}` no ponto exato onde aparece, com `N` = 0, 1, 2... (ordem no array `images`).

---

## Regra 5 — Caracteres especiais e tipográficos

- Aspas tipográficas (`"` / `"` / `'` / `'`) → **PRESERVAR** como estão no PDF (o INEP usa).
- Travessão (`—`) e meio-traço (`–`) → preservar como estão (não converter para hífen `-`).
- Reticências `...` → preservar como estão. Se o PDF usa `…` (caractere unicode único), preservar também.
- Acentos: PyMuPDF extrai bem. Conferir amostralmente em palavras com til e cedilha.

---

## Regra 6 — Alternativas

- Letras: **A, B, C, D, E** (maiúsculas).
- Texto da alternativa: aplicar regras 1, 2 (unificar quebras, normalizar espaços).
- **PRESERVAR pontuação final** se houver no PDF (ex: ponto final em "os lixões precisam de ampliação."). Não remover.

---

## Regra 7 — Gabarito

- Fonte da verdade: o PDF de gabarito oficial do INEP.
- Cruzar cada questão: `correct_answer` (letra A-E) bate com o gabarito?
- Se questão **anulada** pelo gabarito: marcar com `tags: ["anulada"]` e `needs_review: true`, mas ainda incluir no JSON.

---

## Regra 8 — Imagens

- Recortar usando texto-âncora (script `recortar_regiao.py`).
- Nome do arquivo: `Q{NN}_{lang}.png` ou `Q{NN}.png` se não tem variante de idioma.
- `requires_image: true` se a questão **não pode ser respondida sem ver a imagem**.
- `image_reason`: frase curta explicando por quê (ex: "Esquema da cadeia respiratória com rótulos integrados").
- Posicionar `{{IMG_0}}` no `statement` no ponto exato onde a imagem aparece no PDF.

---

## Em uma frase

Byte-fiel ao CONTEÚDO publicado pelo INEP, normalizando apenas artefatos de layout (quebras cosméticas) e bugs tipográficos (espaços anômalos), **exceto** convenção `[continuação` de poemas que se preserva literal.
