import { useEffect } from 'react';
import { Flame, Check, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface Props {
  streak: number;
  weekDone: Set<number>;
  essayDays: Set<number>;
  onClose: () => void;
}

/**
 * Recompensa visual pós-sessão — estilo Duolingo.
 * Tela cheia, aparece uma vez por dia, some depois de fechar.
 */
export function WeekRewardOverlay({ streak, weekDone, essayDays, onClose }: Props) {
  const todayDow = new Date().getDay();

  // ESC fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy =
    streak >= 7
      ? { titulo: `${streak} dias seguidos.`, sub: 'Isso vira aprovação.' }
      : streak >= 3
      ? { titulo: `${streak} dias seguidos.`, sub: 'Não quebre a corrente.' }
      : streak === 1
      ? { titulo: 'Primeiro dia.', sub: 'Amanhã continua.' }
      : { titulo: `${streak} dias seguidos.`, sub: 'Volte amanhã.' };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm space-y-10 text-center">
        {/* Fogo grande */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Flame
              className={cn(
                'h-28 w-28',
                streak >= 1 ? 'text-orange-500' : 'text-muted-foreground',
                streak >= 3 && 'animate-pulse',
              )}
              strokeWidth={1.5}
            />
          </div>
          <div className="space-y-1">
            <p className="text-5xl font-black tabular-nums text-foreground">{streak}</p>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              {streak === 1 ? 'dia seguido' : 'dias seguidos'}
            </p>
          </div>
        </div>

        {/* Semana */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-1">
            {DIAS.map((letra, dow) => {
              const done = weekDone.has(dow);
              const essay = essayDays.has(dow);
              const isToday = dow === todayDow;
              return (
                <div key={dow} className="flex flex-col items-center gap-1.5 flex-1">
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-wider',
                      isToday ? 'text-foreground font-bold' : 'text-muted-foreground',
                    )}
                  >
                    {letra}
                  </span>
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center border transition-all',
                      done
                        ? 'bg-foreground text-background border-foreground scale-110'
                        : isToday
                        ? 'border-foreground border-dashed'
                        : 'border-border',
                    )}
                  >
                    {essay ? (
                      <PenLine className="h-4 w-4" />
                    ) : done ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">{copy.titulo}</h2>
          <p className="text-sm text-muted-foreground">{copy.sub}</p>
        </div>

        <Button size="lg" className="w-full" onClick={onClose}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
