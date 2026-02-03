import { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background pt-[env(safe-area-inset-top)] md:pt-0">
      <TopNav />
      <main className="pb-24 md:pb-0" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
