import { useEffect, useState, useMemo } from 'react';
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
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface Question {
  id: string;
  number: number;
  year: number;
  area: string;
  topic: string;
  subtopic: string;
  difficulty: number;
  statement: string;
  alternatives: any;
  correct_answer: string;
  explanation: string | null;
  tags: any;
  image_url: string | null;
  created_at: string;
}

const AREAS = [
  'Linguagens',
  'Ciências Humanas',
  'Ciências da Natureza',
  'Matemática',
];

const PAGE_SIZE = 20;

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

  // Edit modal
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editArea, setEditArea] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editSubtopic, setEditSubtopic] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('2');
  const [editTags, setEditTags] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [saving, setSaving] = useState(false);

  // Available years from data
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [filterArea, filterYear, searchQuery]);

  useEffect(() => {
    fetchQuestions();
  }, [page, filterArea, filterYear, searchQuery]);

  const fetchYears = async () => {
    const { data } = await supabase
      .from('questions')
      .select('year')
      .order('year', { ascending: false });
    if (data) {
      const unique = [...new Set(data.map(q => q.year))];
      setAvailableYears(unique);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    let query = supabase
      .from('questions')
      .select('*', { count: 'exact' })
      .order('year', { ascending: false })
      .order('number', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterArea !== 'all') {
      query = query.eq('area', filterArea);
    }
    if (filterYear !== 'all') {
      query = query.eq('year', parseInt(filterYear));
    }
    if (searchQuery.trim()) {
      query = query.or(`statement.ilike.%${searchQuery}%,number.eq.${parseInt(searchQuery) || 0}`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      toast({ title: 'Erro ao carregar questões', variant: 'destructive' });
    } else {
      setQuestions(data || []);
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
    setEditTags(Array.isArray(q.tags) ? q.tags.join(', ') : '');
    setEditCorrectAnswer(q.correct_answer);
    setEditExplanation(q.explanation || '');
  };

  const handleSave = async () => {
    if (!editingQuestion) return;
    setSaving(true);

    const tagsArray = editTags.split(',').map(t => t.trim()).filter(Boolean);

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

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getAreaBadgeVariant = (area: string) => {
    switch (area) {
      case 'Linguagens': return 'default';
      case 'Ciências Humanas': return 'secondary';
      case 'Ciências da Natureza': return 'outline';
      case 'Matemática': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
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
                {AREAS.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableYears.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                    <TableHead className="w-16">Nº</TableHead>
                    <TableHead className="w-16">Ano</TableHead>
                    <TableHead className="w-40">Área</TableHead>
                    <TableHead className="w-48">Topico</TableHead>
                    <TableHead className="w-16">Dif.</TableHead>
                    <TableHead>Enunciado</TableHead>
                    <TableHead className="w-20">Resp.</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono font-medium">{q.number}</TableCell>
                      <TableCell>{q.year}</TableCell>
                      <TableCell>
                        <Badge variant={getAreaBadgeVariant(q.area) as any} className="text-xs">
                          {q.area}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {q.topic || 'Geral'}{q.subtopic ? ` > ${q.subtopic}` : ''}
                      </TableCell>
                      <TableCell>{q.difficulty || 2}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {q.statement.slice(0, 80)}...
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
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Editar Questão {editingQuestion?.number} ({editingQuestion?.year})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Área</Label>
              <Select value={editArea} onValueChange={setEditArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Topico</Label>
                <Input value={editTopic} onChange={(e) => setEditTopic(e.target.value)} placeholder="Ex: Porcentagem" />
              </div>
              <div>
                <Label>Dificuldade</Label>
                <Select value={editDifficulty} onValueChange={setEditDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Subtopico</Label>
              <Input value={editSubtopic} onChange={(e) => setEditSubtopic(e.target.value)} placeholder="Ex: Aumento e desconto" />
            </div>
            <div>
              <Label>Resposta correta</Label>
              <Select value={editCorrectAnswer} onValueChange={setEditCorrectAnswer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['A', 'B', 'C', 'D', 'E'].map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tags (separadas por vírgula)</Label>
              <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="Biologia, Ecologia" />
            </div>
            <div>
              <Label>Explicação</Label>
              <Textarea value={editExplanation} onChange={(e) => setEditExplanation(e.target.value)} rows={4} />
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
