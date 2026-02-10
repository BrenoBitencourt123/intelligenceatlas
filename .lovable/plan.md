

## Importacao com Gabarito em PDF

### O que muda

O fluxo atual pede que o usuario cole o gabarito como texto. O novo fluxo aceita o gabarito tambem como PDF, extraindo automaticamente as respostas da tabela.

---

### Novo fluxo da tela de Upload

```text
[Ano da Prova] [Dia: 1 ou 2]

[Upload PDF da Prova]    -- drag-and-drop
[Upload PDF do Gabarito] -- drag-and-drop (opcional)

-- OU --

[Textarea para colar gabarito manualmente]

[Botao: Extrair Questoes]
```

O usuario pode:
- Enviar o gabarito como PDF (o sistema extrai o texto com pdfjs-dist e faz o parse)
- OU colar o gabarito como texto (formato atual)
- OU deixar em branco e preencher depois

---

### Mudancas tecnicas

**1. `src/pages/Import.tsx` -- componente UploadStage**

Adicionar um segundo campo de upload para o PDF do gabarito:
- Novo state `gabaritoFile: File | null`
- Novo state `gabaritoMode: 'pdf' | 'text'` -- toggle entre upload PDF e textarea
- Quando o usuario faz upload do PDF do gabarito:
  - Extrai texto com pdfjs-dist (mesma logica do PDF da prova)
  - Passa o texto extraido para `parseAnswerKey()` do hook
- A funcao `onExtract` recebe o gabarito como string (seja do PDF ou do textarea)

Layout do gabarito:
- Dois botoes/tabs: "Upload PDF" e "Colar texto"
- Se PDF: area de drag-and-drop para o gabarito
- Se texto: textarea atual

**2. `src/hooks/useImportExam.ts` -- melhorar parseAnswerKey**

O parse atual ja funciona bem, mas precisa lidar com o formato extraido do PDF do gabarito. O texto extraido do PDF do gabarito tera formato tipo:

```
QUESTÃO INGLÊS GABARITO QUESTÃO ESPANHOL GABARITO 1 D 46 E 2 D 47 D ...
```

Ajustar `parseAnswerKey` para tambem detectar esse formato tabular:
- Regex para capturar pares `numero + letra` mesmo com texto entre eles
- Ignorar headers como "QUESTAO", "GABARITO", "INGLES", "ESPANHOL"
- O parser atual com `(\d+)\s*[-.\s]?\s*([A-E])` ja captura a maioria dos casos, mas precisamos garantir que funcione com o formato extraido do PDF

**3. `src/hooks/useImportExam.ts` -- nova funcao extractAnswerKeyFromPdf**

Nova funcao que:
- Recebe um `File` (PDF do gabarito)
- Extrai texto com pdfjs-dist
- Retorna a string de texto para ser processada por `parseAnswerKey`

**4. `src/pages/Import.tsx` -- ajustar chamada**

Na funcao `handleSubmit`:
- Se `gabaritoMode === 'pdf'` e tem arquivo: extrair texto do PDF antes de chamar `onExtract`
- Se `gabaritoMode === 'text'`: usar o texto do textarea (comportamento atual)

---

### Sobre deteccao automatica do ano

O PDF do gabarito contem "Gabarito 2025" no texto. Podemos extrair o ano automaticamente:
- Ao fazer upload do gabarito PDF, extrair o ano com regex `/Gabarito\s+(\d{4})/`
- Preencher o campo de ano automaticamente
- O usuario ainda pode editar manualmente

---

### Arquivos alterados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Import.tsx` | Adicionar upload de PDF do gabarito com toggle pdf/texto, auto-deteccao de ano |
| `src/hooks/useImportExam.ts` | Nova funcao `extractAnswerKeyFromPdf`, melhorar `parseAnswerKey` para formato tabular |

Nenhuma mudanca na edge function -- ela continua recebendo o mesmo formato.

