
# Plano: Avisos de Limite + Historico + Fontes de Dados

## Resumo das Mudancas

1. **Aviso de limite diario/mensal na Home** - Badge e texto explicativo
2. **Tela de Historico de Redacoes** - Nova pagina `/historico`
3. **Botao "Ver historico" no StatsCard** - Link para historico
4. **"Ver correcao" carrega redacao do banco** - Navega para historico com detalhes
5. **Fontes de dados no tema** - Campo `sources` + geracao via IA + gating por plano

---

## 1. Aviso de Limite na Home (DailyThemeCard)

**Arquivo:** `src/components/home/DailyThemeCard.tsx`

Adicionar props para mostrar quando limite foi atingido:

```tsx
interface DailyThemeCardProps {
  title: string;
  hasWrittenToday: boolean;
  quotaReason?: 'limit_reached' | 'monthly_limit' | 'daily_limit' | null;
  dailyLimit?: number;
}

export const DailyThemeCard = ({ 
  title, 
  hasWrittenToday,
  quotaReason,
  dailyLimit = 2,
}: DailyThemeCardProps) => {
  const navigate = useNavigate();
  
  const isBlocked = quotaReason === 'daily_limit' || quotaReason === 'monthly_limit';

  return (
    <Card>
      {/* ... header ... */}
      <CardContent className="space-y-4">
        <h2>"{title}"</h2>
        
        {/* Warning when limit reached */}
        {isBlocked && (
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              {quotaReason === 'daily_limit' 
                ? `Limite de ${dailyLimit} analises por dia atingido. Volte amanha!`
                : 'Limite mensal atingido. Faca upgrade para continuar.'}
            </AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={() => navigate(hasWrittenToday ? '/historico' : '/redacao')} 
          disabled={isBlocked && !hasWrittenToday}
        >
          {hasWrittenToday ? 'Ver correcao' : 'Escrever redacao de hoje'}
        </Button>
      </CardContent>
    </Card>
  );
};
```

**Arquivo:** `src/pages/Home.tsx`

Passar dados de quota:

```tsx
const { reason: quotaReason, dailyLimit } = useQuotaCheck();

<DailyThemeCard 
  title={theme.title} 
  hasWrittenToday={hasWrittenToday}
  quotaReason={quotaReason}
  dailyLimit={dailyLimit}
/>
```

---

## 2. Nova Pagina de Historico

**Novo arquivo:** `src/pages/History.tsx`

```tsx
const History = () => {
  const { user } = useAuth();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch essays from database ordered by created_at desc
    const fetchEssays = async () => {
      const { data } = await supabase
        .from('essays')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setEssays(data || []);
    };
    fetchEssays();
  }, [user]);

  return (
    <MainLayout>
      {/* Left: List of essays with date, theme, score */}
      {/* Right: Selected essay details with blocks, competencies, analysis */}
    </MainLayout>
  );
};
```

**Arquivo:** `src/App.tsx`

Adicionar rota:

```tsx
<Route path="/historico" element={<ProtectedRoute><History /></ProtectedRoute>} />
```

---

## 3. Botao no StatsCard

**Arquivo:** `src/components/home/StatsCard.tsx`

```tsx
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StatsCard = ({ lastScore, monthlyAverage }: StatsCardProps) => {
  const navigate = useNavigate();
  
  return (
    <Card>
      {/* ... existing content ... */}
      <CardContent>
        {/* Stats grid */}
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/historico')}
          className="w-full mt-3"
        >
          <History className="h-4 w-4 mr-2" />
          Ver historico
        </Button>
      </CardContent>
    </Card>
  );
};
```

---

## 4. "Ver correcao" Navega para Historico

Quando `hasWrittenToday` e true, o botao "Ver correcao" navega para `/historico` em vez de `/redacao`:

```tsx
// DailyThemeCard.tsx
<Button onClick={() => navigate(hasWrittenToday ? '/historico' : '/redacao')}>
  {hasWrittenToday ? 'Ver correcao' : 'Escrever redacao de hoje'}
</Button>
```

Opcionalmente, passar query param com a data para pre-selecionar a redacao de hoje:
```tsx
navigate('/historico?date=2026-02-04')
```

