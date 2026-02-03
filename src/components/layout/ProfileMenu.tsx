import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Key, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const getInitials = (name: string | null, email: string) => {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  return email[0].toUpperCase();
};

export const ProfileMenu = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) return null;

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      toast.success('Email de redefinição de senha enviado!');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Erro ao enviar email de redefinição');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-border hover:ring-primary transition-all">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.name || 'Avatar'} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(profile.name, profile.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.name || 'Usuário'}</p>
            <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/perfil')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Meu Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePasswordReset} className="cursor-pointer">
          <Key className="mr-2 h-4 w-4" />
          <span>Alterar Senha</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
