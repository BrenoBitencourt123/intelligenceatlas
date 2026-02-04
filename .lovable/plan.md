
# Plano: Adicionar Skeleton Loading em Todo o App

## Visao Geral

Vamos adicionar estados de carregamento com Skeleton em todas as paginas principais para melhorar a experiencia do usuario durante o loading inicial.

## Analise do Estado Atual

### Paginas que JA TEM skeleton:
- **Home.tsx**: Skeleton no tema e nos cards de stats
- **Essay.tsx**: Skeleton completo durante loading do tema
- **Plan.tsx**: Skeleton nos indicadores de uso

### Paginas que PRECISAM de skeleton:
- **Profile.tsx**: Mostra apenas Loader2 spinning
- **Login.tsx**: Sem estado de loading inicial
- **Signup.tsx**: Sem estado de loading inicial

### Componentes que podem melhorar:
- **MainLayout**: Adicionar skeleton no TopNav durante loading da auth
- **BottomNav**: Estado de loading

---

## Implementacao

### 1. Profile.tsx - Skeleton Completo

Substituir o Loader2 simples por skeleton cards:

```tsx
if (!user || !profile) {
  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        
        {/* Avatar Section Skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-40 mt-1" />
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </CardContent>
        </Card>

        {/* Personal Info Skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        {/* Plan Skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-16 mb-2" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
```

### 2. Criar Componente ProfileSkeleton

Para manter o codigo organizado, criar um componente separado:

**Arquivo:** `src/components/skeletons/ProfileSkeleton.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const ProfileSkeleton = () => (
  <div className="container max-w-2xl mx-auto px-4 py-8">
    <Skeleton className="h-8 w-32 mb-6" />
    
    <Card className="mb-6">
      <CardHeader>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-40 mt-1" />
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </CardContent>
    </Card>

    <Card className="mb-6">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>

    <Card className="mb-6">
      <CardHeader>
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-6 w-16 mb-2" />
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  </div>
);
```

### 3. HomeSkeleton para Consistencia

**Arquivo:** `src/components/skeletons/HomeSkeleton.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export const HomeSkeleton = () => (
  <div className="container max-w-2xl mx-auto px-4 py-8">
    <div className="space-y-6">
      {/* Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Theme card */}
      <Skeleton className="h-32 rounded-lg" />

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </div>
  </div>
);
```

### 4. EssaySkeleton

**Arquivo:** `src/components/skeletons/EssaySkeleton.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export const EssaySkeleton = () => (
  <div className="min-h-screen bg-background">
    <main className="container max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[62%] space-y-4">
          {/* Pedagogical section */}
          <Skeleton className="h-48 rounded-lg" />
          
          {/* Action buttons */}
          <div className="flex gap-2 py-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-32" />
          </div>
          
          {/* Block cards */}
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
        
        <div className="hidden lg:block lg:w-[38%]">
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    </main>
  </div>
);
```

### 5. PlanSkeleton

**Arquivo:** `src/components/skeletons/PlanSkeleton.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export const PlanSkeleton = () => (
  <div className="container max-w-5xl mx-auto px-4 py-8">
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Skeleton className="h-9 w-64 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[480px] rounded-lg" />
        <Skeleton className="h-[480px] rounded-lg" />
        <Skeleton className="h-[480px] rounded-lg" />
      </div>
    </div>
  </div>
);
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/skeletons/ProfileSkeleton.tsx` | Criar |
| `src/components/skeletons/HomeSkeleton.tsx` | Criar |
| `src/components/skeletons/EssaySkeleton.tsx` | Criar |
| `src/components/skeletons/PlanSkeleton.tsx` | Criar |
| `src/pages/Profile.tsx` | Usar ProfileSkeleton |
| `src/pages/Home.tsx` | Extrair skeleton para componente |
| `src/pages/Essay.tsx` | Extrair skeleton para componente |
| `src/pages/Plan.tsx` | Adicionar skeleton durante check de subscription |

---

## Resultado Esperado

- Loading states amigaveis em todas as paginas
- Componentes skeleton reutilizaveis
- UX consistente durante carregamento
- Nenhum flash de conteudo vazio

---

## Sobre Custos de Infraestrutura

Como mencionei acima, a documentacao publica do Lovable nao especifica valores exatos por usuario. Para calcular seus custos reais:

1. Voce pode ver metricas de uso no painel Cloud do Lovable
2. Os custos de AI (OpenAI) voce ja esta logando na tabela `token_usage`
3. Para uma estimativa precisa, recomendo monitorar por 2-4 semanas com usuarios reais

Se quiser, posso criar uma dashboard para visualizar os custos de tokens que voce ja esta coletando na tabela `token_usage`.
