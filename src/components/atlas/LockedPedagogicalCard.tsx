import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const LockedPedagogicalCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-2 border-amber-500/70 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-amber-700 dark:text-amber-300">
              Gostaria de ter Temas diários?
            </span>
          </div>
          
          <Button 
            onClick={() => navigate('/plano')} 
            size="sm"
            className="gap-2 shrink-0 bg-amber-500 hover:bg-amber-600 text-white"
          >
            Plano Pro
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
