import { CalendarCheck, ListChecks, PenLine } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileMenu } from './ProfileMenu';

const navItems = [
  { title: 'Hoje', path: '/', icon: CalendarCheck },
  { title: 'Objetivas', path: '/objetivas', icon: ListChecks },
  { title: 'Redação', path: '/redacao', icon: PenLine },
];

export const TopNav = () => {
  const { user } = useAuth();

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img 
              src="https://storage.googleapis.com/gpt-engineer-file-uploads/f4QJ9UCag0bQmfSQvlHZMs1PDKy2/uploads/1770063094363-favicon.ico" 
              alt="Atlas" 
              className="h-8 w-8 rounded-lg"
            />
            <span className="font-semibold text-foreground">Atlas</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                )}
                activeClassName="bg-muted text-foreground"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>

          {/* User actions */}
          {user && <ProfileMenu />}
        </div>
      </div>
    </header>
  );
};
