import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface LockedOverlayProps {
  children: React.ReactNode;
}

export const LockedOverlay = ({ children }: LockedOverlayProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 rounded-lg">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        
        <p className="text-muted-foreground text-sm text-center leading-relaxed max-w-sm mb-4">
          Este recurso está disponível no Plano Pro, que oferece tema diário e orientação completa para a redação.
        </p>
        
        <Button 
          onClick={() => navigate('/plano')} 
          variant="outline"
          size="sm"
          className="gap-2"
        >
          Ver Plano Pro
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
