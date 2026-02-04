

# Plano: Corrigir Bugs de UX + Campo de Tema + Free como Pro

## Resumo das Mudancas

1. **Badge "Plano Básico" Hardcoded** → Mostrar plano correto com destaque Pro
2. **"Concluída" incorreto na Home** → Verificar tema + analise completa
3. **Versão Melhorada antiga persistindo** → Limpar estado quando tema mudar
4. **Campo de Tema customizado** → Permitir usuario definir tema proprio
5. **Free = Pro na 1a redacao** → Experiencia completa para degustacao

---

## Implementacao Detalhada

### 1. ThemeCard - Badge Dinamico com Destaque Pro

**Arquivo:** `src/components/atlas/ThemeCard.tsx`

Adicionar prop `planType` e estilizar Pro com cores amber:

```tsx
interface ThemeCardProps {
  title: string;
  motivatingText: string;
  planType?: 'free' | 'basic' | 'pro';
}

export const ThemeCard = ({ title, motivatingText, planType = 'pro' }: ThemeCardProps) => {
  const isPro = planType === 'pro';
  const isBasic = planType === 'basic';
  
  const getBadgeLabel = () => {
    if (isPro) return 'Plano Pro';
    if (isBasic) return 'Plano Básico';
    return 'Plano Free';
  };
  
  return (
    <Card className={cn(
      "border-2",
      isPro ? "border-amber-500/40 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20" 
            : "border-foreground/20"
    )}>
      {/* ... */}
      <Badge 
        variant="secondary" 
        className={cn(
          "text-xs shrink-0",
          isPro && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        )}
      >
        {getBadgeLabel()}
      </Badge>
    </Card>
  );
};
```

### 2. PedagogicalSection - Passar planType

**Arquivo:** `src/components/atlas/PedagogicalSection.tsx`

```tsx
interface PedagogicalSectionProps {
  theme: DailyTheme;
  isLocked?: boolean;
  planType?: 'free' | 'basic' | 'pro';
}

export const PedagogicalSection = ({ theme, isLocked = false, planType = 'pro' }: PedagogicalSectionProps) => {
  // ...
  <ThemeCard 
    title={theme.title} 
    motivatingText={theme.motivatingText} 
    planType={planType}
  />
};
```

### 3. useUserStats - Corrigir hasWrittenToday

**Arquivo:** `src/hooks/useUserStats.ts`

Mudar logica para exigir redacao COM analise e nota > 0:

```tsx
// Antes
const hasWrittenToday = essays?.some(e => {
  const essayDate = new Date(e.created_at);
  return essayDate >= startOfToday;
}) || false;

// Depois
const hasWrittenToday = essays?.some(e => {
  if (!e.analyzed_at || !e.total_score || e.total_score <= 0) return false;
  const analyzedDate = new Date(e.analyzed_at);
  return analyzedDate >= startOfToday;
}) || false;
```

### 4. Essay.tsx - Reset Estado + Campo de Tema

**Arquivo:** `src/pages/Essay.tsx`

Adicionar:
- useEffect para resetar quando tema do dia mudar
- Campo de tema customizado editavel

```tsx
const { theme: dailyTheme, isLoading: isThemeLoading } = useDailyTheme();
const [customTheme, setCustomTheme] = useState('');

// Determinar tema efetivo (customizado ou do dia)
const effectiveTheme = customTheme.trim() || state.theme || dailyTheme?.title || '';

// Reset quando tema do dia mudar (mas nao quando usuario define tema custom)
useEffect(() => {
  if (!dailyTheme?.title) return;
  
  // Se ja tem tema salvo e e diferente do tema do dia (e nao e customizado)
  if (state.theme && state.theme !== dailyTheme.title && !customTheme) {
    resetAll();
  }
}, [dailyTheme?.title]);

// UI: Campo de tema acima dos blocos
<div className="mb-4">
  <label className="text-sm font-medium text-muted-foreground mb-2 block">
    Tema da redacao
  </label>
  <Input
    value={customTheme || state.theme || dailyTheme?.title || ''}
    onChange={(e) => setCustomTheme(e.target.value)}
    placeholder="Digite ou use o tema do dia"
    className="text-base"
  />
  <p className="text-xs text-muted-foreground mt-1">
    Voce pode usar o tema do dia ou digitar seu proprio tema
  </p>
</div>
```

### 5. usePlanFeatures - Free = Pro na 1a Redacao

**Arquivo:** `src/hooks/usePlanFeatures.ts`

Modificar para que usuarios Free tenham acesso completo se ainda nao usaram a cota:

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from './useUserStats';

export const usePlanFeatures = () => {
  const { profile } = useAuth();
  const { totalEssays } = useUserStats();
  const planType = (profile?.plan_type || 'free') as 'free' | 'basic' | 'pro';
  
  const isFree = planType === 'free';
  const isBasic = planType === 'basic';
  const isPro = planType === 'pro';
  
  // Free users get Pro-like experience on their first (and only) essay
  const freeHasQuota = isFree && totalEssays < 1;
  
  return {
    planType,
    isFree,
    isBasic,
    isPro,
    // Tema do dia: Pro OU Free com cota disponivel
    hasThemeAccess: isPro || freeHasQuota,
    // Pedagogico: Pro OU Free com cota disponivel
    hasPedagogicalAccess: isPro || freeHasQuota,
    // Versao melhorada: Basic, Pro, OU Free com cota disponivel
    hasImprovedVersionAccess: isBasic || isPro || freeHasQuota,
    // Limites
    monthlyLimit: isPro ? 60 : isBasic ? 30 : 1,
    dailyLimit: isPro ? 2 : 1,
    // Para UI saber se esta no modo "degustacao Pro"
    isFreeTrial: freeHasQuota,
  };
};
```

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/atlas/ThemeCard.tsx` | Prop planType + estilo Pro |
| `src/components/atlas/PedagogicalSection.tsx` | Passar planType |
| `src/hooks/useUserStats.ts` | Corrigir hasWrittenToday |
| `src/hooks/usePlanFeatures.ts` | Free = Pro na 1a redacao |
| `src/pages/Essay.tsx` | Reset estado + campo tema custom + passar planType |

---

## Resultado Esperado

1. Badge mostra "Plano Pro" com gradiente amber dourado
2. Home so mostra "Concluida" quando existe redacao analisada com nota > 0 hoje
3. Estado da redacao resetado automaticamente quando tema do dia muda
4. Campo de tema permite usuario informar tema customizado (para verificar fuga de tema)
5. Usuarios Free tem experiencia completa Pro na unica redacao gratuita (tema, pedagogico, versao melhorada)
6. Apos usar a cota gratuita, usuario Free ve todo o conteudo bloqueado (incentivo para upgrade)

