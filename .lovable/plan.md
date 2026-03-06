

## Diagnóstico

### 1. Imagens não aparecendo

O problema está no formato dos dados no campo `images`. As questões importadas manualmente armazenaram as imagens como **array de strings** (`["https://...url.png"]`), mas o código espera **array de objetos** (`[{"url": "https://...", "order": 0}]`).

A função `normalizeQuestionImages` no frontend tenta acessar `value.url` em cada item — quando o item é uma string pura, isso retorna `undefined` e a imagem é descartada silenciosamente.

**Solução:** Executar uma migração SQL para corrigir os dados existentes, convertendo strings soltas em objetos com `url`/`order`. Também atualizar `normalizeQuestionImages` para ser resiliente a ambos os formatos (string ou objeto) como fallback defensivo.

### 2. Reclassificar questões

Já existe a edge function `reclassify-questions` que chama `classify-question` para cada questão. Ela aceita filtros como `year`, `needs_review`, `unclassified`, ou uma lista de `ids`.

**Solução:** Adicionar um botão "Reclassificar" no painel admin (aba Questões) que chama essa function com os filtros desejados (ex: ano 2020). Isso vai reprocessar a taxonomia (topic, subtopic, disciplina, cognitive_level, etc.) via Gemini.

---

## Plano de Implementação

### Etapa 1 — Corrigir dados de imagens no banco
Migração SQL para converter entries onde `images` contém strings puras em objetos `{url, order}`:

```sql
UPDATE questions 
SET images = (
  SELECT jsonb_agg(
    CASE 
      WHEN jsonb_typeof(elem) = 'string' 
      THEN jsonb_build_object('url', elem, 'order', idx, 'caption', null)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(images::jsonb) WITH ORDINALITY AS t(elem, idx)
)
WHERE images::text != '[]' 
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(images::jsonb) e 
    WHERE jsonb_typeof(e) = 'string'
  );
```

### Etapa 2 — Tornar normalizeQuestionImages defensivo
Atualizar a função em `useStudySession.ts` para aceitar tanto strings quanto objetos no array de imagens, evitando reincidência futura.

### Etapa 3 — Adicionar botão de reclassificação no Admin
Na aba "Questões" do painel admin, adicionar um botão que permite reclassificar questões por ano, chamando a edge function `reclassify-questions` existente. Exibirá progresso e resultado (processadas/erros).

---

**Formatos de imagem:** PNG e WebP são ambos suportados pelo componente — o formato não é a causa do problema.

