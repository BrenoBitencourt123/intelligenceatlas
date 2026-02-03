import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      toast.error('Erro ao criar conta', {
        description: error.message,
      });
      setLoading(false);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Verifique seu email</CardTitle>
            <CardDescription className="text-base">
              Enviamos um link de confirmação para <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>Clique no link enviado para ativar sua conta e começar a usar o Atlas.</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Voltar para o login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/1770063094363-favicon.ico" 
              alt="Atlas Logo" 
              className="h-12 w-12"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
          <CardDescription>
            Comece sua jornada rumo ao 1000 no ENEM
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Já tem conta?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Fazer login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
