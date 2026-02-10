import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStudySchedule } from '@/hooks/useStudySchedule';
import { useStudyStats } from '@/hooks/useStudyStats';
import { ArrowRight, ListChecks, Upload } from 'lucide-react';

const Objectives = () => {
  const navigate = useNavigate();
  const schedule = useStudySchedule();
  const { totalQuestions } = useStudyStats();

  if (totalQuestions === 0) {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Questões Objetivas</h1>
            <Card className="bg-card">
              <CardContent className="p-8 text-center space-y-4">
                <ListChecks className="h-12 w-12 mx-auto text-muted-foreground" />
                <h2 className="text-lg font-semibold">Nenhuma questão importada</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Importe provas do ENEM para começar a estudar com questões objetivas organizadas por área.
                </p>
                <Button onClick={() => navigate('/importar')} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Importar Questões
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Questões Objetivas</h1>
          
          <Card className="border-2 border-primary/20 bg-card">
            <CardContent className="p-6 space-y-3">
              <h2 className="text-lg font-semibold">Área do dia: {schedule.label}</h2>
              <p className="text-sm text-muted-foreground">
                {schedule.questionCount} questões divididas em 3 blocos
              </p>
              <Button className="w-full gap-2">
                Iniciar Sessão
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/importar')}>
            <Upload className="h-4 w-4" />
            Importar mais questões
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Objectives;
