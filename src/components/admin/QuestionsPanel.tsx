import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight, Eye, AlertTriangle, RefreshCw, Loader2, ImageOff, Wand2 } from 'lucide-react';
import { DISCIPLINAS, getDisciplinasForArea } from '@/taxonomy/taxonomy';
import type { QuestionImage } from '@/lib/questionImages';
import type { Json } from '@/integrations/supabase/types';

interface Question {
  id: string;
  number: number;
  year: number;
  area: string;
  topic: string;
  subtopic: string;
  difficulty: number;
  statement: string;
  alternatives: unknown;
  correct_answer: string;
  explanation: string | null;
  tags: unknown;
  image_url: string | null;
  images: QuestionImage[];
  created_at: string;
  // Taxonomy v2
  disciplina: string | null;
  topics: string[] | null;
  cognitive_level: string | null;
  confidence: number | null;
  needs_review: boolean | null;
  classifier_version: string | null;
  classified_at: string | null;
}

const AREA_VALUES: Record<string, string> = {
  linguagens: 'Linguagens',
  humanas: 'Ciências Humanas',
  natureza: 'Ciências da Natureza',
  matematica: 'Matemática',
};

const COGNITIVE_LEVELS = [
  { value: 'recordacao', label: 'Recordação' },
  { value: 'compreensao', label: 'Compreensão' },
  { value: 'aplicacao', label: 'Aplicação' },
  { value: 'analise', label: 'Análise' },
];

const PAGE_SIZE = 20;

function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (confidence == null) return <span className="text-xs text-muted-foreground">—</span>;
  const pct = Math.round(confidence * 100);
  const variant = confidence >= 0.85 ? 'outline' : confidence >= 0.75 ? 'secondary' : 'destructive';
  return (
    <Badge variant={variant as any} className="text-xs font-mono">
      {pct}%
    </Badge>
  );
}

