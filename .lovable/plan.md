
# Corrigir perda de questoes na importacao (gabarito + truncamento da IA)

## Problema 1: Gabarito nao encontra respostas (Q121-123)

O regex atual usa `\b` (word boundary) apos capturar a letra da resposta:

```text
/(\d+)\s*[-.\s]?\s*([A-EX*])\b/g
```

Quando o PDF do gabarito gera texto corrido como `121B122A123C...`, nao existe word boundary entre a letra (B) e o proximo digito (1), entao o match falha silenciosamente.

**Correcao**: Trocar `\b` por um lookahead que aceita digito, espaco ou fim de string:

```text
/(\d+)\s*[-.\s]?\s*([A-EX*])(?=\d|\s|$)/g
```

Arquivo: `src/hooks/useImportExam.ts` (linhas 98, 101)

## Problema 2: IA trunca saida e perde questoes (Q124-138)

Os logs mostram:
- Chunk 3: `finish_reason: length` (truncado em 16000 tokens)
- Questoes 124-138 estavam nesse chunk e foram descartadas

**Correcao em duas frentes**:

1. **Reduzir tamanho dos chunks** de 15000 para 10000 caracteres, gerando mais chunks menores que cabem no limite de tokens
2. **Detectar truncamento e reprocessar**: quando `finish_reason === 'length'`, identificar quais questoes faltam no range esperado e reenviar o chunk pedindo apenas as questoes faltantes
3. **Aumentar max_tokens** de 16000 para 32000 como margem de seguranca

Arquivo: `supabase/functions/parse-exam-pdf/index.ts`

### Detalhes tecnicos da logica de reprocessamento

Apos processar todos os chunks, o sistema:
1. Identifica o range esperado de questoes (min a max dos numeros extraidos)
2. Encontra lacunas (numeros ausentes)
3. Para cada chunk que foi truncado, reenvia com prompt especifico pedindo apenas os numeros faltantes
4. Mescla os resultados

## Arquivos a editar

- `src/hooks/useImportExam.ts` — corrigir regex `\b` no parser do gabarito
- `supabase/functions/parse-exam-pdf/index.ts` — reduzir chunk size, aumentar max_tokens, adicionar retry em truncamento
