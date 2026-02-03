
# Plano: Dados Reais e Funcionais

## Situação Atual

Atualmente, todos os dados exibidos nas telas são **mockados** (fictícios):
- **12/30 redações usadas** → número fixo no código
- **Última nota: 840** → número fixo no código
- **Média do mês: 760** → número fixo no código
- **Próxima renovação: 15 de fevereiro** → texto fixo

O único dado real sendo gravado é o `token_usage` (custo de IA por análise), mas não está vinculado a nenhum usuário.

---

## O que é Necessário para Dados Reais

### 1. Sistema de Autenticação (Obrigatório)
Sem saber quem é o usuário, não é possível rastrear:
- Quantas redações ELE usou
- Quais notas ELE tirou
- Qual plano ELE tem

**Implementação:**
- Tela de login/cadastro
- Verificação de email
- Contexto de autenticação global
- Rotas protegidas (redirecionar para login se não logado)

### 2. Novas Tabelas no Banco de Dados

```text
TABELA: profiles
├── id (UUID, referência ao auth.users)
├── email
├── name
├── plan_type ('basic' | 'pro')
├── plan_started_at (data início do plano)
├── created_at

TABELA: essays (redações)
├── id (UUID)
├── user_id (referência ao profile)
├── theme (tema da redação)
├── blocks (JSON com os blocos de texto)
├── analysis (JSON com resultado da análise)
├── total_score (nota final 0-1000)
├── created_at
├── analyzed_at

TABELA: subscriptions (para uso futuro com Stripe)
├── id
├── user_id
├── plan_type
├── status ('active' | 'cancelled')
├── current_period_start
├── current_period_end
```

### 3. Lógica de Contagem Mensal

Calcular automaticamente:
```text
Redações usadas este mês = COUNT de essays 
                           WHERE user_id = current_user 
                           AND analyzed_at >= início do ciclo
```

O ciclo renova baseado em `plan_started_at` ou `subscription.current_period_start`.

### 4. Cálculo de Estatísticas Reais

- **Última nota**: `SELECT total_score FROM essays WHERE user_id = X ORDER BY created_at DESC LIMIT 1`
- **Média do mês**: `SELECT AVG(total_score) FROM essays WHERE user_id = X AND created_at >= início do mês`

---

## Fluxo Proposto

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         USUÁRIO NÃO LOGADO                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                    TELA DE LOGIN                             │  │
│   │  ┌─────────────────────────────────────────────────────────┐│  │
│   │  │  Email: ____________________                            ││  │
│   │  │  Senha: ____________________                            ││  │
│   │  │                                                         ││  │
│   │  │  [Entrar]                                               ││  │
│   │  │                                                         ││  │
│   │  │  Não tem conta? [Criar conta]                           ││  │
│   │  └─────────────────────────────────────────────────────────┘│  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

                              ↓ Login bem-sucedido

┌─────────────────────────────────────────────────────────────────────┐
│                          USUÁRIO LOGADO                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Dashboard com dados REAIS do banco:                               │
│  • Redações usadas: calculado do banco                             │
│  • Última nota: última redação analisada                           │
│  • Média: média das notas do mês atual                             │
│  • Próxima renovação: calculado pela data de assinatura            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Etapas de Implementação

### Etapa 1: Autenticação
- Criar tabela `profiles` (com trigger para criar automaticamente no signup)
- Criar páginas `/login` e `/cadastro`
- Criar `AuthContext` para gerenciar estado do usuário
- Proteger rotas principais (redirecionar se não logado)

### Etapa 2: Persistência de Redações
- Criar tabela `essays`
- Modificar o fluxo de "Analisar tudo" para salvar no banco
- Vincular cada análise ao `user_id`

### Etapa 3: Dashboard com Dados Reais
- Criar hook `useUserStats()` que busca:
  - Total de redações usadas no ciclo
  - Limite do plano (30 para básico)
  - Última nota
  - Média do mês
  - Data de renovação
- Substituir dados mockados por dados reais

### Etapa 4: Controle de Limite
- Verificar se usuário ainda tem créditos antes de analisar
- Mostrar mensagem "Você atingiu o limite do mês" se acabou
- Sugerir upgrade para Pro

### Etapa 5 (Futuro): Pagamentos com Stripe
- Integrar Stripe para cobrar assinaturas
- Gerenciar upgrades e downgrades
- Webhooks para atualizar status do plano

---

## Detalhes Técnicos

### Estrutura de Arquivos

```text
src/
├── contexts/
│   └── AuthContext.tsx        ← Estado global de autenticação
├── hooks/
│   └── useUserStats.ts        ← Hook para buscar estatísticas
├── pages/
│   ├── Login.tsx              ← Tela de login
│   ├── Signup.tsx             ← Tela de cadastro
│   └── ... (existentes)
├── components/
│   └── ProtectedRoute.tsx     ← Wrapper para rotas protegidas
└── lib/
    └── supabase.ts            ← Helpers para auth/database
```

### Políticas de Segurança (RLS)

```sql
-- Profiles: usuário só vê/edita o próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Essays: usuário só vê/cria as próprias redações
CREATE POLICY "Users can view own essays" ON essays
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own essays" ON essays
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Trigger para Criar Profile

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan_type)
  VALUES (new.id, new.email, 'basic');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## Resumo: O que Precisa ser Feito

| Componente | Status Atual | Necessário |
|------------|--------------|------------|
| Autenticação | Não existe | Implementar login/cadastro |
| Tabela profiles | Não existe | Criar com trigger |
| Tabela essays | Não existe | Criar e vincular análises |
| Dados do dashboard | Mockados | Buscar do banco |
| Limite de uso | Não existe | Validar antes de analisar |
| Pagamentos (Stripe) | Não existe | Implementar futuramente |

A autenticação é o primeiro passo obrigatório - sem ela, não há como saber "quem é o usuário" para vincular os dados.