---

## 5. Fontes de Dados (Feature Premium)

### 5.1 Migracao de Banco

Adicionar coluna `sources` na tabela `daily_themes`:

```sql
ALTER TABLE daily_themes 
ADD COLUMN sources jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN daily_themes.sources IS 
'Array de fontes: [{title, url, excerpt, type}]';
```

### 5.2 Atualizar Edge Function generate-theme

```tsx
// supabase/functions/generate-theme/index.ts

// Adicionar ao prompt:
const userPrompt = `...
  "sources": [
    {
      "title": "Titulo do artigo/estudo",
      "url": "https://...",
      "excerpt": "Trecho relevante para citacao",
      "type": "artigo|estatistica|legislacao|noticia"
    }
  ]
...`;

// Adicionar ao newTheme:
const newTheme = {
  ...parsedTheme,
  sources: parsedTheme.sources || [],
};
```

### 5.3 Gating por Plano

**Arquivo:** `src/hooks/usePlanFeatures.ts`

```tsx
return {
  ...existing,
  // Fontes de dados: apenas Pro ou add-on especifico
  hasSourcesAccess: isPro,
};
```

### 5.4 UI para Fontes

Criar componente `SourcesCard.tsx` similar ao `ContextCard`:

```tsx
interface Source {
  title: string;
  url: string;
  excerpt: string;
  type: 'artigo' | 'estatistica' | 'legislacao' | 'noticia';
}

export const SourcesCard = ({ sources, isLocked }: Props) => {
  if (isLocked) {
    return <LockedPedagogicalCard ... />;
  }
  
  return (
    <Card>
      <CardHeader>
        <BookOpen className="h-5 w-5" />
        <span>Fontes para sua redacao</span>
      </CardHeader>
      <CardContent>
        {sources.map(source => (
          <div key={source.url}>
            <Badge>{source.type}</Badge>
            <a href={source.url}>{source.title}</a>
            <p>"{source.excerpt}"</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
```

---

## Arquivos a Modificar/Criar

| Arquivo | Acao |
|---------|------|
| `src/components/home/DailyThemeCard.tsx` | Modificar - adicionar avisos de limite |
| `src/pages/Home.tsx` | Modificar - passar quotaReason e dailyLimit |
| `src/components/home/StatsCard.tsx` | Modificar - adicionar botao Ver historico |
| `src/pages/History.tsx` | **CRIAR** - nova pagina de historico |
| `src/App.tsx` | Modificar - adicionar rota /historico |
| `src/types/atlas.ts` | Modificar - adicionar interface Source |
| `src/components/atlas/SourcesCard.tsx` | **CRIAR** - card de fontes |
| `src/components/atlas/PedagogicalSection.tsx` | Modificar - incluir SourcesCard |
| `src/hooks/usePlanFeatures.ts` | Modificar - adicionar hasSourcesAccess |
| `supabase/functions/generate-theme/index.ts` | Modificar - gerar sources |
| **Migracao SQL** | Adicionar coluna sources |

---

## Fluxo Final

```text
Home
 |
 +-- DailyThemeCard
 |     |-- Mostra badge "Concluida" se hasWrittenToday
 |     |-- Mostra aviso de limite se quotaReason != null
 |     +-- Botao "Ver correcao" -> navega para /historico
 |
 +-- StatsCard
       +-- Botao "Ver historico" -> navega para /historico

/historico
 |
 +-- Lista de redacoes (data, tema, nota)
 +-- Detalhes da redacao selecionada
       |-- Blocos com texto
       |-- Competencias com notas
       +-- Versao melhorada (se existir)
```

---

## Monetizacao das Fontes

Sua ideia faz sentido! Sugestao de implementacao:

1. **Custo estimado**: Gerar fontes adiciona ~500 tokens ao prompt = ~$0.0003/tema
2. **Plano atual**: Pro ja inclui fontes (diferencial)
3. **Alternativa**: Criar add-on "Fontes Pro" por $5/mes para usuarios Basic

A logica de gating seria:
```tsx
hasSourcesAccess: isPro || hasSourcesAddon
```

Onde `hasSourcesAddon` seria um campo no profile ou uma subscription separada no Stripe.
