import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface TopicRow {
  id: string;
  area: string;
  topic: string;
  subtopic: string;
  level: number;
  attempts: number;
  correct: number;
  wrong: number;
  dont_know: number;
  priority_score: number;
  last_attempt_at: string | null;
  next_review_at: string | null;
}

export default function ErrorsByTopic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('user_topic_profile')
        .select('id,area,topic,subtopic,level,attempts,correct,wrong,dont_know,priority_score,last_attempt_at,next_review_at')
        .eq('user_id', user.id)
        .order('priority_score', { ascending: false });

      if (error) {
        console.error('Error loading topic errors:', error);
      }

      setRows((data as TopicRow[]) || []);
      setLoading(false);
    };

    load();
  }, [user]);

  const grouped = useMemo(() => {
    const map = new Map<string, TopicRow[]>();
    for (const row of rows) {
      const key = row.area;
      const list = map.get(key) || [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [rows]);

  const formatDate = (value: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('pt-BR');
  };

  const accuracyOf = (row: TopicRow) => {
    if (!row.attempts) return 0;
    return Math.round((row.correct / row.attempts) * 100);
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Erros por topico</h1>
            <p className="text-muted-foreground">Acompanhe prioridades, revisoes e acuracia por competencia.</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : grouped.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhum dado de topico ainda. Resolva algumas objetivas para gerar perfil adaptativo.
            </CardContent>
          </Card>
        ) : (
          grouped.map(([area, list]) => (
            <Card key={area}>
              <CardHeader>
                <CardTitle className="capitalize">{area}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {list.map((row) => (
                  <div key={row.id} className="rounded border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{row.topic}{row.subtopic ? ` > ${row.subtopic}` : ''}</p>
                        <p className="text-xs text-muted-foreground">
                          Tentativas {row.attempts} • Acerto {accuracyOf(row)}% • Nivel N{row.level}
                        </p>
                      </div>
                      <Badge variant="secondary">Prioridade {row.priority_score.toFixed(2)}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-4">
                      <span>Erradas: {row.wrong}</span>
                      <span>Nao sei: {row.dont_know}</span>
                      <span>Ultima pratica: {formatDate(row.last_attempt_at)}</span>
                      <span>Proxima revisao: {formatDate(row.next_review_at)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MainLayout>
  );
}
