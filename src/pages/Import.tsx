import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, ArrowLeft, ArrowRight, Check, Loader2, Trash2, AlertCircle, X } from 'lucide-react';
import { useImportExam, ImportedQuestion, DayUpload } from '@/hooks/useImportExam';

const AREA_LABELS: Record<string, string> = {
  linguagens: 'Linguagens',
  humanas: 'Humanas',
  natureza: 'Natureza',
  matematica: 'Matemática',
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
  const dayLabel = dayNum === 1 ? 'Linguagens + Humanas' : 'Natureza + Matemática';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Dia {dayNum}
          <span className="text-xs font-normal text-muted-foreground">— {dayLabel}</span>
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
            Sem gabarito? As questões serão importadas sem resposta correta.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function UploadStage({
  onProcess,
  loading,
  loadingMessage,
  progress,
}: {
  onProcess: (days: DayUpload[]) => void;
  loading: boolean;
  loadingMessage: string;
  progress: number;
}) {
  const [day1, setDay1] = useState<DayUpload>({ examFile: null, gabaritoFile: null, gabaritoText: '', day: 1 });
  const [day2, setDay2] = useState<DayUpload>({ examFile: null, gabaritoFile: null, gabaritoText: '', day: 2 });

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
            Extrair Questões
          </>
        )}
      </Button>
    </div>
  );
}

function PreviewStage({
  questions,
  onToggle,
  onUpdateArea,
  onConfirm,
  onBack,
}: {
  questions: ImportedQuestion[];
  onToggle: (n: number, day: number) => void;
  onUpdateArea: (n: number, day: number, area: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const selected = questions.filter(q => q.selected);
  const withoutAnswer = selected.filter(q => !q.correct_answer);
  const days = [...new Set(questions.map(q => q.day))].sort();

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

      {withoutAnswer.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {withoutAnswer.length} questões sem gabarito
        </div>
      )}

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
        {days.map(day => {
          const dayQuestions = questions.filter(q => q.day === day);
          return (
            <div key={day}>
              <h3 className="text-sm font-semibold text-foreground mb-2 sticky top-0 bg-background py-1 z-10">
                Dia {day} — {dayQuestions.filter(q => q.selected).length} questões
              </h3>
              <div className="space-y-2">
                {dayQuestions.map(q => (
                  <Card key={`${q.day}-${q.number}`} className={`transition-opacity ${!q.selected ? 'opacity-40' : ''}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="font-bold text-xs">Q{q.number}</span>
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {AREA_LABELS[q.area] || q.area}
                            </Badge>
                            {q.correct_answer ? (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                {q.correct_answer}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 text-amber-600">
                                ?
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{q.statement}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-7 w-7"
                          onClick={() => onToggle(q.number, q.day)}
                        >
                          {q.selected ? (
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Button className="w-full" size="lg" onClick={onConfirm} disabled={selected.length === 0}>
        <ArrowRight className="h-4 w-4 mr-2" />
        Revisar e Importar ({selected.length})
      </Button>
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
          <CardTitle>Confirmar Importação</CardTitle>
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
              onChange={e => setYear(parseInt(e.target.value))}
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
              <span className="text-muted-foreground">Questões:</span>
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

          {selected.filter(q => !q.correct_answer).length > 0 && (
            <p className="text-xs text-amber-600">
              ⚠ {selected.filter(q => !q.correct_answer).length} questões sem gabarito
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
                Importar {selected.length} Questões
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Import() {
  const {
    stage,
    questions,
    loading,
    progress,
    detectedYear,
    loadingMessage,
    processUploads,
    removeQuestion,
    updateArea,
    saveQuestions,
    goToConfirm,
    goBack,
  } = useImportExam();

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Importar Prova ENEM</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stage === 'upload' && 'Envie os PDFs da prova e gabarito de cada dia'}
              {stage === 'preview' && 'Revise as questões extraídas pela IA'}
              {stage === 'confirm' && 'Confirme o ano e importe'}
            </p>
          </div>

          {/* Step indicator */}
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
              loading={loading}
              loadingMessage={loadingMessage}
              progress={progress}
            />
          )}
          {stage === 'preview' && (
            <PreviewStage
              questions={questions}
              onToggle={removeQuestion}
              onUpdateArea={updateArea}
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
    </MainLayout>
  );
}
