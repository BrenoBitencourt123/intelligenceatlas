

## Diagnóstico: Indicador "Arraste para baixo"

Olhando o código, o indicador está posicionado com `bottom-20` (80px do fundo). Nas screenshots parece estar bem no limite inferior da tela.

## Plano: Subir o indicador de scroll

Mover o "Arraste para baixo" mais para cima, de `bottom-20` para `bottom-32` ou `bottom-36` (~128-144px), para que fique mais próximo do conteúdo principal e não tão grudado no rodapé da tela.

### Mudança
**`src/pages/Founders.tsx` (linha 237):**
- Alterar `bottom-20` para `bottom-32` na classe do scroll indicator

