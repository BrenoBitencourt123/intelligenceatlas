

## Plano: Corrigir logo + ajustar padding do hero

### 1. Logo branca (quadrado sem ícone)
O `/icon-192.png` com `brightness-0 invert` está renderizando como quadrado branco. Trocar pela URL correta do logo usada no resto do app, e remover os filtros CSS:

```tsx
// Linha 127
<img 
  src="https://storage.googleapis.com/gpt-engineer-file-uploads/f4QJ9UCag0bQmfSQvlHZMs1PDKy2/uploads/1770063094363-favicon.ico" 
  alt="Atlas" 
  className="h-5 w-5 rounded brightness-0 invert" 
/>
```

### 2. Header cortando o conteúdo
Aumentar o `pt-24` do hero para `pt-28` (linha 168) para dar mais espaço abaixo do header fixo.

### 3. Responsividade
Sim, está responsivo. O hero usa `items-start sm:items-center` (mobile alinha no topo com padding, desktop centraliza), textos usam `text-xs sm:text-sm`, `text-3xl sm:text-6xl`, e o layout é todo flex com `max-w-2xl mx-auto`. O header também adapta com `truncate` no texto de urgência.

### Arquivo
- `src/pages/Founders.tsx` — linhas 127 e 168

