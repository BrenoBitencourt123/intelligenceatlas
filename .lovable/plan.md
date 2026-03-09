
## Problema Identificado

Na screenshot, o título ainda está com problemas:
- "Seja um dos 20" na primeira linha
- "Membros Fundadores" na segunda linha, mas encostando nas bordas da tela
- `text-4xl` (36px) + `whitespace-nowrap` = muito largo para mobile

## Correções Necessárias

### 1. Reduzir fonte no mobile
**Linha 164**: Trocar `text-4xl` por `text-3xl`
```tsx
className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]"
```

### 2. Remover whitespace-nowrap no mobile
**Linha 172**: Aplicar apenas em telas maiores
```tsx
<span className="sm:whitespace-nowrap"> Membros Fundadores</span>
```

### 3. Alternativa mais agressiva (se ainda não couber)
Usar `text-2xl` (24px) no mobile, que garantidamente cabe em telas de 320px.

## Resultado Esperado
- Mobile: Título com fonte menor que quebra naturalmente sem encostar nas bordas
- Desktop: Mantém o layout atual elegante
