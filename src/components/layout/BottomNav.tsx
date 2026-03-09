import { CalendarCheck, ListChecks, PenLine, User } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Hoje', path: '/hoje', icon: CalendarCheck },
  { title: 'Objetivas', path: '/objetivas', icon: ListChecks },
  { title: 'Redação', path: '/redacao', icon: PenLine },
  { title: 'Perfil', path: '/perfil', icon: User },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/hoje'}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-4 py-2 text-muted-foreground transition-colors relative'
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
