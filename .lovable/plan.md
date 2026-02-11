

# Trocar parse-exam-pdf para Gemini 2.5 Flash

## Resumo

Configurar a Edge Function `parse-exam-pdf` para usar o Gemini 2.5 Flash com sua chave pessoal do Google.

## Passos

1. **Adicionar secret `GEMINI_API_KEY`** -- vou solicitar que voce insira a chave obtida em [Google AI Studio](https://aistudio.google.com/apikey)

2. **Atualizar `supabase/functions/parse-exam-pdf/index.ts`**:
   - Trocar endpoint para `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
   - Trocar modelo para `gemini-2.5-flash`
   - Trocar variavel de `OPENAI_API_KEY` para `GEMINI_API_KEY`

3. **Redeployar** a Edge Function automaticamente

## Detalhes tecnicos

O Google oferece um endpoint compativel com formato OpenAI, entao a mudanca e minima:

```text
Antes:  api.openai.com  +  gpt-4.1-mini  +  OPENAI_API_KEY
Depois: generativelanguage.googleapis.com/v1beta/openai  +  gemini-2.5-flash  +  GEMINI_API_KEY
```

O formato de request (messages, temperature, response_format json_object) permanece identico. Nenhuma outra mudanca necessaria.

**Arquivos a editar:** `supabase/functions/parse-exam-pdf/index.ts`

