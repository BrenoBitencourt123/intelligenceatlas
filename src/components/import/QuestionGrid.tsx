import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, Check, AlertCircle, Circle } from 'lucide-react';
import type { ImportedQuestion } from '@/hooks/useImportExam';

type QuestionStatus = 'ok' | 'warning' | 'empty' | 'error';

function getQuestionStatus(q: ImportedQuestion): QuestionStatus {
  if (q.annulled) return 'error';
  if (!q.statement?.trim() && q.images.length === 0) return 'empty';
  if (!q.correct_answer) return 'warning';
  if (q.alternatives.length < 5) return 'warning';
  return 'ok';
}

const DAY_RANGES: Record<number, { start: number; end: number }> = {
  1: { start: 1, end: 90 },
  2: { start: 91, end: 180 },
};

interface QuestionGridProps {
  questions: ImportedQuestion[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onConfirm: () => void;
}

export function QuestionGrid({ questions, currentIndex, onSelectIndex, onConfirm }: QuestionGridProps) {
  const days = [...new Set(questions.map(q => q.day))].sort();
  const currentQuestion = questions[currentIndex];

  // Count statuses
  const statusCounts = { ok: 0, warning: 0, empty: 0, error: 0 };
  const statusMap = new Map<string, QuestionStatus>();
  questions.forEach((q) => {
    const status = getQuestionStatus(q);
    statusCounts[status]++;
    statusMap.set(`${q.day}-${q.number}`, status);
  });

  const selected = questions.filter(q => q.selected);

  const statusColors: Record<QuestionStatus, string> = {
    ok: 'bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30',
    warning: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30',
    empty: 'bg-muted text-muted-foreground hover:bg-muted/80',
    error: 'bg-destructive/20 text-destructive hover:bg-destructive/30',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status summary */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">{questions.length} questões</span>
          <span className="text-muted-foreground">{selected.length} selecionadas</span>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-500/40" />
            {statusCounts.ok} OK
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/40" />
            {statusCounts.warning} Atenção
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" />
            {statusCounts.empty} Vazias
          </span>
          {statusCounts.error > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-destructive/40" />
              {statusCounts.error} Erro
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {days.map(day => {
            const range = DAY_RANGES[day] || { start: (day - 1) * 90 + 1, end: day * 90 };
            const dayQuestions = questions.filter(q => q.day === day);
            const existingNumbers = new Set(dayQuestions.map(q => q.number));

            // Build grid numbers from the range
            const numbers: number[] = [];
            for (let n = range.start; n <= range.end; n++) {
              if (existingNumbers.has(n)) numbers.push(n);
            }
            // Add any numbers outside range that exist
            dayQuestions.forEach(q => {
              if (!numbers.includes(q.number)) numbers.push(q.number);
            });
            numbers.sort((a, b) => a - b);

            return (
              <div key={day}>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Dia {day}
                </p>
                <div className="grid grid-cols-6 gap-1">
                  {numbers.map(num => {
                    const q = dayQuestions.find(q => q.number === num);
                    if (!q) return null;
                    const status = statusMap.get(`${day}-${num}`) || 'empty';
                    const isCurrent = currentQuestion && currentQuestion.number === num && currentQuestion.day === day;
                    const qIndex = questions.findIndex(qq => qq.number === num && qq.day === day);

                    return (
                      <button
                        key={`${day}-${num}`}
                        onClick={() => qIndex >= 0 && onSelectIndex(qIndex)}
                        className={`
                          h-8 text-[11px] font-medium rounded-md transition-all
                          ${statusColors[status]}
                          ${isCurrent ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                          ${!q.selected ? 'opacity-40' : ''}
                        `}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Confirm button */}
      <div className="p-3 border-t border-border">
        <Button className="w-full" size="sm" onClick={onConfirm} disabled={selected.length === 0}>
          <ArrowRight className="h-4 w-4 mr-1" />
          Revisar e Importar ({selected.length})
        </Button>
      </div>
    </div>
  );
}
