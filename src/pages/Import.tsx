import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, ArrowLeft, ArrowRight, Check, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { useImportExam, ImportedQuestion } from '@/hooks/useImportExam';

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

function UploadStage({
  onExtract,
  loading,
}: {
  onExtract: (file: File, year: number, day: number, answerKey: string) => void;
  loading: boolean;
}) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [day, setDay] = useState('1');
  const [file, setFile] = useState<File | null>(null);
  const [answerKey, setAnswerKey] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') setFile(dropped);
  };

  const handleSubmit = () => {
    if (!file) return;
    onExtract(file, year, parseInt(day), answerKey);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Prova</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                min={2009}
                max={2030}
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Dia</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Dia 1 — Linguagens + Humanas</SelectItem>
                  <SelectItem value="2">Dia 2 — Natureza + Matemática</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload do PDF</CardTitle>
          <CardDescription>Arraste ou selecione o PDF da prova</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={dropRef}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Clique ou arraste o PDF aqui</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gabarito</CardTitle>
          <CardDescription>
            Cole o gabarito no formato "1-D, 2-A, 3-C..." ou apenas as letras "DACBE..."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="1-D, 2-D, 3-B, 4-C, 5-A... ou DDBCA..."
            value={answerKey}
            onChange={e => setAnswerKey(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Formatos aceitos: "1-D, 2-A" / "1D 2A" / "DACBE..." / deixe em branco para preencher depois
          </p>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={!file || loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Extraindo questões...
          </>
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
  onToggle: (n: number) => void;
  onUpdateArea: (n: number, area: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const selected = questions.filter(q => q.selected);
  const withoutAnswer = selected.filter(q => !q.correct_answer);

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

      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {questions.map(q => (
          <Card key={q.number} className={`transition-opacity ${!q.selected ? 'opacity-40' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">Q{q.number}</span>
                    <Select value={q.area} onValueChange={v => onUpdateArea(q.number, v)}>
                      <SelectTrigger className="h-6 w-auto text-xs px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AREA_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {q.correct_answer ? (
                      <Badge variant="outline" className="text-xs">Resp: {q.correct_answer}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-amber-600">Sem gabarito</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{q.statement}</p>
                  <div className="flex gap-1 mt-1">
                    {q.alternatives.map(a => (
                      <span
                        key={a.letter}
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          a.letter === q.correct_answer
                            ? 'bg-green-500/20 text-green-700 dark:text-green-300 font-bold'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {a.letter}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => onToggle(q.number)}
                >
                  <Trash2 className={`h-4 w-4 ${q.selected ? 'text-muted-foreground' : 'text-destructive'}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
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
  year,
  day,
  loading,
  progress,
  onSave,
  onBack,
}: {
  questions: ImportedQuestion[];
  year: number;
  day: number;
  loading: boolean;
  progress: number;
  onSave: () => void;
  onBack: () => void;
}) {
  const selected = questions.filter(q => q.selected);
  const areas = [...new Set(selected.map(q => q.area))];

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
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Prova:</span>
              <p className="font-medium">ENEM {year} — Dia {day}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Questões:</span>
              <p className="font-medium">{selected.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {areas.map(a => (
              <Badge key={a} className={AREA_COLORS[a]}>
                {AREA_LABELS[a]}: {selected.filter(q => q.area === a).length}
              </Badge>
            ))}
          </div>

          {selected.filter(q => !q.correct_answer).length > 0 && (
            <p className="text-xs text-amber-600">
              ⚠ {selected.filter(q => !q.correct_answer).length} questões sem gabarito
            </p>
          )}

          {loading && <Progress value={progress} className="h-2" />}

          <Button className="w-full" size="lg" onClick={onSave} disabled={loading}>
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
    year,
    day,
    extractFromPdf,
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
            <h1 className="text-2xl font-bold text-foreground">Importar Questões</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stage === 'upload' && 'Faça upload do PDF da prova do ENEM'}
              {stage === 'preview' && 'Revise as questões extraídas pela IA'}
              {stage === 'confirm' && 'Confirme a importação'}
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
            <UploadStage onExtract={extractFromPdf} loading={loading} />
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
              year={year}
              day={day}
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