const QuestionsPanel = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);
  const [filterHasImages, setFilterHasImages] = useState(false);

  // Edit modal
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editArea, setEditArea] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editSubtopic, setEditSubtopic] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('2');
  const [editTags, setEditTags] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [editDisciplina, setEditDisciplina] = useState('');
  const [editCognitiveLevel, setEditCognitiveLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [editImages, setEditImages] = useState<QuestionImage[]>([]);

  // Reclassify
  const [reclassifying, setReclassifying] = useState(false);

  // Reformat
  const [reformatting, setReformatting] = useState(false);
  const [reformatProgress, setReformatProgress] = useState('');

  // Available years from data
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => { fetchYears(); }, []);

  useEffect(() => { setPage(0); }, [filterArea, filterYear, searchQuery, filterNeedsReview, filterHasImages]);

  useEffect(() => { fetchQuestions(); }, [page, filterArea, filterYear, searchQuery, filterNeedsReview, filterHasImages]);

  const fetchYears = async () => {
    const { data } = await supabase.from('questions').select('year').order('year', { ascending: false });
    if (data) setAvailableYears([...new Set(data.map((q) => q.year))]);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    let query = supabase
      .from('questions')
      .select('*', { count: 'exact' })
      .order('year', { ascending: false })
      .order('number', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterArea !== 'all') query = query.eq('area', filterArea);
    if (filterYear !== 'all') query = query.eq('year', parseInt(filterYear));
    if (filterNeedsReview) query = query.eq('needs_review', true);
    if (filterHasImages) query = query.neq('images', '[]');
    if (searchQuery.trim()) {
      query = query.or(`statement.ilike.%${searchQuery}%,number.eq.${parseInt(searchQuery) || 0}`);
    }

    const { data, error, count } = await query;
    if (error) {
      toast({ title: 'Erro ao carregar questões', variant: 'destructive' });
    } else {
      setQuestions((data as unknown as Question[]) || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const openEdit = (q: Question) => {
    setEditingQuestion(q);
    setEditArea(q.area);
    setEditTopic(q.topic || 'Geral');
    setEditSubtopic(q.subtopic || '');
    setEditDifficulty(String(q.difficulty || 2));
    setEditTags(Array.isArray(q.tags) ? (q.tags as string[]).join(', ') : '');
    setEditCorrectAnswer(q.correct_answer);
    setEditExplanation(q.explanation || '');
    setEditDisciplina(q.disciplina || '');
    setEditCognitiveLevel(q.cognitive_level || '');
    setEditImages((q.images as unknown as QuestionImage[]) ?? []);
  };

  const handleSave = async () => {
    if (!editingQuestion) return;
    setSaving(true);
    const tagsArray = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    const { error } = await supabase
      .from('questions')
      .update({
        area: editArea,
        topic: editTopic || 'Geral',
        subtopic: editSubtopic || '',
        difficulty: parseInt(editDifficulty, 10) || 2,
        tags: tagsArray,
        correct_answer: editCorrectAnswer,
        explanation: editExplanation || null,
        disciplina: editDisciplina || null,
        cognitive_level: editCognitiveLevel || null,
        images: editImages as unknown as Json,
        // Manual edit clears needs_review
        needs_review: false,
      })
      .eq('id', editingQuestion.id);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Questão atualizada!' });
      setEditingQuestion(null);
      fetchQuestions();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta questão?')) return;
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Questão excluída' });
      fetchQuestions();
    }
  };

  const handleReclassify = async (mode: 'unclassified' | 'needs_review') => {
    setReclassifying(true);
    try {
      const body = mode === 'unclassified' ? { unclassified: true } : { needs_review: true };
      const { data, error } = await supabase.functions.invoke('reclassify-questions', { body });
      if (error) throw error;
      toast({
        title: 'Reclassificação concluída',
        description: `${data?.processed ?? 0} questões processadas. Erros: ${data?.errors?.length ?? 0}.`,
      });
      fetchQuestions();
    } catch (err: any) {
      toast({ title: 'Erro na reclassificação', description: err.message, variant: 'destructive' });
    } finally {
      setReclassifying(false);
    }
  };

  const handleReformat = async () => {
    setReformatting(true);
    setReformatProgress('Iniciando reformatação...');
    let totalProcessed = 0;
    let totalErrors = 0;
    let hasMore = true;

    try {
      while (hasMore) {
        const { data, error } = await supabase.functions.invoke('reformat-statements', {
          body: { batch_size: 10 },
        });
        if (error) throw error;

        totalProcessed += data.successful ?? 0;
        totalErrors += (data.errors?.length ?? 0);
        const remaining = data.remaining ?? 0;

        setReformatProgress(`${totalProcessed} reformatadas, ${remaining} restantes...`);

        if (remaining <= 0 || (data.successful ?? 0) === 0) {
          hasMore = false;
        }
      }

      toast({
        title: 'Reformatação concluída',
        description: `${totalProcessed} questões reformatadas. Erros: ${totalErrors}.`,
      });
      fetchQuestions();
    } catch (err: any) {
      toast({ title: 'Erro na reformatação', description: err.message, variant: 'destructive' });
    } finally {
      setReformatting(false);
      setReformatProgress('');
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Disciplinas for edit dialog (based on editArea)
  const editAreaKey = Object.entries(AREA_VALUES).find(([, v]) => v === editArea)?.[0] ?? editArea;
  const editDisciplinas = getDisciplinasForArea(editAreaKey);

  return (
    <div className="space-y-4">
      {/* Reclassify actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Classificação automática
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={reclassifying}
            onClick={() => handleReclassify('unclassified')}
          >
            {reclassifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Classificar sem classificação
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={reclassifying}
            onClick={() => handleReclassify('needs_review')}
          >
            {reclassifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
            Reclassificar needs_review
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={reformatting}
            onClick={handleReformat}
          >
            {reformatting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
            {reformatting ? reformatProgress : 'Reformatar enunciados (IA)'}
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nº ou enunciado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                {Object.entries(AREA_VALUES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={filterNeedsReview ? 'destructive' : 'outline'}
              size="sm"
              className="shrink-0"
              onClick={() => setFilterNeedsReview((v) => !v)}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Needs review
            </Button>
            <Button
              variant={filterHasImages ? 'default' : 'outline'}
              size="sm"
              className="shrink-0"
              onClick={() => setFilterHasImages((v) => !v)}
            >
              🖼️ Com imagens
            </Button>
          </div>
          {filterHasImages && questions.length > 0 && (
            <div className="mt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  const ids = questions.map(q => q.id);
                  const { error } = await supabase
                    .from('questions')
                    .update({ images: [] as unknown as Json })
                    .in('id', ids);
                  if (error) {
                    toast({ title: 'Erro ao limpar imagens', description: error.message, variant: 'destructive' });
                  } else {
                    toast({ title: `Imagens removidas de ${ids.length} questões` });
                    fetchQuestions();
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remover imagens da página ({questions.length} questões)
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {totalCount} questão(ões) encontrada(s)
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : questions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma questão encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Nº</TableHead>
                    <TableHead className="w-14">Ano</TableHead>
                    <TableHead className="w-32">Área</TableHead>
                    <TableHead className="w-28">Disciplina</TableHead>
                    <TableHead className="w-40">Tópico</TableHead>
                    <TableHead className="w-12">Dif.</TableHead>
                    <TableHead className="w-16">Conf.</TableHead>
                    <TableHead>Enunciado</TableHead>
                    <TableHead className="w-16">Resp.</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((q) => (
                    <TableRow key={q.id} className={q.needs_review ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}>
                      <TableCell className="font-mono font-medium text-xs">
                        <span className="flex items-center gap-1">
                          {q.needs_review && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                          {q.number}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{q.year}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {AREA_VALUES[q.area] ?? q.area}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {q.disciplina ?? <span className="italic opacity-50">—</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {q.topic || 'Geral'}{q.subtopic ? ` › ${q.subtopic}` : ''}
                      </TableCell>
                      <TableCell className="text-center">{q.difficulty || 2}</TableCell>
                      <TableCell>
                        <ConfidenceBadge confidence={q.confidence ?? null} />
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {q.statement.slice(0, 70)}…
                      </TableCell>
                      <TableCell className="font-mono font-medium">{q.correct_answer}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Visualizar em Objetivas"
                            onClick={() => navigate(`/objetivas?previewQuestionId=${q.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Questão {editingQuestion?.number} ({editingQuestion?.year})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Área</Label>
                <Select value={editArea} onValueChange={(v) => { setEditArea(v); setEditDisciplina(''); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AREA_VALUES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Disciplina</Label>
                <Select value={editDisciplina} onValueChange={setEditDisciplina}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {editDisciplinas.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Tópico (free text)</Label>
                <Input value={editTopic} onChange={(e) => setEditTopic(e.target.value)} placeholder="Ex: Porcentagem" />
              </div>
              <div>
                <Label>Dificuldade</Label>
                <Select value={editDifficulty} onValueChange={setEditDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Fácil</SelectItem>
                    <SelectItem value="2">2 — Médio</SelectItem>
                    <SelectItem value="3">3 — Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Subtópico</Label>
              <Input value={editSubtopic} onChange={(e) => setEditSubtopic(e.target.value)} placeholder="Ex: Aumento e desconto" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Resposta correta</Label>
                <Select value={editCorrectAnswer} onValueChange={setEditCorrectAnswer}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D', 'E'].map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nível cognitivo</Label>
                <Select value={editCognitiveLevel} onValueChange={setEditCognitiveLevel}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {COGNITIVE_LEVELS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tags (separadas por vírgula)</Label>
              <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="Biologia, Ecologia" />
            </div>
            <div>
              <Label>Explicação</Label>
              <Textarea value={editExplanation} onChange={(e) => setEditExplanation(e.target.value)} rows={4} />
            </div>

            {/* Images management */}
            <div>
              <Label className="flex items-center gap-2">
                Imagens ({editImages.length})
                {editImages.length > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => setEditImages([])}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remover todas
                  </Button>
                )}
              </Label>
              {editImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {editImages.map((img, i) => (
                    <div key={`${img.url}-${i}`} className="relative rounded-md overflow-hidden border bg-muted/20">
                      <img
                        src={`${img.url}${img.url.includes('?') ? '&' : '?'}t=${Date.now()}`}
                        alt={`Imagem ${i + 1}`}
                        className="h-20 w-full object-cover"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 rounded-full bg-destructive text-destructive-foreground p-0.5"
                        onClick={() => setEditImages(prev => prev.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ImageOff className="h-3.5 w-3.5" /> Nenhuma imagem associada
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuestion(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionsPanel;
