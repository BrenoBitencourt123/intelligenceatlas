

## Plano: Editor Visual de Questoes estilo Simulado

O objetivo e substituir o PreviewStage atual (lista compacta de cards) por um editor visual de questao unica, semelhante ao layout do simulado nas imagens de referencia: questao principal a esquerda com enunciado, imagens inline e alternativas editaveis, e um grid de navegacao a direita com indicadores de status.

### Arquitetura

```text
PreviewStage (refatorado)
├── QuestionEditor (painel esquerdo — scrollavel)
│   ├── Header: "Q.1 de 90" + badges (area, idioma)
│   ├── Statement editor (textarea com suporte a {{IMG_N}})
│   │   └── Inline image slots (drag/drop, paste, upload)
│   ├── Alternatives editor (A-E, cada uma com texto + imagem)
│   ├── Metadados: area, resposta correta, lingua estrangeira
│   └── Navegacao: < Anterior | Proxima >
│
└── Sidebar (painel direito — fixo)
    ├── Status summary (OK / Com erro / Vazias)
    ├── Grid de numeros (1-90 ou 91-180)
    │   ├── Verde: questao OK (tem enunciado + gabarito)
    │   ├── Amarelo: questao com problema (sem gabarito, sem enunciado)
    │   ├── Vermelho: questao vazia / critica
    │   ├── Borda: questao atual selecionada
    │   └── Cinza: questao nao importada
    └── Botao "Revisar e Importar"
```

### Tarefas de implementacao

1. **Criar componente QuestionEditor** — Renderiza uma unica questao em formato visual completo (similar ao simulado). Inclui:
   - Textarea para enunciado com preview de imagens inline ({{IMG_N}})
   - Botoes para adicionar/remover imagens no enunciado (upload, paste, reordenar)
   - 5 alternativas editaveis (texto + slot de imagem cada)
   - Selects para area, resposta correta, lingua estrangeira
   - Navegacao Anterior/Proxima

2. **Criar componente QuestionGrid (sidebar)** — Grid numerico com cores de status:
   - Calcular status de cada questao: `ok` (tem statement + correct_answer), `warning` (falta gabarito ou enunciado curto), `empty` (sem dados), `error` (anulada ou critica)
   - Contadores no topo: "X completas, Y com erro, Z vazias"
   - Click no numero navega para a questao

3. **Refatorar PreviewStage** — Substituir o layout de lista por um layout de 2 colunas:
   - Esquerda: QuestionEditor mostrando a questao selecionada (navegavel)
   - Direita: QuestionGrid + botao de importar
   - Manter funcionalidades existentes (toggle selecao, add manual, avisos de missing)
   - Mobile: grid em cima, editor embaixo (responsivo)

4. **Logica de insercao de imagem inline** — Ao adicionar imagem no editor, inserir automaticamente `{{IMG_N}}` na posicao do cursor no textarea do enunciado, para que o usuario controle onde a imagem aparece no texto.

### Detalhes tecnicos

- O `QuestionEditDialog` atual sera eliminado — a edicao passa a ser inline no editor principal
- O estado de "questao atual" sera controlado por um index no PreviewStage
- As funcoes `onAddImages`, `onRemoveImage`, `onAddAlternativeImage`, `onRemoveAlternativeImage`, `onUpdateQuestion` do hook ja existem e serao reutilizadas
- O grid de navegacao usa a mesma logica de `DAY_RANGES` para determinar quais numeros mostrar
- Nenhuma mudanca no banco de dados ou edge functions necessaria

