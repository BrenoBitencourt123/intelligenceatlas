
# Plano: Corrigir Sistema de Pontuacao ENEM

## Diagnostico

Encontrei **tres problemas** no calculo de notas:

### Problema 1: `estimateScore` retorna 0 para blocos analisados

No arquivo `src/lib/precheck.ts`, linha 276:

```
// With analyzed blocks, we'd use AI scores
// This is a placeholder - actual implementation would use AI results
return 0;
```

Isso e um bug! Quando os blocos sao analisados pela IA, a funcao retorna 0 ao inves de usar os dados reais.

### Problema 2: Formulas de competencias muito conservadoras

O calculo atual em `calculateCompetencies` e muito restritivo. Uma redacao com 75% dos checks marcados recebe notas na faixa de 180-190 por competencia, mas se a IA marcar menos checks (ex: 50%), a nota cai muito.

### Problema 3: Dependencia excessiva do checklist

O sistema depende muito da proporcao de checks marcados pela IA, mas a IA pode ser inconsistente na quantidade de itens que marca como `true`.

---

## Solucao Proposta

### 1. Corrigir `estimateScore` para usar dados de analise

**Arquivo:** `src/lib/precheck.ts`

Quando houver blocos analisados, usar os scores das competencias ja calculadas ao inves de retornar 0.

### 2. Ajustar formulas de `calculateCompetencies`

**Arquivo:** `src/lib/ai.ts`

Novas formulas mais justas que:
- Dao mais peso a presenca de blocos completos
- Sao menos punitivas para pequenos problemas
- Consideram que uma redacao estruturada ja merece nota base alta

Formulas propostas:

| Competencia | Formula Atual | Formula Proposta |
|-------------|---------------|------------------|
| C1 | 80 + 40 + 40 + (score * 40) | 100 + 50 + (score * 50) |
| C2 | 60 + 60 + (score * 80) | 80 + 60 + (score * 60) |
| C3 | 60 + 60 + (score * 80) | 80 + 60 + (score * 60) |
| C4 | 60 + 60 + (score * 80) | 80 + 60 + (score * 60) |
| C5 | 40 + 80 + (score * 80) | 60 + 80 + (score * 60) |

Isso garante que uma redacao completa com checks razoaveis (60-80%) alcance 900+.

### 3. Adicionar peso minimo para blocos analisados

Se um bloco foi analisado com sucesso (sem erros graves), garantir um score minimo de 0.6 (60%) mesmo se a IA marcar poucos checks.

---

## Mudancas Tecnicas Detalhadas

### Arquivo: `src/lib/precheck.ts`

Atualizar a funcao `estimateScore` para nao retornar 0 quando houver blocos analisados. Usar os dados de competencias do state.

### Arquivo: `src/lib/ai.ts`

Atualizar `calculateCompetencies`:

```typescript
// Garantir score minimo de 0.6 para blocos analisados
const introScore = introTotal > 0 
  ? Math.max(0.6, introChecks / introTotal) 
  : 0.5;

// Formulas mais justas
const c1 = Math.min(200, Math.round(
  100 + (hasIntro ? 50 : 0) + (hasDev ? 0 : 0) + (introScore * 50)
));
const c2 = Math.min(200, Math.round(
  80 + (hasIntro ? 60 : 0) + (introScore * 60)
));
// ... etc
```

---

## Exemplo de Resultado Esperado

### Redacao Completa com 80% dos checks:

| Competencia | Atual | Proposta |
|-------------|-------|----------|
| C1 | 192 | 200 |
| C2 | 184 | 200 |
| C3 | 184 | 188 |
| C4 | 184 | 188 |
| C5 | 184 | 188 |
| **Total** | **928** | **964** |

### Redacao Completa com 60% dos checks (minimo garantido):

| Competencia | Atual | Proposta |
|-------------|-------|----------|
| C1 | 184 | 180 |
| C2 | 168 | 176 |
| C3 | 168 | 176 |
| C4 | 168 | 176 |
| C5 | 168 | 176 |
| **Total** | **856** | **884** |

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/lib/ai.ts` | Ajustar formulas de `calculateCompetencies` |
| `src/lib/precheck.ts` | Corrigir `estimateScore` para usar dados reais |

---

## Alternativa: Pedir Score Direto para a IA

Se preferir, posso também modificar a edge function `analyze-block` para que a propria IA retorne um score sugerido (0-200) para cada competencia relacionada ao bloco. Isso seria mais preciso, porem aumentaria o uso de tokens.

Qual abordagem voce prefere?
1. **Ajustar formulas locais** (mais rapido, sem custo adicional)
2. **IA retornar scores** (mais preciso, custo adicional de tokens)
