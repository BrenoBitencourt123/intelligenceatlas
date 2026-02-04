import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Calendar, 
  Award, 
  ChevronRight, 
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import type { Block, Competency } from '@/types/atlas';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

interface Essay {
  id: string;
  theme: string;
  blocks: Block[];
  analysis: {
    competencies: Competency[];
    improvedVersion?: string;
  } | null;
  total_score: number | null;
  created_at: string;
  analyzed_at: string | null;
}

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showImproved, setShowImproved] = useState(false);
  const { hasImprovedVersionAccess } = usePlanFeatures();

  useEffect(() => {
    const fetchEssays = async () => {
      if (!user) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from('essays')
        .select('*')
        .eq('user_id', user.id)
        .not('analyzed_at', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching essays:', error);
        setIsLoading(false);
        return;
      }

      const parsedEssays: Essay[] = (data || []).map((essay) => ({
        id: essay.id,
        theme: essay.theme,
        blocks: essay.blocks as unknown as Block[],
        analysis: essay.analysis as unknown as Essay['analysis'],
        total_score: essay.total_score,
        created_at: essay.created_at,
        analyzed_at: essay.analyzed_at,
      }));

      setEssays(parsedEssays);

      // Auto-select essay from query param date
      const dateParam = searchParams.get('date');
      if (dateParam && parsedEssays.length > 0) {
        const essayForDate = parsedEssays.find(
          (e) => e.created_at.split('T')[0] === dateParam
        );
        if (essayForDate) {
          setSelectedEssay(essayForDate);
        } else {
          setSelectedEssay(parsedEssays[0]);
        }
      } else if (parsedEssays.length > 0) {
        setSelectedEssay(parsedEssays[0]);
      }

      setIsLoading(false);
    };

    fetchEssays();
  }, [user, searchParams]);

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 600) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 800) return 'default';
    if (score >= 600) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-96 md:col-span-2" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (essays.length === 0) {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">
                Nenhuma redação analisada
              </h2>
              <p className="text-muted-foreground text-center">
                Você ainda não tem redações analisadas. Escreva sua primeira redação para ver o histórico aqui.
              </p>
              <Button onClick={() => navigate('/redacao')}>
                Escrever redação
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Histórico de Redações</h1>
              <p className="text-muted-foreground">
                {essays.length} {essays.length === 1 ? 'redação analisada' : 'redações analisadas'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Essay list */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Suas Redações</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="space-y-1 p-2">
                    {essays.map((essay) => (
                      <button
                        key={essay.id}
                        onClick={() => {
                          setSelectedEssay(essay);
                          setShowImproved(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedEssay?.id === essay.id
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {essay.theme}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(essay.created_at), "dd 'de' MMM", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                          {essay.total_score !== null && (
                            <Badge variant={getScoreBadgeVariant(essay.total_score)} className="shrink-0">
                              {essay.total_score}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Essay details */}
            <Card className="md:col-span-2">
              {selectedEssay ? (
                <>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <CardTitle className="text-lg leading-tight line-clamp-2">
                          {selectedEssay.theme}
                        </CardTitle>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(parseISO(selectedEssay.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                          {selectedEssay.total_score !== null && (
                            <div className="flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              <span className={`font-semibold ${getScoreColor(selectedEssay.total_score)}`}>
                                {selectedEssay.total_score} pontos
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100vh-400px)]">
                      <div className="space-y-6 pr-4">
                        {/* Version toggle */}
                        {selectedEssay.analysis?.improvedVersion && hasImprovedVersionAccess && (
                          <div className="flex gap-2">
                            <Button
                              variant={!showImproved ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setShowImproved(false)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Original
                            </Button>
                            <Button
                              variant={showImproved ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setShowImproved(true)}
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Versão Melhorada
                            </Button>
                          </div>
                        )}

                        {/* Essay content */}
                        {showImproved && selectedEssay.analysis?.improvedVersion ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="bg-muted/50 rounded-lg p-4">
                              <p className="whitespace-pre-wrap text-foreground">
                                {selectedEssay.analysis.improvedVersion}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {selectedEssay.blocks.map((block) => (
                              <div key={block.id} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-primary" />
                                  <h3 className="font-medium text-foreground">{block.title}</h3>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-4">
                                  <p className="whitespace-pre-wrap text-foreground text-sm">
                                    {block.text || 'Sem conteúdo'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <Separator />

                        {/* Competencies */}
                        {selectedEssay.analysis?.competencies && (
                          <div className="space-y-4">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                              Competências
                            </h3>
                            <div className="grid gap-3">
                              {selectedEssay.analysis.competencies.map((comp) => (
                                <div 
                                  key={comp.id} 
                                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                                >
                                  <div className={`text-lg font-bold shrink-0 w-12 ${getScoreColor(comp.score)}`}>
                                    {comp.score}
                                  </div>
                                  <div className="space-y-1 flex-1">
                                    <p className="font-medium text-foreground text-sm">
                                      {comp.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {comp.description}
                                    </p>
                                    <p className="text-sm text-foreground mt-2">
                                      {comp.explanation}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-96">
                  <p className="text-muted-foreground">Selecione uma redação para ver os detalhes</p>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default History;
