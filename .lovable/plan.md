
# Painel Admin para Gerenciamento de Temas

Implementacao de uma interface profissional para cadastrar, editar e gerenciar temas diarios, com acesso restrito exclusivamente ao email **brenobitencourt123@gmail.com**.

---

## Resumo da Implementacao

O sistema sera protegido por verificacao server-side via RLS (Row Level Security), garantindo que apenas o usuario admin possa realizar operacoes de INSERT/UPDATE/DELETE na tabela de temas.

```text
Usuario acessa /admin
        |
        v
+----------------------+
| E admin autorizado?  |
| (verifica user_roles)|
+----------------------+
    |            |
   Sim          Nao
    |            |
    v            v
Mostra painel   Redireciona
com Tabs:       para Home
- Tokens        com toast de
- Temas         erro
```

---

## Etapa 1: Migracao do Banco de Dados

Criar tabela de roles e funcao de verificacao segura.

### 1.1 Criar Enum e Tabela user_roles

```sql
-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver a tabela de roles
CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
  );
```

### 1.2 Criar Funcao has_role (Security Definer)

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### 1.3 Adicionar Politicas RLS na Tabela daily_themes

```sql
-- Admins podem inserir temas
CREATE POLICY "Admins can insert themes" ON public.daily_themes
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins podem atualizar temas
CREATE POLICY "Admins can update themes" ON public.daily_themes
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Admins podem deletar temas
CREATE POLICY "Admins can delete themes" ON public.daily_themes
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
```

### 1.4 Inserir Voce como Admin

Apos a migracao, sera necessario inserir seu usuario como admin. Isso sera feito buscando seu ID na tabela profiles pelo email e inserindo na user_roles.

---

## Etapa 2: Criar Hook useIsAdmin

Verificar server-side se o usuario logado e admin.

**Arquivo:** `src/hooks/useIsAdmin.ts`

**Funcionalidades:**
- Consulta a tabela `user_roles` para verificar se o usuario tem role 'admin'
- Retorna `{ isAdmin, isLoading }`
- Cache para evitar consultas repetidas

---

## Etapa 3: Criar Hook useAdminThemes

Gerenciar operacoes CRUD de temas.

**Arquivo:** `src/hooks/useAdminThemes.ts`

**Funcionalidades:**
- `themes`: Lista de todos os temas cadastrados
- `isLoading`: Estado de carregamento
- `createTheme(data)`: Criar novo tema
- `updateTheme(id, data)`: Atualizar tema existente
- `deleteTheme(id)`: Excluir tema
- Ordenacao por data (mais recentes primeiro)

---

## Etapa 4: Criar Componente ThemeForm

Formulario para criar/editar temas.

**Arquivo:** `src/components/admin/ThemeForm.tsx`

**Campos:**
| Campo | Tipo | Validacao |
|-------|------|-----------|
| Data | DatePicker | Obrigatorio, unico |
| Titulo | Input | Obrigatorio, min 10 chars |
| Texto Motivador | Textarea | Obrigatorio, min 100 chars |
| Contexto | Textarea | Obrigatorio, min 50 chars |
| Perguntas Norteadoras | Array dinamico | Min 3, max 7 perguntas |

**Recursos:**
- Validacao com Zod
- Campos dinamicos para perguntas (adicionar/remover)
- Skeleton de estrutura pre-preenchido
- Botoes Cancelar e Salvar

---

## Etapa 5: Criar Componente ThemesPanel

Lista e gerenciamento de temas.

**Arquivo:** `src/components/admin/ThemesPanel.tsx`

**Interface:**
```text
+----------------------------------------------------------+
|  Temas Cadastrados                    [+ Novo Tema]      |
+----------------------------------------------------------+
|  Data       | Titulo                   | Origem | Acoes  |
+----------------------------------------------------------+
|  03/02/2026 | Violencia contra mulher  | Manual |  X  X  |
|  02/02/2026 | Crise climatica          | IA     |  X  X  |
+----------------------------------------------------------+
```

**Funcionalidades:**
- Tabela com todos os temas ordenados por data
- Badge colorido indicando origem (IA = azul, Manual = verde)
- Botoes de edicao e exclusao
- Modal de confirmacao para exclusao
- Dialog/Sheet para formulario de criacao/edicao

---

## Etapa 6: Atualizar Admin.tsx

Adicionar sistema de abas e protecao de acesso.

**Modificacoes:**
1. Importar `useIsAdmin` para verificar permissao
2. Redirecionar para Home se nao for admin
3. Adicionar `Tabs` com duas abas:
   - "Tokens" (dashboard atual)
   - "Temas" (novo painel)
4. Mover conteudo atual para TabsContent "tokens"
5. Adicionar ThemesPanel em TabsContent "temas"

---

## Estrutura de Arquivos

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| Migration SQL | Criar | user_roles, has_role(), politicas RLS |
| `src/hooks/useIsAdmin.ts` | Criar | Verificar se usuario e admin |
| `src/hooks/useAdminThemes.ts` | Criar | CRUD de temas |
| `src/components/admin/ThemeForm.tsx` | Criar | Formulario de tema |
| `src/components/admin/ThemesPanel.tsx` | Criar | Lista de temas |
| `src/pages/Admin.tsx` | Modificar | Abas + protecao de acesso |

---

## Fluxo de Seguranca

```text
1. Usuario acessa /admin
        |
        v
2. useIsAdmin consulta user_roles
        |
        v
3. RLS verifica se usuario e admin
        |
   +----+----+
   |         |
  Sim       Nao
   |         |
   v         v
4. Mostra   Redireciona
   painel   para /
```

**Camadas de Seguranca:**
1. **Frontend**: Hook `useIsAdmin` esconde UI para nao-admins
2. **Backend (RLS)**: Politicas bloqueiam INSERT/UPDATE/DELETE mesmo se alguem tentar burlar o frontend
3. **Funcao Security Definer**: `has_role()` evita recursao infinita e garante verificacao segura

---

## Ordem de Implementacao

1. Criar migration com tabela `user_roles` e funcao `has_role()`
2. Adicionar politicas RLS para admin na tabela `daily_themes`
3. Criar hook `useIsAdmin`
4. Criar hook `useAdminThemes`
5. Criar componente `ThemeForm`
6. Criar componente `ThemesPanel`
7. Atualizar `Admin.tsx` com abas e protecao
8. Inserir seu usuario como admin (manual via SQL)

---

## Como Tornar seu Usuario Admin

Apos a implementacao, sera necessario rodar este comando SQL para adicionar seu usuario como admin:

```sql
-- Buscar seu user_id pelo email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'brenobitencourt123@gmail.com';
```

Voce pode executar isso via Lovable Cloud > Run SQL.

---

## Beneficios da Abordagem

1. **Seguranca Maxima**: Verificacao server-side via RLS, impossivel burlar pelo frontend
2. **Acesso Exclusivo**: Apenas seu email tera acesso ao painel admin
3. **Escalavel**: Facil adicionar novos admins no futuro (basta INSERT na user_roles)
4. **UX Profissional**: Interface integrada com abas e formulario validado
5. **Rastreabilidade**: Campo `is_ai_generated` diferencia temas manuais de IA
