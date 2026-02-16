import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, FileText, ArrowLeft, ArrowRight, Check, Loader2, AlertCircle, X, Pencil, ImagePlus, Trash2 } from 'lucide-react';
import { useImportExam, ImportedQuestion, DayUpload } from '@/hooks/useImportExam';

const AREA_LABELS: Record<string, string> = {
  linguagens: 'Linguagens',
  humanas: 'Humanas',
  natureza: 'Natureza',
  matematica: 'Matematica',
};

const AREA_COLORS: Record<string, string> = {
  linguagens: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  humanas: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  natureza: 'bg-green-500/10 text-green-700 dark:text-green-300',
  matematica: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
};

function PdfDropZone({
  file,
  onFile,
  label,
  sublabel,
}: {
  file: File | null;
  onFile: (f: File) => void;
  label: string;
  sublabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f?.type === 'application/pdf') onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
    >
      {file ? (
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="text-left min-w-0">
            <p className="font-medium text-xs truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        </div>
      ) : (
        <>
          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground/60">{sublabel}</p>}
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

function DayRow({
  dayNum,
  upload,
  onChange,
}: {
  dayNum: number;
  upload: DayUpload;
  onChange: (u: DayUpload) => void;
}) {
  const dayLabel = dayNum === 1 ? 'Linguagens + Humanas' : 'Natureza + Matematica';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Dia {dayNum}
          <span className="text-xs font-normal text-muted-foreground">- {dayLabel}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <PdfDropZone
            file={upload.examFile}
            onFile={f => onChange({ ...upload, examFile: f })}
            label="Prova"
            sublabel="PDF da prova"
          />
          <PdfDropZone
            file={upload.gabaritoFile}
            onFile={f => onChange({ ...upload, gabaritoFile: f })}
            label="Gabarito"
            sublabel="PDF do gabarito"
          />
        </div>
        {upload.examFile && !upload.gabaritoFile && (
          <p className="text-xs text-muted-foreground mt-2">
            Sem gabarito? As questoes serao importadas sem resposta correta.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function UploadStage({
  onProcess,
  onProcessJson,
  loading,
  loadingMessage,
  progress,
}: {
  onProcess: (days: DayUpload[]) => void;
  onProcessJson: (jsonText: string) => void;
  loading: boolean;
  loadingMessage: string;
  progress: number;
}) {
  const [day1, setDay1] = useState<DayUpload>({ examFile: null, gabaritoFile: null, gabaritoText: '', day: 1 });
  const [day2, setDay2] = useState<DayUpload>({ examFile: null, gabaritoFile: null, gabaritoText: '', day: 2 });
  const [jsonInput, setJsonInput] = useState('');

  const hasAnyFile = day1.examFile || day2.examFile;

  const handleSubmit = () => {
    const days = [day1, day2].filter(d => d.examFile);
    onProcess(days);
  };

  return (
    <div className="space-y-4">
      <DayRow dayNum={1} upload={day1} onChange={setDay1} />
      <DayRow dayNum={2} upload={day2} onChange={setDay2} />

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={!hasAnyFile || loading}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <div className="text-left">
              <p className="text-sm">{loadingMessage || 'Processando...'}</p>
              {progress > 0 && <p className="text-xs opacity-70">{progress}%</p>}
            </div>
          </div>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Extrair Questoes (PDF)
          </>
        )}
      </Button>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Ou importar por JSON</CardTitle>
          <CardDescription className="text-xs">
            Aceita objeto com campo `questions` (com topic/subtopic/difficulty opcionais) ou array de questoes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            rows={6}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"detected_year": 2025, "questions": [{"number": 1, "area": "linguagens", "topic": "Interpretacao", "subtopic": "Inferencia", "difficulty": 2, "statement": "", "alternatives": [], "images": [{"url": "https://..."}]}]}'
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onProcessJson(jsonInput)}
            disabled={!jsonInput.trim() || loading}
          >
            Carregar JSON
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionEditDialog({
  question,
  open,
  onClose,
  onSave,
  onAddAlternativeImage,
  onRemoveAlternativeImage,
}: {
  question: ImportedQuestion | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<ImportedQuestion>) => void;
  onAddAlternativeImage: (number: number, day: number, letter: string, file: File) => void;
  onRemoveAlternativeImage: (number: number, day: number, letter: string) => void;
}) {
  const [statement, setStatement] = useState('');
  const [alternatives, setAlternatives] = useState<{ letter: string; text: string; image_url?: string | null }[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('none');
  const [area, setArea] = useState('');
  const [tags, setTags] = useState('');

  const [lastQ, setLastQ] = useState<ImportedQuestion | null>(null);
  if (question && question !== lastQ) {
    setLastQ(question);
    setStatement(question.statement);
    setAlternatives(question.alternatives.map(a => ({ ...a })));
    setCorrectAnswer(question.annulled ? 'anulada' : (question.correct_answer || 'none'));
    setArea(question.area);
    setTags(question.tags.join(', '));
  }

  const handleSave = () => {
    const isAnnulled = correctAnswer === 'anulada';
    onSave({
      statement,
      alternatives,
      correct_answer: isAnnulled ? null : (correctAnswer === 'none' ? null : correctAnswer),
      annulled: isAnnulled,
      area,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    onClose();
  };

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Questao {question.number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Resposta correta</Label>
              <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['A', 'B', 'C', 'D', 'E'].map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                  <SelectItem value="anulada">Anulada</SelectItem>
                  <SelectItem value="none">Nenhuma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Area</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AREA_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Enunciado (pode ficar vazio se tiver imagem)</Label>
            <Textarea
              value={statement}
              onChange={e => setStatement(e.target.value)}
              rows={4}
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Alternativas</Label>
            {alternatives.map((alt, i) => (
              <div key={alt.letter} className="flex items-start gap-2">
                <span className="text-xs font-bold mt-2.5 w-4 shrink-0">{alt.letter}</span>
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={alt.text}
                    onChange={e => {
                      const updated = [...alternatives];
                      updated[i] = { ...alt, text: e.target.value };
                      setAlternatives(updated);
                    }}
                    rows={2}
                    className="text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      id={`alt-image-input-${question.day}-${question.number}-${alt.letter}`}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onAddAlternativeImage(question.number, question.day, alt.letter, file);
                          const updated = [...alternatives];
                          updated[i] = { ...alt, image_url: URL.createObjectURL(file) };
                          setAlternatives(updated);
                        }
                        e.currentTarget.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        const input = document.getElementById(`alt-image-input-${question.day}-${question.number}-${alt.letter}`) as HTMLInputElement | null;
                        input?.click();
                      }}
                    >
                      <ImagePlus className="h-3.5 w-3.5 mr-1" />
                      Anexar imagem na alternativa
                    </Button>
                    <div
                      className="text-[11px] text-muted-foreground border rounded px-2 py-1"
                      tabIndex={0}
                      onPaste={(e) => {
                        const files = Array.from(e.clipboardData.files || []);
                        const imageFile = files.find((f) => f.type.startsWith('image/'));
                        if (!imageFile) return;
                        e.preventDefault();
                        onAddAlternativeImage(question.number, question.day, alt.letter, imageFile);
                        const updated = [...alternatives];
                        updated[i] = { ...alt, image_url: URL.createObjectURL(imageFile) };
                        setAlternatives(updated);
                      }}
                    >
                      Ctrl+V imagem
                    </div>
                  </div>
                  {alt.image_url && (
                    <div className="relative w-28 rounded border overflow-hidden">
                      <img src={alt.image_url} alt={`Alternativa ${alt.letter}`} className="w-full h-20 object-cover" loading="lazy" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-0.5"
                        onClick={() => {
                          onRemoveAlternativeImage(question.number, question.day, alt.letter);
                          const updated = [...alternatives];
                          updated[i] = { ...alt, image_url: null };
                          setAlternatives(updated);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tags (separadas por virgula)</Label>
            <Input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="historia, enem"
              className="text-xs h-9"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewStage({
  questions,
  onToggle,
  onUpdateQuestion,
  onAddImages,
  onRemoveImage,
  onAddAlternativeImage,
  onRemoveAlternativeImage,
  onConfirm,
  onBack,
}: {
  questions: ImportedQuestion[];
  onToggle: (n: number, day: number) => void;
  onUpdateQuestion: (n: number, day: number, updates: Partial<ImportedQuestion>) => void;
  onAddImages: (n: number, day: number, files: File[]) => void;
  onRemoveImage: (n: number, day: number, imageIndex: number) => void;
  onAddAlternativeImage: (n: number, day: number, letter: string, file: File) => void;
  onRemoveAlternativeImage: (n: number, day: number, letter: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const selected = questions.filter(q => q.selected);
  const annulled = questions.filter(q => q.annulled);
  const withoutAnswer = selected.filter(q => !q.correct_answer && !q.annulled);
  const days = [...new Set(questions.map(q => q.day))].sort();
  const [editingQuestion, setEditingQuestion] = useState<ImportedQuestion | null>(null);
  const [editedSet, setEditedSet] = useState<Set<string>>(new Set());

  const handleSaveEdit = (updates: Partial<ImportedQuestion>) => {
    if (!editingQuestion) return;
    onUpdateQuestion(editingQuestion.number, editingQuestion.day, updates);
    setEditedSet(prev => new Set(prev).add(`${editingQuestion.day}-${editingQuestion.number}`));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="text-sm text-muted-foreground">
          {selected.length} de {questions.length} selecionadas
        </div>
      </div>

      {annulled.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {annulled.length} questoes anuladas (desmarcadas automaticamente)
        </div>
      )}

      {withoutAnswer.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {withoutAnswer.length} questoes sem gabarito - clique para editar
        </div>
      )}

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
        {days.map(day => {
          const dayQuestions = questions.filter(q => q.day === day);
          return (
            <div key={day}>
              <h3 className="text-sm font-semibold text-foreground mb-2 sticky top-0 bg-background py-1 z-10">
                Dia {day} - {dayQuestions.filter(q => q.selected).length} questoes
              </h3>
              <div className="space-y-2">
                {dayQuestions.map(q => {
                  const noAnswer = !q.correct_answer && !q.annulled;
                  const wasEdited = editedSet.has(`${q.day}-${q.number}`);
                  const inputId = `question-image-${q.day}-${q.number}`;

                  return (
                    <Card
                      key={`${q.day}-${q.number}`}
                      className={`transition-opacity cursor-pointer hover:ring-1 hover:ring-primary/40 ${!q.selected ? 'opacity-40' : ''} ${noAnswer && q.selected ? 'border-amber-400 dark:border-amber-500' : ''}`}
                      onClick={() => setEditingQuestion(q)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="font-bold text-xs">Q{q.number}</span>
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                {AREA_LABELS[q.area] || q.area}
                              </Badge>
                              {q.annulled ? (
                                <Badge variant="destructive" className="text-xs px-1.5 py-0">Anulada</Badge>
                              ) : q.correct_answer ? (
                                <Badge variant="outline" className="text-xs px-1.5 py-0">{q.correct_answer}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs px-1.5 py-0 text-amber-600">?</Badge>
                              )}
                              {q.images.length > 0 && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0">{q.images.length} imagem(ns)</Badge>
                              )}
                              {q.requires_image && (
                                <Badge variant="destructive" className="text-xs px-1.5 py-0">Precisa imagem</Badge>
                              )}
                              {wasEdited && <Pencil className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {q.statement?.trim() ? q.statement : '[Sem enunciado textual]'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggle(q.number, q.day);
                            }}
                          >
                            {q.selected ? (
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            )}
                          </Button>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            id={inputId}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              onAddImages(q.number, q.day, files);
                              e.currentTarget.value = '';
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              const input = document.getElementById(inputId) as HTMLInputElement | null;
                              input?.click();
                            }}
                          >
                            <ImagePlus className="h-3.5 w-3.5 mr-1" />
                            Anexar imagem
                          </Button>
                          <div
                            className="text-[11px] text-muted-foreground border rounded px-2 py-1"
                            tabIndex={0}
                            onPaste={(e) => {
                              const files = Array.from(e.clipboardData.files || []);
                              const imageFiles = files.filter((f) => f.type.startsWith('image/'));
                              if (imageFiles.length === 0) return;
                              e.preventDefault();
                              onAddImages(q.number, q.day, imageFiles);
                            }}
                          >
                            Ctrl+V imagem
                          </div>
                        </div>
                        {q.requires_image && q.image_reason && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-300">
                            Dica IA: {q.image_reason}
                          </p>
                        )}

                        {q.images.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" onClick={(e) => e.stopPropagation()}>
                            {q.images.map((img, imageIndex) => (
                              <div key={`${img.url}-${imageIndex}`} className="relative rounded-md overflow-hidden border bg-muted/20">
                                <img
                                  src={img.url}
                                  alt={`Questao ${q.number} imagem ${imageIndex + 1}`}
                                  className="h-16 w-full object-cover"
                                  loading="lazy"
                                />
                                <button
                                  type="button"
                                  className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-0.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveImage(q.number, q.day, imageIndex);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Button className="w-full" size="lg" onClick={onConfirm} disabled={selected.length === 0}>
        <ArrowRight className="h-4 w-4 mr-2" />
        Revisar e Importar ({selected.length})
      </Button>

      <QuestionEditDialog
        question={editingQuestion}
        open={!!editingQuestion}
        onClose={() => setEditingQuestion(null)}
        onSave={handleSaveEdit}
        onAddAlternativeImage={onAddAlternativeImage}
        onRemoveAlternativeImage={onRemoveAlternativeImage}
      />
    </div>
  );
}

function ConfirmStage({
  questions,
  detectedYear,
  loading,
  progress,
  onSave,
  onBack,
}: {
  questions: ImportedQuestion[];
  detectedYear: number | null;
  loading: boolean;
  progress: number;
  onSave: (year: number) => void;
  onBack: () => void;
}) {
  const [year, setYear] = useState(detectedYear || new Date().getFullYear());
  const selected = questions.filter(q => q.selected);
  const areas = [...new Set(selected.map(q => q.area))];
  const days = [...new Set(selected.map(q => q.day))].sort();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} disabled={loading}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Confirmar Importacao</CardTitle>
          <CardDescription>
            Revise os dados antes de importar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-year">Ano da prova</Label>
            <Input
              id="confirm-year"
              type="number"
              min={2009}
              max={2030}
              value={year}
              onChange={e => setYear(parseInt(e.target.value, 10))}
              className="w-32"
            />
            {detectedYear && (
              <p className="text-xs text-muted-foreground">Detectado automaticamente: {detectedYear}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Dias:</span>
              <p className="font-medium">{days.map(d => `Dia ${d}`).join(' + ')}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Questoes:</span>
              <p className="font-medium">{selected.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {areas.map(a => (
              <Badge key={a} className={AREA_COLORS[a] || 'bg-muted text-muted-foreground'}>
                {AREA_LABELS[a] || a}: {selected.filter(q => q.area === a).length}
              </Badge>
            ))}
          </div>

          {selected.filter(q => q.images.length > 0).length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selected.filter(q => q.images.length > 0).length} questoes com imagem
            </p>
          )}

          {loading && <Progress value={progress} className="h-2" />}

          <Button className="w-full" size="lg" onClick={() => onSave(year)} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando... {progress}%
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Importar {selected.length} Questoes
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Import({ embedded = false }: { embedded?: boolean }) {
  const {
    stage,
    questions,
    loading,
    progress,
    detectedYear,
    loadingMessage,
    processUploads,
    processJsonImport,
    removeQuestion,
    updateQuestion,
    addQuestionImages,
    removeQuestionImage,
    addAlternativeImage,
    removeAlternativeImage,
    saveQuestions,
    goToConfirm,
    goBack,
  } = useImportExam();

  const content = (
    <div className={embedded ? '' : 'container max-w-2xl mx-auto px-4 py-8'}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Importar Prova ENEM</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stage === 'upload' && 'Envie PDFs ou JSON de questoes'}
            {stage === 'preview' && 'Revise as questoes extraidas - clique para editar'}
            {stage === 'confirm' && 'Confirme o ano e importe'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['Upload', 'Preview', 'Importar'].map((label, i) => {
            const stepStages = ['upload', 'preview', 'confirm'] as const;
            const isActive = stepStages.indexOf(stage) >= i;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={`h-2 flex-1 rounded-full ${isActive ? 'bg-primary' : 'bg-muted'}`} />
                <span className={`text-xs ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {stage === 'upload' && (
          <UploadStage
            onProcess={processUploads}
            onProcessJson={processJsonImport}
            loading={loading}
            loadingMessage={loadingMessage}
            progress={progress}
          />
        )}
        {stage === 'preview' && (
          <PreviewStage
            questions={questions}
            onToggle={removeQuestion}
            onUpdateQuestion={updateQuestion}
            onAddImages={addQuestionImages}
            onRemoveImage={removeQuestionImage}
            onAddAlternativeImage={addAlternativeImage}
            onRemoveAlternativeImage={removeAlternativeImage}
            onConfirm={goToConfirm}
            onBack={goBack}
          />
        )}
        {stage === 'confirm' && (
          <ConfirmStage
            questions={questions}
            detectedYear={detectedYear}
            loading={loading}
            progress={progress}
            onSave={saveQuestions}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );

  if (embedded) return content;

  return <MainLayout>{content}</MainLayout>;
}
