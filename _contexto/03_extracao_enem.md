# Extracao de questoes ENEM - 3 caminhos existentes

## Resumo executivo

O Atlas ja tem **tres caminhos automatizados de import**, todos ja construidos e funcionais. O workflow manual atual (skills `enem-extraction*` que rodam Python local com pdfplumber/PyMuPDF) eh redundante com pelo menos um deles na maioria dos cenarios.

## Caminho 1: API enem.dev (`import-enem-api`)

**Quando usar:** ENEMs que ja existem na enem.dev (provas oficiais 1998-2024 + reaplicacoes + LIBRAS + PPL).

**Como funciona:**
- Aluno admin chama com `{ year, user_id }`.
- Funcao pagina `https://api.enem.dev/v1/exams/{year}/questions?limit=50&offset=N` ate buscar todas as questoes.
- Faz uma segunda passada com `?language=ingles` pra pegar as questoes 1-5 da prova de ingles (porque a chamada default retorna espanhol).
- Filtra ja existentes pela chave `(year, number)`.
- Mapeia para o schema interno (statement, alternatives JSONB, images JSONB, correct_answer, foreign_language, etc).
- Inserts em batches de 50.

**Output direto no Supabase**, com schema do Atlas. **Zero trabalho manual.**

**Limitacoes:**
- Topic/subtopic/difficulty/skills/tags ficam `'Geral'/''/2/[]/[]` - precisam de classificacao depois (rodar `pre-classify-batch` ou `classify-question`).
- Imagens entram como URLs apontando pra cdn.enem.dev (nao sao baixadas localmente). Se enem.dev cair, links quebram. Risco baixo mas existe.
- Nao processa redacao - so objetivas.

## Caminho 2: Parse PDF via Gemini Vision (`parse-exam-pdf`)

**Quando usar:** Provas nao disponiveis na enem.dev (PSC, Fuvest, UERJ, provas piloto) OU quando enem.dev tem dado incorreto/incompleto.

**Como funciona:**
- Recebe `images[]` (array de base64 das paginas do PDF) ou `chunk` (texto bruto - modo legado).
- Chama Gemini 2.5 Flash com prompt detalhadissimo:
  - Identifica questoes por padrao `QUESTAO N`.
  - Ignora capa, instrucoes, proposta de redacao, rascunho.
  - **Posiciona placeholders `{{IMG_N}}`** no statement exatamente onde a imagem aparece.
  - Formata em markdown: textos de apoio com `>`, titulo em italico, pergunta em **negrito**.
  - Classifica area, gera explanation pedagogica + tags + requires_image + image_reason.
- Roda em chunks (`chunkIndex`, `totalChunks`) - para PDFs grandes processa varias paginas por chamada.
- Suporta retry em 429.

**Vantagem sobre extracao Python local:**
- Texto, layout, imagens e classificacao saem em uma chamada.
- Gemini Vision **ja entende grafico/tabela/mapa** e descreve entre colchetes quando preciso.
- `requires_image` eh detectado automaticamente.

**Limitacoes:**
- Token limit (16k output). Se a prova for grande, precisa chunkar paginas em grupos.
- Texto pode nao ser byte-fiel (modelo pode reformular silenciosamente). Para fidelidade absoluta ainda precisa validacao humana.
- Custa tokens - cada chamada com imagens base64 eh cara.
- Nao tem `requires_image` cross-check (skill `enem-validation` faria isso, mas com PDF original).

## Caminho 3: Import manual via UI (`/importar` + `parse-exam-pdf`)

**Quando usar:** Workflow do admin do Atlas. Ja existe interface (`Import.tsx`, `QuestionEditor`, `QuestionGrid`).

**Fluxo:**
1. Admin sobe PDF na UI.
2. UI usa pdfjs-dist (`pdfjs-dist@4.9.155`) pra renderizar paginas em base64.
3. Chama `parse-exam-pdf` em chunks.
4. Mostra grid com questoes extraidas, admin revisa/corrige em `QuestionEditor`.
5. Admin confirma -> insert na `questions`.

Esse eh o caminho **principal** pensado pelo time do Atlas (Lovable que escreveu).

## O workflow Python local (skills `enem-extraction*`) - posicionamento honesto

**O que faz:** roda pdfplumber/PyMuPDF localmente, gera JSON, valida com checks (byte-fiel, schema, gabarito cross-check), depois importa via `/importar`.

**Por que existe:** provavelmente foi construido antes de `parse-exam-pdf` existir, ou pra controle maximo de qualidade em provas criticas, ou porque o Breno queria validacao Python automatizada que a UI nao oferece.

**Veredito honesto:**
- Para provas oficiais ENEM 1998-2024: **enem.dev resolve melhor**. Sem trabalho, sem alucinacao.
- Para provas nao listadas na enem.dev (ENEM 2025+, PSC, Fuvest, etc): **parse-exam-pdf via UI** eh mais rapido E mais alinhado com o schema do Atlas (porque foi escrito pelo proprio Atlas).
- Para casos de qualidade obsessiva (e.g. material publicavel formalmente): o Python local **adiciona valor** porque permite validacao rigorosa byte-fiel + amostragem visual que `parse-exam-pdf` nao tem.

**Recomendacao:**
- Usar enem.dev por padrao para anos cobertos.
- Usar UI `/importar` (com `parse-exam-pdf`) como segundo recurso.
- Manter Python local **somente** se a tese for "preciso garantia byte-fiel que IA nao da". Nesse caso, usar Python so para extracao e validacao, e gerar JSON no schema do Atlas direto - **pular o intermediario "sistema para pegar questoes"**.

## Estado atual da pasta `_extracao_enem2023_dia1/`

(Nao examinado em profundidade nesta sessao - olhar quando retomar.)
