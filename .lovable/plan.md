

## Análise do Problema

Comparando as screenshots:
- **Desktop (image-179)**: Layout perfeito, título em duas linhas equilibradas
- **Mobile (image-178)**: O texto "20 Membros Fundadores" está vazando para fora da tela (cortado à direita)

**Causa raiz**: O `text-4xl` (36px) combinado com `whitespace-nowrap` em "Membros Fundadores" é muito grande para telas de 320-375px.

---

## Plano de Correção

### 1. Reduzir tamanho do título no mobile
**Linha 164**: Mudar de `text-4xl` para `text-2xl` ou `text-3xl`

```tsx
// De:
className="text-4xl sm:text-5xl lg:text-6xl ..."

// Para:
className="text-3xl sm:text-5xl lg:text-6xl ..."
```

### 2. Tornar o `whitespace-nowrap` responsivo
**Linha 172**: Aplicar `whitespace-nowrap` apenas em telas maiores

```tsx
// De:
<span className="whitespace-nowrap"> Membros Fundadores</span>

// Para:
<span className="sm:whitespace-nowrap"> Membros Fundadores</span>
```

Isso permite que o texto quebre naturalmente no mobile, evitando overflow.

### 3. Alternativa mais agressiva (se necessário)
Se ainda vazar, reduzir para `text-2xl` no mobile e ajustar leading.

---

## Resultado Esperado

- **Mobile**: Título quebra naturalmente em 2-3 linhas sem overflow
- **Desktop**: Mantém o layout elegante atual com "Membros Fundadores" numa única linha

