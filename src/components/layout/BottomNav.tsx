import { Home, PenLine, CreditCard, User } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Início', path: '/', icon: Home },
  { title: 'Redação', path: '/redacao', icon: PenLine },
  { title: 'Plano', path: '/plano', icon: CreditCard },
  { title: 'Perfil', path: '/perfil', icon: User },
];

export const BottomNav = () => {
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
      </div>
    </nav>
  );
};
