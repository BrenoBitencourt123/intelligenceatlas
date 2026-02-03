import { Home, PenLine, CreditCard, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { title: 'Início', path: '/', icon: Home },
  { title: 'Redação', path: '/redacao', icon: PenLine },
  { title: 'Plano', path: '/plano', icon: CreditCard },
];

export const BottomNav = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-4 py-2 text-muted-foreground transition-colors'
            )}
            activeClassName="text-foreground"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.title}</span>
          </NavLink>
        ))}
        {user && (
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-xs font-medium">Sair</span>
          </button>
        )}
      </div>
    </nav>
  );
};
