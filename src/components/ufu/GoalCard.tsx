import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CURSOS_UFU, COTAS, TOTAL_QUESTOES, type CotaId } from '@/data/ufu/vestibular';

/**
 * Renders the student's target for the UFU 2ª fase:
 * meta = corte × 1.22 (comfort margin over the official cutoff).
 * Splits the 0..TOTAL_QUESTOES scale in 3 zones (abaixo do corte, no corte, meta).
 */
export function GoalCard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const cursoId = (profile as any)?.curso_ufu as string | undefined;
  const cotaId = (profile as any)?.cota_ufu as CotaId | undefined;

  const info = useMemo(() => {
    if (!cursoId || !cotaId) return null;
    const curso = CURSOS_UFU.find((c) => c.id === cursoId);
    if (!curso) return null;
    const corte = curso.cortes[cotaId] ?? null;
    const cota = COTAS.find((c) => c.id === cotaId);
    const meta = corte !== null ? Math.min(TOTAL_QUESTOES, Math.ceil(corte * 1.22)) : null;
    return { curso, cota, corte, meta };
  }, [cursoId, cotaId]);

  // No course selected → CTA to onboarding
  if (!cursoId || !cotaId) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Target className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Defina seu curso na UFU</h3>
              <p className="text-sm text-muted-foreground">
                Escolha o curso e a modalidade para calcularmos sua meta de acertos na 2ª fase.
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/onboarding')} className="w-full gap-2">
            Escolher curso
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!info) return null;
  const { curso, cota, corte, meta } = info;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sua meta na UFU
          </p>
          <h3 className="text-xl font-bold text-foreground">{curso.nome}</h3>
          <p className="text-sm text-muted-foreground">
            {curso.campus} · {curso.turno} · {cota?.label}
          </p>
        </div>

        {corte === null || meta === null ? (
          <p className="text-sm text-muted-foreground">
            A UFU não publicou nota de corte 2026/2 para esta modalidade neste curso.
            Vamos usar a média histórica assim que a base estiver classificada.
          </p>
        ) : (
          <>
            {/* Zones bar */}
            <div className="space-y-2">
              <div className="relative h-2 rounded-full overflow-hidden bg-muted">
                <div
                  className="absolute inset-y-0 left-0 bg-muted-foreground/25"
                  style={{ width: `${(corte / TOTAL_QUESTOES) * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 bg-muted-foreground/50"
                  style={{
                    left: `${(corte / TOTAL_QUESTOES) * 100}%`,
                    width: `${((meta - corte) / TOTAL_QUESTOES) * 100}%`,
                  }}
                />
                <div
                  className="absolute inset-y-0 bg-foreground"
                  style={{
                    left: `${(meta / TOTAL_QUESTOES) * 100}%`,
                    width: `${((TOTAL_QUESTOES - meta) / TOTAL_QUESTOES) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                <span>0</span>
                <span>{corte} corte</span>
                <span>{meta} meta</span>
                <span>{TOTAL_QUESTOES}</span>
              </div>
            </div>

            {/* Zones legend */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-muted-foreground/25" />
                  <span className="text-muted-foreground">Abaixo</span>
                </div>
                <p className="font-medium text-foreground tabular-nums">0 – {corte - 1}</p>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-muted-foreground/50" />
                  <span className="text-muted-foreground">No corte</span>
                </div>
                <p className="font-medium text-foreground tabular-nums">{corte} – {meta - 1}</p>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-foreground" />
                  <span className="text-muted-foreground">Meta</span>
                </div>
                <p className="font-medium text-foreground tabular-nums">{meta} – {TOTAL_QUESTOES}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Passar no corte não garante vaga: a UFU classifica ~6× mais candidatos que vagas.
              Sua meta ({meta} acertos) é o corte com margem de 22% para chegar com folga na
              classificação final.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
