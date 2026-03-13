import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Camera, LogOut, Mail, User, Key, Crown, Loader2, Fingerprint, Trash2, Zap, History } from 'lucide-react';
import { WeeklyScheduleEditor } from '@/components/profile/WeeklyScheduleEditor';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { usePasskey } from '@/hooks/usePasskey';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

const getInitials = (name: string | null, email: string) => {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  return email[0].toUpperCase();
};

interface SecuritySectionProps {
  handlePasswordReset: () => Promise<void>;
  isSendingPasswordReset: boolean;
}

const SecuritySection = ({ handlePasswordReset, isSendingPasswordReset }: SecuritySectionProps) => {
  const { 
    isSupported, 
    isPlatformAvailable, 
    isLoading, 
    credentials, 
    registerPasskey, 
    deletePasskey 
  } = usePasskey();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Key className="h-5 w-5" />
          Segurança
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Password Reset */}
        <div>
          <Button 
            variant="outline" 
            onClick={handlePasswordReset}
            disabled={isSendingPasswordReset}
          >
            {isSendingPasswordReset ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Alterar Senha'
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Enviaremos um email com o link para redefinir sua senha
          </p>
        </div>

        {/* Passkeys / Face ID Section */}
        {isSupported && isPlatformAvailable && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                <span className="font-medium">Face ID / Touch ID</span>
              </div>
              
              {credentials.length > 0 ? (
                <div className="space-y-2">
                  {credentials.map((cred) => (
                    <div 
                      key={cred.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Fingerprint className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{cred.device_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Adicionado em {new Date(cred.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePasskey(cred.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum dispositivo biométrico cadastrado
                </p>
              )}
              
              <Button
                variant="outline"
                onClick={() => registerPasskey()}
                disabled={isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="h-4 w-4" />
                )}
                Adicionar Face ID / Touch ID
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quotaSectionRef = useRef<HTMLDivElement>(null);
  const { isFree } = usePlanFeatures();
  
  const [name, setName] = useState(profile?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [flexibleQuota, setFlexibleQuota] = useState(profile?.flexible_quota ?? false);
  const [isUpdatingQuota, setIsUpdatingQuota] = useState(false);

  // Sync flexibleQuota when profile changes
  useEffect(() => {
    if (profile?.flexible_quota !== undefined) {
      setFlexibleQuota(profile.flexible_quota);
    }
  }, [profile?.flexible_quota]);

  // Scroll to quota section if coming from limit warning
  useEffect(() => {
    if (location.hash === '#quota' && quotaSectionRef.current) {
      setTimeout(() => {
        quotaSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [location.hash]);

  const handleToggleFlexibleQuota = async (checked: boolean) => {
    if (!user) return;
    
    setIsUpdatingQuota(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ flexible_quota: checked })
        .eq('id', user.id);

      if (error) throw error;
      setFlexibleQuota(checked);
      await refreshProfile(); // Refresh profile to sync with context
      toast.success(checked ? 'Modo flexível ativado!' : 'Limite diário ativado!');
    } catch (error) {
      console.error('Error updating flexible quota:', error);
      toast.error('Erro ao atualizar configuração');
    } finally {
      setIsUpdatingQuota(false);
    }
  };

  const handleUpdateName = async () => {
    if (!user) return;
    
    setIsUpdatingName(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Nome atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Erro ao atualizar nome');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache buster
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBuster })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlWithCacheBuster);
      toast.success('Foto atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setIsSendingPasswordReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;
      toast.success('Email de redefinição de senha enviado!');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Erro ao enviar email de redefinição');
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user || !profile) {
    return <ProfileSkeleton />;
  }

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

        {/* Avatar Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Foto de Perfil</CardTitle>
            <CardDescription>Clique na foto para alterar</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative">
              <Avatar 
                className="h-24 w-24 cursor-pointer ring-2 ring-border hover:ring-primary transition-all"
                onClick={handleAvatarClick}
              >
                <AvatarImage src={avatarUrl || undefined} alt={profile.name || 'Avatar'} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(profile.name, profile.email)}
                </AvatarFallback>
              </Avatar>
              <div 
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
                onClick={handleAvatarClick}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="font-medium">{profile.name || 'Sem nome'}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
                <Button 
                  onClick={handleUpdateName} 
                  disabled={isUpdatingName || name === profile.name}
                >
                  {isUpdatingName ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
            </div>
          </CardContent>
        </Card>

        {/* Plan Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Plano Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={profile.plan_type === 'pro' ? 'default' : 'secondary'} className="mb-2">
                  {profile.plan_type === 'pro' ? 'Pro' : profile.plan_type === 'basic' ? 'Básico' : 'Grátis'}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/plano')}>
                {profile.plan_type === 'pro' ? 'Ver Planos' : 'Fazer Upgrade'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Redações */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Redações
            </CardTitle>
            <CardDescription>Veja todas as suas redações corrigidas</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/historico')} className="w-full">
              Ver Histórico
            </Button>
          </CardContent>
        </Card>

        {/* Weekly Schedule Editor */}
        <WeeklyScheduleEditor />

        {/* Quota Settings - Only for paying users */}
        {!isFree && (
          <Card className="mb-6" ref={quotaSectionRef} id="quota">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Modo de Uso
              </CardTitle>
              <CardDescription>
                Por padrão o sistema vem limitado para se tornar um hábito de escrever entre uma a duas redações por dia.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="flexible-quota" className="font-medium">
                    Modo Flexível
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Use todas as correções quando quiser, sem limite diário
                  </p>
                </div>
                <Switch
                  id="flexible-quota"
                  checked={flexibleQuota}
                  onCheckedChange={handleToggleFlexibleQuota}
                  disabled={isUpdatingQuota}
                />
              </div>
              {flexibleQuota && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  ✓ Modo flexível ativo
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Security */}
        <SecuritySection 
          handlePasswordReset={handlePasswordReset}
          isSendingPasswordReset={isSendingPasswordReset}
        />

        <Separator className="my-6" />

        {/* Logout */}
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair da Conta
        </Button>
      </div>
    </MainLayout>
  );
}
