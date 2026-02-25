import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuestionImageManager } from '@/hooks/useQuestionImageManager';
import { validateQuestionImageFile } from '@/lib/questionImages';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, ImageOff, ChevronLeft, ChevronRight, X, FolderUp, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

function BulkFolderUpload() {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const [lastResult, setLastResult] = useState<{ success: number; errors: number } | null>(null);

  const handleFolderSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(f =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)
    );

    if (imageFiles.length === 0) {
      toast({ title: 'Nenhuma imagem encontrada na pasta', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setProgress({ done: 0, total: imageFiles.length, errors: 0 });
    setLastResult(null);

    let successCount = 0;
    let errorCount = 0;

    // Upload in batches of 5 for performance
    const BATCH_SIZE = 5;
    for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
      const batch = imageFiles.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (file) => {
          // webkitRelativePath gives us the full relative path like "enem/2020/d1/q001/stmt_0.webp"
          const path = (file as any).webkitRelativePath || file.name;

            const { error } = await supabase.storage
              .from('question-images')
              .upload(path, file, {
                contentType: file.type,
                upsert: true,
                cacheControl: '0',
              });

          if (error) throw new Error(`${path}: ${error.message}`);
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') successCount++;
        else {
          errorCount++;
          console.error('[BulkUpload]', (r as PromiseRejectedResult).reason);
        }
      }

      setProgress({ done: successCount + errorCount, total: imageFiles.length, errors: errorCount });
    }

    setUploading(false);
    setLastResult({ success: successCount, errors: errorCount });

    // Reset input so the same folder can be re-selected
    if (folderInputRef.current) folderInputRef.current.value = '';

    toast({
      title: `Upload concluído`,
      description: `${successCount} arquivo(s) enviado(s)${errorCount > 0 ? `, ${errorCount} erro(s)` : ''}`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });
  }, []);

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderUp className="h-4 w-4 text-primary" />
          Upload de pasta em lote
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecione uma pasta inteira (ex: <code className="bg-muted px-1 rounded">enem/</code>) para subir todas as imagens preservando a estrutura de pastas.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => folderInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FolderUp className="h-4 w-4 mr-2" />}
            {uploading ? 'Enviando...' : 'Selecionar pasta'}
          </Button>
          <input
            ref={folderInputRef}
            type="file"
            className="hidden"
            onChange={handleFolderSelect}
            {...({ webkitdirectory: '', directory: '', multiple: true } as any)}
          />
          <p className="text-xs text-muted-foreground">
            Os arquivos serão enviados para o bucket <code className="bg-muted px-1 rounded">question-images</code> com os mesmos caminhos.
          </p>
        </div>

        {uploading && (
          <div className="space-y-1">
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.done} / {progress.total} ({pct}%)
              {progress.errors > 0 && <span className="text-destructive ml-2">{progress.errors} erro(s)</span>}
            </p>
          </div>
        )}

        {lastResult && !uploading && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{lastResult.success} arquivo(s) enviado(s) com sucesso</span>
            {lastResult.errors > 0 && (
              <span className="text-destructive">• {lastResult.errors} erro(s)</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const AREA_LABELS: Record<string, string> = {
  matematica: 'Matemática',
  linguagens: 'Linguagens',
  natureza: 'Ciências da Natureza',
  humanas: 'Ciências Humanas',
};

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];

function QuestionImageCard({ question, onSave, isSaving }: {
  question: { id: string; number: number; year: number | null; area: string; topic: string; statement: string; image_reason?: string | null };
  onSave: (id: string, files: File[], captions: string[]) => Promise<void>;
  isSaving: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      try {
        validateQuestionImageFile(f);
        valid.push(f);
      } catch (err: unknown) {
        toast({ title: 'Arquivo inválido', description: (err as Error).message, variant: 'destructive' });
      }
    }
    if (!valid.length) return;
    setPendingFiles((prev) => [...prev, ...valid]);
    setPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
    setCaptions((prev) => [...prev, ...valid.map(() => '')]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setCaptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!pendingFiles.length) return;
    await onSave(question.id, pendingFiles, captions);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">Q{question.number}</span>
              {question.year && <Badge variant="outline">{question.year}</Badge>}
              <Badge variant="secondary">{AREA_LABELS[question.area] ?? question.area}</Badge>
              <Badge variant="outline" className="text-xs">{question.topic}</Badge>
            </div>
            {question.image_reason && (
              <p className="text-xs text-amber-600 dark:text-amber-400">{question.image_reason}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-3 mt-1">
          {question.statement.replace(/\*\*/g, '').replace(/>/g, '').slice(0, 200)}...
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        >
          <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Clique ou arraste imagens aqui</p>
          <p className="text-xs text-muted-foreground/60">JPEG, PNG, WebP, GIF • máx 5MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="space-y-2">
            {previews.map((src, i) => (
              <div key={i} className="flex items-center gap-2">
                <img src={src} alt={`preview-${i}`} className="h-16 w-24 object-cover rounded border" />
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Legenda (opcional)"
                    value={captions[i]}
                    onChange={(e) => setCaptions((prev) => { const c = [...prev]; c[i] = e.target.value; return c; })}
                    className="h-7 text-xs"
                  />
                  <p className="text-xs text-muted-foreground">{pendingFiles[i].name}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeFile(i)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {pendingFiles.length > 0 && (
          <Button size="sm" className="w-full" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Salvar {pendingFiles.length} imagem{pendingFiles.length > 1 ? 'ns' : ''}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function ImageManagerPanel() {
  const {
    questions,
    loading,
    uploading,
    yearFilter,
    setYearFilter,
    areaFilter,
    setAreaFilter,
    page,
    setPage,
    totalCount,
    PAGE_SIZE,
    fetchQuestions,
    uploadAndSaveImages,
  } = useQuestionImageManager();

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSave = async (id: string, files: File[], captions: string[]) => {
    try {
      await uploadAndSaveImages(id, files, captions);
      toast({ title: 'Imagens salvas com sucesso' });
    } catch (err: unknown) {
      toast({ title: 'Erro ao salvar imagens', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <BulkFolderUpload />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageOff className="h-4 w-4 text-amber-500" />
            Questões sem imagens
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Questões que precisam de imagem associada.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select
              value={yearFilter?.toString() ?? 'all'}
              onValueChange={(v) => { setYearFilter(v === 'all' ? null : Number(v)); setPage(0); }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Todos os anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={areaFilter ?? 'all'}
              onValueChange={(v) => { setAreaFilter(v === 'all' ? null : v); setPage(0); }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                {Object.entries(AREA_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => { setPage(0); fetchQuestions(); }}>
              Atualizar
            </Button>

            <span className="text-sm text-muted-foreground self-center ml-auto">
              {loading ? '...' : `${questions.length} questões nesta página`}
            </span>
          </div>

          {/* Question list */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma questão encontrada sem imagens</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q) => (
                <QuestionImageCard
                  key={q.id}
                  question={q}
                  onSave={handleSave}
                  isSaving={!!uploading[q.id]}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">Página {page + 1} de {totalPages}</span>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
