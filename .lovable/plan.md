

# Plano: Redesenhar Pagina de Planos com Layout Persuasivo

## Problema Identificado

A pagina atual mostra apenas o plano atual do usuario, e os outros planos aparecem como opcoes abaixo. Isso nao cria uma comparacao visual clara. Alem disso:

1. O Plano Pro tem menos features listadas que o Basico (parece menos atrativo)
2. Falta "Historico de redacoes" no Pro
3. "2 correcoes por dia" deveria ser "60 correcoes por mes" para paridade com Basico
4. Nao existe comparacao lado a lado dos 3 planos

## Solucao

Criar uma pagina com os 3 planos lado a lado (ou empilhados no mobile), com destaque visual para o Pro como "Recomendado".

---

## Novas Listas de Features

### Plano Free
- 1 redacao gratuita
- Editor completo
- Feedback resumido

### Plano Basico
- 30 correcoes por mes
- Analise das 5 competencias ENEM
- Versao melhorada da redacao
- Historico de redacoes

### Plano Pro (todas as features do Basico + exclusivas)
- 60 correcoes por mes
- Analise das 5 competencias ENEM
- Versao melhorada da redacao
- Historico de redacoes
- Tema do dia automatico
- Contexto e fundamentacao
- Perguntas norteadoras
- Estrutura sugerida

---

## Novo Layout Visual

```text
Desktop (3 colunas):
+-------------+  +---------------+  +-------------+
|   GRATIS    |  |    BASICO     |  |     PRO     |
|    R$ 0     |  |   R$ 29,90    |  |   R$ 49,90  |
+-------------+  +---------------+  +---------------+
|   Feature   |  |   Feature     |  |   Feature   |
|   Feature   |  |   Feature     |  |   Feature   |
|   Feature   |  |   Feature     |  |   Feature   |
+-------------+  |   Feature     |  |   Feature   |
|             |  +---------------+  |   Feature   |
|             |  | [Assinar]     |  |   Feature   |
+-------------+  +---------------+  |   Feature   |
                                    |   Feature   |
                                    +---------------+
                                    | [Assinar PRO] |
                                    | RECOMENDADO   |
                                    +---------------+

Mobile (empilhado, Pro primeiro com destaque):
```

---

## Elementos Persuasivos

1. **Badge "Recomendado"** no Plano Pro
2. **Destaque visual**: borda dourada e fundo levemente destacado no Pro
3. **Economia**: mostrar "Mais popular" ou "Melhor custo-beneficio"
4. **Ordem das features**: listar primeiro os diferenciais exclusivos do Pro
5. **CTA mais forte**: "Comecar agora" em vez de apenas "Assinar"

---

## Alteracoes no Arquivo

**Arquivo: `src/pages/Plan.tsx`**

### 1. Atualizar arrays de features

```typescript
const freeFeatures = [
  '1 redação gratuita',
  'Editor completo',
  'Feedback resumido',
];

const basicFeatures = [
  '30 correções por mês',
  'Análise das 5 competências ENEM',
  'Versão melhorada da redação',
  'Histórico de redações',
];

const proFeatures = [
  '60 correções por mês',
  'Tema do dia automático',
  'Contexto e fundamentação',
  'Perguntas norteadoras',
  'Estrutura sugerida',
  'Análise das 5 competências ENEM',
  'Versão melhorada da redação',
  'Histórico de redações',
];
```

### 2. Criar layout de 3 colunas

Remover a logica condicional que mostra apenas upgrade options. Mostrar sempre os 3 planos em grid:

```tsx
{/* Grid de planos */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Card Free */}
  <Card className={isFree ? "border-2 border-primary" : "border"}>
    ...
  </Card>

  {/* Card Basico */}
  <Card className={isBasic ? "border-2 border-primary" : "border"}>
    ...
  </Card>

  {/* Card Pro - Destaque */}
  <Card className={`border-2 ${isPro ? "border-amber-500" : "border-amber-500/50"} bg-amber-50/50 dark:bg-amber-950/10`}>
    <Badge>Recomendado</Badge>
    ...
  </Card>
</div>
```

### 3. Texto persuasivo por plano

- **Free**: "Experimente grátis" / "Plano atual"
- **Basico**: "Para quem quer praticar mais" 
- **Pro**: "Preparação completa para o ENEM"

### 4. Botoes de acao contextuais

| Usuario | Free Card | Basic Card | Pro Card |
|---------|-----------|------------|----------|
| Free    | "Plano atual" (disabled) | "Assinar Básico" | "Assinar Pro" |
| Basic   | — | "Plano atual" (disabled) | "Fazer upgrade" |
| Pro     | — | — | "Plano atual" (disabled) |

### 5. Manter secao de gerenciamento

Usuarios pagantes continuam vendo o botao "Gerenciar assinatura" abaixo do grid.

---

## Arquivo a Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/pages/Plan.tsx` | Editar | Layout 3 colunas, features corretas, elementos persuasivos |

---

## Secao Tecnica

### Responsividade

- Desktop: `grid-cols-3` com cards lado a lado
- Mobile: `grid-cols-1` com Pro no topo (ordem: Pro, Basico, Free ou usar `order` CSS)

### Destaque Visual do Pro

```tsx
<Card className="border-2 border-amber-500 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20 relative">
  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
    <Badge className="bg-amber-500 text-white">
      Recomendado
    </Badge>
  </div>
  ...
</Card>
```

### Indicador de Plano Atual

Cada card mostra um indicador se for o plano do usuario:

```tsx
{planType === 'pro' && (
  <Badge variant="secondary" className="ml-2">Seu plano</Badge>
)}
```

