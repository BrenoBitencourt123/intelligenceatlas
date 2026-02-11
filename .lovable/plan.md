

# Corrigir deteccao de "Anulado" (masculino) no parser do gabarito

## Problema

O gabarito oficial usa "Anulado" (masculino), mas o regex so reconhece "ANULADA" e "NULA". Apos o `.toUpperCase()`, o texto vira "ANULADO" que nao casa com o padrao, resultando em 10 questoes "sem gabarito" ao inves de 7 sem gabarito + 3 anuladas.

## Correcao

Arquivo: `src/hooks/useImportExam.ts`

Alterar as duas ocorrencias do regex de anulacao:

- **Linha 88**: `/(ANULADA|NULA)/` para `/(ANULAD[AO]|NULA)/`
- **Linha 91**: `/(ANULADA|NULA)/` para `/(ANULAD[AO]|NULA)/`

Isso faz o parser aceitar tanto "Anulada" quanto "Anulado" (ambos comuns em gabaritos oficiais do ENEM).

## Resultado esperado

- 3 questoes (123, 132, 174) aparecerao com badge "Anulada" e desmarcadas
- As demais 7 sem gabarito continuarao como alerta amarelo separado
- Total: 73 questoes, sendo 63 com gabarito, 3 anuladas, 7 sem gabarito

