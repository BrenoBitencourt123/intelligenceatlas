import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ArrowRight, ImagePlus, Trash2, ClipboardPaste } from 'lucide-react';
import type { ImportedQuestion } from '@/hooks/useImportExam';
import type { QuestionImage } from '@/lib/questionImages';

const AREA_LABELS: Record<string, string> = {
  linguagens: 'Linguagens',
  humanas: 'Humanas',
  natureza: 'Natureza',
  matematica: 'Matemática',
};

interface QuestionEditorProps {
  question: ImportedQuestion;
  questionIndex: number;
  totalQuestions: number;
  onUpdate: (updates: Partial<ImportedQuestion>) => void;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (imageIndex: number) => void;
  onAddAlternativeImage: (letter: string, file: File) => void;
  onRemoveAlternativeImage: (letter: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function QuestionEditor({
  question,
  questionIndex,
  totalQuestions,
  onUpdate,
  onAddImages,
  onRemoveImage,
  onAddAlternativeImage,
  onRemoveAlternativeImage,
  onPrev,
  onNext,
}: QuestionEditorProps) {
  const statementRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStatementChange = useCallback((value: string) => {
    onUpdate({ statement: value });
  }, [onUpdate]);

  const handleInsertImage = useCallback((files: File[]) => {
    if (files.length === 0) return;
    onAddImages(files);

    // Insert {{IMG_N}} at cursor position
    const textarea = statementRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart || textarea.value.length;
      const currentImages = question.images.length;
      const placeholders = files.map((_, i) => `{{IMG_${currentImages + i}}}`).join(' ');
      const before = question.statement.slice(0, cursorPos);
      const after = question.statement.slice(cursorPos);
      const newStatement = `${before}${placeholders}${after}`;
      onUpdate({ statement: newStatement });

      // Restore cursor after placeholder
      requestAnimationFrame(() => {
        const newPos = cursorPos + placeholders.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
      });
    }
  }, [onAddImages, onUpdate, question.images.length, question.statement]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      e.preventDefault();
      handleInsertImage(files);
    }
  }, [handleInsertImage]);

  // Render statement with inline images
  const renderStatementPreview = () => {
    const parts = question.statement.split(/(\{\{IMG_\d+\}\})/g);
    return parts.map((part, i) => {
      const imgMatch = part.match(/\{\{IMG_(\d+)\}\}/);
      if (imgMatch) {
        const imgIndex = parseInt(imgMatch[1]);
        const img = question.images[imgIndex];
        if (img) {
          return (
            <div key={i} className="flex justify-center my-2">
              <div className="relative group">
                <img
                  src={img.url}
                  alt={`Imagem ${imgIndex}`}
                  className="max-h-40 rounded-md border border-border object-contain"
                  loading="lazy"
                />
                <button
                  type="button"
                  className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveImage(imgIndex)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        }
        return <span key={i} className="text-xs text-destructive bg-destructive/10 px-1 rounded">{part}</span>;
      }
      return part ? <span key={i}>{part}</span> : null;
    });
  };

  const langLabel = question.foreign_language === 'ingles' ? '🇬🇧 Inglês' : question.foreign_language === 'espanhol' ? '🇪🇸 Espanhol' : null;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-foreground">Q.{question.number}</h2>
            <span className="text-sm text-muted-foreground">de {totalQuestions}</span>
            <Badge variant="secondary" className="text-xs">{AREA_LABELS[question.area] || question.area}</Badge>
            {langLabel && <Badge variant="outline" className="text-xs">{langLabel}</Badge>}
            {question.annulled && <Badge variant="destructive" className="text-xs">Anulada</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrev} disabled={questionIndex <= 0}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNext} disabled={questionIndex >= totalQuestions - 1}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Metadata row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Área</Label>
            <Select value={question.area} onValueChange={(v) => onUpdate({ area: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(AREA_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Resposta correta</Label>
            <Select
              value={question.annulled ? 'anulada' : (question.correct_answer || 'none')}
              onValueChange={(v) => {
                if (v === 'anulada') onUpdate({ annulled: true, correct_answer: null });
                else if (v === 'none') onUpdate({ annulled: false, correct_answer: null });
                else onUpdate({ annulled: false, correct_answer: v });
              }}
            >
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['A', 'B', 'C', 'D', 'E'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                <SelectItem value="anulada">Anulada</SelectItem>
                <SelectItem value="none">Nenhuma</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Língua estrangeira</Label>
            <Select
              value={question.foreign_language || 'none'}
              onValueChange={(v) => onUpdate({ foreign_language: v === 'none' ? null : v })}
            >
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="ingles">Inglês</SelectItem>
                <SelectItem value="espanhol">Espanhol</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statement editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Enunciado</Label>
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleInsertImage(files);
                  e.currentTarget.value = '';
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-3.5 w-3.5 mr-1" />
                Imagem
              </Button>
            </div>
          </div>

          <Textarea
            ref={statementRef}
            value={question.statement}
            onChange={(e) => handleStatementChange(e.target.value)}
            onPaste={handlePaste}
            rows={6}
            className="text-sm font-mono"
            placeholder="Cole o enunciado da questão aqui. Use {{IMG_0}}, {{IMG_1}} para posicionar imagens no texto."
          />

          {/* Preview with inline images */}
          {question.images.length > 0 && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
              <div>{renderStatementPreview()}</div>
            </div>
          )}

          {/* Images not referenced in statement */}
          {(() => {
            const referencedIndices = new Set(
              [...question.statement.matchAll(/\{\{IMG_(\d+)\}\}/g)].map(m => parseInt(m[1]))
            );
            const unreferenced = question.images
              .map((img, i) => ({ img, i }))
              .filter(({ i }) => !referencedIndices.has(i));
            if (unreferenced.length === 0) return null;
            return (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Imagens não posicionadas (insira {"{{IMG_N}}"} no enunciado):</p>
                <div className="flex gap-2 flex-wrap">
                  {unreferenced.map(({ img, i }) => (
                    <div key={i} className="relative group">
                      <img src={img.url} alt={`IMG_${i}`} className="h-16 rounded border border-border object-cover" loading="lazy" />
                      <span className="absolute bottom-0.5 left-0.5 bg-background/80 text-[9px] px-1 rounded font-mono">IMG_{i}</span>
                      <button
                        type="button"
                        className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onRemoveImage(i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Alternatives */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">Alternativas</Label>
          {question.alternatives.map((alt, i) => {
            const isCorrect = question.correct_answer === alt.letter;
            return (
              <div
                key={alt.letter}
                className={`rounded-lg border p-3 space-y-2 transition-colors ${isCorrect ? 'border-green-500 bg-green-500/5' : 'border-border'}`}
              >
                <div className="flex items-start gap-2">
                  <span className={`text-sm font-bold mt-1 w-5 shrink-0 ${isCorrect ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {alt.letter})
                  </span>
                  <Textarea
                    value={alt.text}
                    onChange={(e) => {
                      const updated = [...question.alternatives];
                      updated[i] = { ...alt, text: e.target.value };
                      onUpdate({ alternatives: updated });
                    }}
                    onPaste={(e) => {
                      const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
                      if (files.length > 0) {
                        e.preventDefault();
                        onAddAlternativeImage(alt.letter, files[0]);
                      }
                    }}
                    rows={2}
                    className="text-sm flex-1"
                    placeholder={`Texto da alternativa ${alt.letter}. Cole uma imagem com Ctrl+V.`}
                  />
                </div>
                {/* Alternative image */}
                <div className="flex items-center gap-2 ml-7">
                  {alt.image_url ? (
                    <div className="relative group flex justify-center w-full">
                      <img src={alt.image_url} alt={`Alt ${alt.letter}`} className="max-h-32 rounded border border-border object-contain" loading="lazy" />
                      <button
                        type="button"
                        className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onRemoveAlternativeImage(alt.letter)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        id={`alt-img-${question.day}-${question.number}-${alt.letter}`}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onAddAlternativeImage(alt.letter, file);
                          e.currentTarget.value = '';
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] text-muted-foreground"
                        onClick={() => {
                          (document.getElementById(`alt-img-${question.day}-${question.number}-${alt.letter}`) as HTMLInputElement)?.click();
                        }}
                      >
                        <ImagePlus className="h-3 w-3 mr-1" />
                        Imagem
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={questionIndex <= 0}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <span className="text-xs text-muted-foreground">{questionIndex + 1} / {totalQuestions}</span>
          <Button variant="outline" size="sm" onClick={onNext} disabled={questionIndex >= totalQuestions - 1}>
            Próxima <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
