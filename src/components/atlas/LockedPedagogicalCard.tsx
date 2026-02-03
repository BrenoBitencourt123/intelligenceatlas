import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const LockedPedagogicalCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Gostaria de ter Temas diários?
            </span>
          </div>
          
          <Button 
            onClick={() => navigate('/plano')} 
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
          >
            Plano Pro
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
