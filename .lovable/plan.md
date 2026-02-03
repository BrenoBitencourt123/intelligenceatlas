
# Plano: Substituir Logout por Menu de Perfil

## Visao Geral

Transformar o botao "Sair" atual em um menu de perfil com avatar do usuario. Ao clicar, abre um dropdown (desktop) ou navega para uma pagina de perfil (mobile) onde o usuario pode gerenciar suas informacoes.

## Funcionalidades do Perfil

1. **Avatar** - Exibicao de foto (com fallback para iniciais do nome/email)
2. **Informacoes basicas** - Nome, email, plano atual
3. **Alterar senha** - Via Supabase Auth
4. **Upload de foto** - Armazenamento no Storage
5. **Sair** - Botao de logout dentro do menu/pagina

## Arquitetura

```text
+------------------+     +------------------+     +------------------+
|    TopNav.tsx    |     |   BottomNav.tsx  |     |   Profile.tsx    |
|   (Desktop)      |     |    (Mobile)      |     |    (Pagina)      |
+------------------+     +------------------+     +------------------+
         |                        |                        |
         v                        v                        v
  DropdownMenu              NavLink para            Formulario com:
  com opcoes:               /perfil                 - Foto upload
  - Ver Perfil                                      - Nome
  - Alterar Senha                                   - Email (readonly)
  - Sair                                            - Alterar senha
                                                    - Sair
```

## Mudancas no Banco de Dados

Adicionar coluna `avatar_url` na tabela `profiles`:

```sql
ALTER TABLE public.profiles 
ADD COLUMN avatar_url TEXT;
```

Criar bucket de storage para avatares (se nao existir):

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Politica para usuarios fazerem upload do proprio avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## Arquivos a Criar/Modificar

### 1. Nova pagina de Perfil (`src/pages/Profile.tsx`)

Pagina completa com:
- Avatar com opcao de upload
- Campo para editar nome
- Email (somente leitura)
- Botao para alterar senha (envia email de reset)
- Informacoes do plano atual
- Botao de sair

### 2. Componente ProfileMenu (`src/components/layout/ProfileMenu.tsx`)

Dropdown para desktop com:
- Avatar pequeno como trigger
- Opcoes: "Meu Perfil", "Alterar Senha", separador, "Sair"

### 3. Atualizar TopNav (`src/components/layout/TopNav.tsx`)

Substituir botao de logout pelo componente ProfileMenu

### 4. Atualizar BottomNav (`src/components/layout/BottomNav.tsx`)

Substituir botao de logout por link para /perfil com icone de usuario

### 5. Atualizar rotas (`src/App.tsx`)

Adicionar rota protegida para /perfil

### 6. Atualizar AuthContext (`src/contexts/AuthContext.tsx`)

Incluir `avatar_url` no tipo Profile e funcao para atualizar perfil

## Detalhes Tecnicos

### Upload de Avatar

1. Usuario seleciona imagem
2. Redimensionar no cliente (max 200x200px)
3. Upload para Storage bucket `avatars/{user_id}/avatar.jpg`
4. Atualizar `profiles.avatar_url` com URL publica

### Alteracao de Senha

Usar `supabase.auth.resetPasswordForEmail()` para enviar email de reset:

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
});
```

### Fallback do Avatar

Quando nao houver foto, exibir iniciais:

```typescript
const getInitials = (name: string | null, email: string) => {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  return email[0].toUpperCase();
};
```

## Fluxo do Usuario

1. **Desktop**: Clica no avatar no canto direito -> Dropdown abre -> Escolhe opcao
2. **Mobile**: Clica no icone de perfil na barra inferior -> Vai para pagina /perfil
3. **Alterar senha**: Clica no botao -> Recebe email -> Segue link para resetar

## Resultado Esperado

- Menu de navegacao mais limpo e profissional
- Usuario pode personalizar seu perfil com foto
- Opcao de alterar senha acessivel
- Experiencia consistente entre desktop e mobile
