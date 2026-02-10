import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useStudyStats } from '@/hooks/useStudyStats';
import { Brain } from 'lucide-react';

const Flashcards = () => {
  const { flashcardsDue } = useStudyStats();

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>

          {flashcardsDue === 0 ? (
            <Card className="bg-card">
              <CardContent className="p-8 text-center space-y-4">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
                <h2 className="text-lg font-semibold">Nenhum flashcard para revisar</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Flashcards são gerados automaticamente quando você erra questões. Continue estudando!
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card">
              <CardContent className="p-8 text-center space-y-4">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
                <h2 className="text-lg font-semibold">{flashcardsDue} flashcards para revisar</h2>
                <p className="text-sm text-muted-foreground">
                  A interface de revisão será implementada na próxima fase.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Flashcards;
