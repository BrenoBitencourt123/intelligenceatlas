

## Importar Questões via Screenshots (Ctrl+V / Upload)

### Contexto
A edge function `parse-exam-pdf` já suporta modo visão (recebe array de imagens base64 e extrai questões com Gemini). Precisamos apenas criar a interface no frontend para capturar screenshots e enviar para essa function.

### Mudanças

#### 1. Nova seção "Importar por Screenshots" no `src/pages/Import.tsx`

Adicionar um novo card na `UploadStage` com:
- **Área de drop/paste**: aceita Ctrl+V (clipboard) e drag-and-drop de múltiplas imagens
- **Input de arquivo**: aceita múltiplos PNGs/JPGs
- **Galeria de thumbnails**: mostra previews das imagens coladas com botão de remover individual
- **Campo de ano**: select para informar o ano da prova (opcional, a IA tenta detectar)
- **Botão "Extrair Questões"**: converte imagens para base64, envia para `parse-exam-pdf` no modo visão, e carrega o resultado no mesmo fluxo de preview já existente

#### 2. Fluxo técnico

```text
Usuário cola prints (Ctrl+V / drop / file input)
         │
         ▼
  Converte para base64 (FileReader)
         │
         ▼
  Agrupa em batches de ~5 imagens
         │
         ▼
  Chama parse-exam-pdf { images: [...base64], year, day }
         │
         ▼
  Recebe JSON com questões extraídas
         │
         ▼
  Alimenta o mesmo onProcessJson() → preview existente
```

#### 3. Detalhes de implementação

- Listener de `paste` no document quando o card está visível, captura `clipboardData.items` do tipo `image/*`
- Cada imagem é convertida via `FileReader.readAsDataURL()` para base64
- Limite de ~20 imagens por vez (para não estourar payload)
- As imagens do print que contêm gráficos/figuras são preservadas: a IA marca `requires_image: true` e a imagem original do print pode ser recortada ou usada diretamente como a imagem da questão
- Progress bar durante o processamento (reutiliza o mesmo estado `loading`/`progress`)

#### 4. Sobre as imagens das questões

A IA vai descrever os elementos visuais entre colchetes (como já faz no PDF), mas o print original pode ser salvo como imagem da questão. A extração via screenshots **resolve o problema de imagens inconsistentes** porque a imagem vem direto da fonte visual.

### Arquivos alterados
- `src/pages/Import.tsx` — novo componente `ScreenshotImportSection` adicionado ao `UploadStage`

