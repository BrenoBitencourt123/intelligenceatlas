
# Plano: Controle de Exibicao por Plano (Basico vs Pro)

## Visao Geral

Implementar logica de gating baseada no plano do usuario (`profile.plan_type`) para exibir ou bloquear conteudos exclusivos do Plano Pro, mantendo todo o layout existente inalterado.

## Regras de Negocio

```text
+------------------+-------------------------+-------------------------+
| Recurso          | Plano Basico           | Plano Pro               |
+------------------+-------------------------+-------------------------+
| Correcoes/mes    | 30 (1 por dia)         | Ate 2 por dia           |
| Tema do dia      | BLOQUEADO              | Liberado                |
| Contexto         | BLOQUEADO              | Liberado                |
| Perguntas        | BLOQUEADO              | Liberado                |
| Estrutura        | BLOQUEADO              | Liberado                |
| Editor blocos    | Funciona normalmente   | Funciona normalmente    |
| Correcao AI      | Funciona normalmente   | Funciona normalmente    |
| Versao melhorada | Funciona normalmente   | Funciona normalmente    |
+------------------+-------------------------+-------------------------+
```

## Mudancas na Tela Inicio (Home.tsx)

### Plano Pro
Manter comportamento atual: exibir `DailyThemeCard` com tema e botao "Escrever redacao de hoje".

### Plano Basico
Substituir `DailyThemeCard` por um card bloqueado:
- Icone de cadeado
- Texto: "O Tema do Dia e um beneficio exclusivo do Plano Pro"
- Botao: "Ver Plano Pro" (navega para /plano)

### Implementacao

Criar componente `LockedThemeCard` para a versao bloqueada e usar condicional baseada em `profile?.plan_type`.

## Mudancas na Tela Redacao (Essay.tsx)

### Plano Pro
Manter comportamento atual: exibir `PedagogicalSection` com todos os cards visiveis.

### Plano Basico
Renderizar todos os cards com overlay de bloqueio:
- Blur leve no conteudo (`blur-sm`)
- Overlay semi-transparente
- Icone de cadeado centralizado
- Texto explicativo
- Sem interacao (pointer-events-none)

### Implementacao

Criar componente wrapper `LockedOverlay` que envolve qualquer conteudo e aplica o efeito de bloqueio.

Modificar `PedagogicalSection` para receber prop `isLocked` e aplicar bloqueio nos 4 cards.

## Arquivos a Criar

### 1. src/components/home/LockedThemeCard.tsx

Card que substitui o tema do dia para usuarios do Plano Basico:

```typescript
// Estrutura:
// - Card com borda pontilhada
// - Icone Lock grande centralizado
// - Titulo "Tema do Dia"
// - Texto explicativo do beneficio Pro
// - Botao "Ver Plano Pro" -> /plano
```

### 2. src/components/atlas/LockedOverlay.tsx

Componente wrapper que aplica efeito de bloqueio:

```typescript
// Props: children, title (opcional)
// Estrutura:
// - Container relativo
// - Children com classe blur-sm e pointer-events-none
// - Overlay absoluto com:
//   - Background semi-transparente
//   - Icone Lock
//   - Texto sobre Plano Pro
//   - Link para /plano
```

## Arquivos a Modificar

### 1. src/pages/Home.tsx

Adicionar logica condicional:

```typescript
const { profile } = useAuth();
const isPro = profile?.plan_type === 'pro';

// No render:
{isPro ? (
  <DailyThemeCard title={theme.title} hasWrittenToday={hasWrittenToday} />
) : (
  <LockedThemeCard />
)}
```

### 2. src/components/atlas/PedagogicalSection.tsx

Adicionar prop `isLocked` e wrapper condicional:

```typescript
interface PedagogicalSectionProps {
  theme: DailyTheme;
  isLocked?: boolean;
}

export const PedagogicalSection = ({ theme, isLocked = false }: PedagogicalSectionProps) => {
  if (isLocked) {
    return (
      <LockedOverlay>
        <div className="space-y-4">
          <ThemeCard title={theme.title} motivatingText={theme.motivatingText} />
          <ContextCard context={theme.context} />
          <GuidingQuestionsCard questions={theme.guidingQuestions} />
          <StructureGuideCard structureGuide={theme.structureGuide} />
        </div>
      </LockedOverlay>
    );
  }
  
  return (
    <div className="space-y-4">
      <ThemeCard ... />
      <ContextCard ... />
      <GuidingQuestionsCard ... />
      <StructureGuideCard ... />
    </div>
  );
};
```

### 3. src/pages/Essay.tsx

Passar prop `isLocked` para `PedagogicalSection`:

```typescript
const { profile } = useAuth();
const isPro = profile?.plan_type === 'pro';

// No render:
<PedagogicalSection theme={theme} isLocked={!isPro} />
```

## Design Visual do Bloqueio

### Card Bloqueado na Home

```text
+----------------------------------------+
|  [  ]  [  ]  [  ]  [  ]  (borda tracejada)
|                                        |
|              [CADEADO]                 |
|                                        |
|          TEMA DO DIA                   |
|                                        |
|  O Tema do Dia e um beneficio          |
|  exclusivo do Plano Pro, que oferece   |
|  tema diario e orientacao completa.    |
|                                        |
|       [ Ver Plano Pro ]                |
|                                        |
+----------------------------------------+
```

### Overlay na Tela Redacao

```text
+----------------------------------------+
|  Tema do Dia (blur)                    |
|  Contexto (blur)            [CADEADO]  |
|  Perguntas (blur)                      |
|  Estrutura (blur)    Recurso exclusivo |
|                      do Plano Pro      |
|                      [ Ver plano ]     |
+----------------------------------------+
```

## Fluxo de Usuario

### Usuario Basico
1. Acessa Home -> Ve card bloqueado com CTA para Plano Pro
2. Acessa Redacao -> Ve secao pedagogica bloqueada, mas pode usar editor normalmente
3. Pode colar tema manualmente e usar correcao

### Usuario Pro
1. Acessa Home -> Ve tema do dia normalmente
2. Acessa Redacao -> Ve toda orientacao pedagogica
3. Experiencia completa

## Detalhes Tecnicos

### Hook Reutilizavel (Opcional)

Criar hook `usePlanFeatures` para centralizar logica:

```typescript
export const usePlanFeatures = () => {
  const { profile } = useAuth();
  const isPro = profile?.plan_type === 'pro';
  
  return {
    isPro,
    hasThemeAccess: isPro,
    hasPedagogicalAccess: isPro,
    monthlyLimit: isPro ? 60 : 30,
    dailyLimit: isPro ? 2 : 1,
  };
};
```

### Consideracoes

- Nao alterar editor de blocos (funciona igual para todos)
- Nao alterar correcao AI (funciona igual para todos)
- Nao alterar versao melhorada (funciona igual para todos)
- Manter tema disponivel via contexto mesmo bloqueado (para usuario colar manualmente)

## Resumo de Mudancas

| Arquivo | Acao |
|---------|------|
| `src/components/home/LockedThemeCard.tsx` | Criar |
| `src/components/atlas/LockedOverlay.tsx` | Criar |
| `src/hooks/usePlanFeatures.ts` | Criar (opcional) |
| `src/pages/Home.tsx` | Modificar |
| `src/pages/Essay.tsx` | Modificar |
| `src/components/atlas/PedagogicalSection.tsx` | Modificar |

## Resultado Esperado

- Interface simples e educacional
- Usuario Basico entende o valor do Pro
- Fluxo de redacao preservado para ambos os planos
- Incentivo natural para upgrade sem fricao
