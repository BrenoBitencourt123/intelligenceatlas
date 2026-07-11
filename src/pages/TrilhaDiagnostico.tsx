import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AUTOAVALIACAO_FALLBACK, atualizarPlacar } from "@/lib/ufu/placar";
import { trackUfu } from "@/lib/ufu/track";

// Trilha tables not yet in generated types
const supabase = supabaseTyped as unknown as { from: (t: string) => any };

type Nivel = "nada" | "basico" | "bastante";

type TrilhaNo = {
  id: string;
  disciplina: string;
  titulo: string;
  ordem: number;
};

const DISCIPLINA_LABEL: Record<string, string> = {
  redacao: "Redação",
  matematica: "Matemática",
  linguagens: "Linguagens",
  humanas: "Humanas",
  natureza: "Natureza",
};

const OPCOES: { id: Nivel; titulo: string; sub: string; dourados: number }[] = [
  { id: "nada", titulo: "Não sei nada ainda", sub: "Começa do zero comigo", dourados: 0 },
  { id: "basico", titulo: "Sei o básico", sub: "Pula a introdução", dourados: 1 },
  { id: "bastante", titulo: "Sei bastante", sub: "Já vai pro que cai", dourados: 2 },
];

export default function TrilhaDiagnostico() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [nos, setNos] = useState<TrilhaNo[] | null>(null);
  const [respostas, setRespostas] = useState<Record<string, Nivel>>({});
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("trilha_nos")
        .select("id,disciplina,titulo,ordem")
        .eq("ativo", true)
        .order("disciplina")
        .order("ordem");
      setNos((data as TrilhaNo[]) ?? []);
    })();
  }, [user]);

  const disciplinas = useMemo(() => {
    if (!nos) return [];
    return Array.from(new Set(nos.map((n) => n.disciplina)));
  }, [nos]);

  const disciplinaAtual = disciplinas[step];
  const total = disciplinas.length;

  const finalizar = async (respostasFinal: Record<string, Nivel>) => {
    if (!user || !nos) return;
    setSaving(true);
    try {
      // Para cada disciplina, marca os primeiros N nós como dourado
      const rows: {
        user_id: string;
        no_id: string;
        nivel_atual: number;
        dourado: boolean;
        updated_at: string;
      }[] = [];
      for (const disc of disciplinas) {
        const nivel = respostasFinal[disc];
        const opt = OPCOES.find((o) => o.id === nivel);
        const dourados = opt?.dourados ?? 0;
        const nosDaDisc = nos.filter((n) => n.disciplina === disc);
        for (let i = 0; i < Math.min(dourados, nosDaDisc.length); i++) {
          rows.push({
            user_id: user.id,
            no_id: nosDaDisc[i].id,
            nivel_atual: nosDaDisc[i] ? 999 : 0,
            dourado: true,
            updated_at: new Date().toISOString(),
          });
        }
      }
      if (rows.length > 0) {
        await supabase.from("trilha_progresso").upsert(rows, { onConflict: "user_id,no_id" });
      }
      await supabaseTyped
        .from("profiles")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ diagnostico_feito_at: new Date().toISOString() } as any)
        .eq("id", user.id);

      // Placar vivo: gravar fallback autoavaliacao se ainda não tem placar (nunca nasce em zero)
      const placarAtual = (profile as { placar_estimado?: number | null } | null)?.placar_estimado ?? null;
      const fonteAtual = (profile as { placar_fonte?: any } | null)?.placar_fonte ?? null;
      if (placarAtual === null) {
        // pega a resposta mais recorrente como base do fallback (média das disciplinas)
        const valores = disciplinas.map((d) => AUTOAVALIACAO_FALLBACK[respostasFinal[d] ?? "nada"] ?? 8);
        const media = Math.round(valores.reduce((a, b) => a + b, 0) / Math.max(1, valores.length));
        const salvo = await atualizarPlacar(user.id, media, "autoavaliacao", fonteAtual);
        if (salvo !== null) {
          trackUfu("placar_atualizado", {
            fonte: "autoavaliacao",
            antes: placarAtual ?? 0,
            depois: salvo,
          });
        }
        await refreshProfile();
      }

      navigate("/hoje", { replace: true });
    } catch (err) {
      toast.error("Não deu pra salvar. Tenta de novo.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const responder = (nivel: Nivel) => {
    const novo = { ...respostas, [disciplinaAtual]: nivel };
    setRespostas(novo);
    if (step + 1 >= total) {
      finalizar(novo);
    } else {
      setStep(step + 1);
    }
  };

  const pular = () => {
    if (!user) return;
    // Marca feito sem pintar nada
    supabaseTyped
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ diagnostico_feito_at: new Date().toISOString() } as any)
      .eq("id", user.id)
      .then(() => navigate("/hoje", { replace: true }));
  };

  if (nos === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (total === 0) {
    // Sem nós ativos ainda: marca feito e segue
    if (user) {
      supabaseTyped
        .from("profiles")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ diagnostico_feito_at: new Date().toISOString() } as any)
        .eq("id", user.id)
        .then(() => navigate("/hoje", { replace: true }));
    }
    return null;
  }

  const pct = ((step + 1) / total) * 100;
  const label = DISCIPLINA_LABEL[disciplinaAtual] ?? disciplinaAtual;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-xl mx-auto px-4 py-8 sm:py-14 space-y-8">
        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Diagnóstico rápido
            </span>
            <span>
              {step + 1} de {total}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Pergunta */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            Quanto você já sabe de {label.toLowerCase()}?
          </h1>
          <p className="text-sm text-muted-foreground">
            Sua resposta posiciona você na trilha. Sem pegadinha, é auto-avaliação.
          </p>
        </div>

        {/* Opções */}
        <div className="grid gap-3">
          {OPCOES.map((opt) => (
            <Card
              key={opt.id}
              className={cn(
                "cursor-pointer border-border hover:border-primary hover:bg-primary/5 transition-colors",
                saving && "pointer-events-none opacity-60",
              )}
              onClick={() => !saving && responder(opt.id)}
            >
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{opt.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>

        {saving && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Preparando sua trilha…
          </div>
        )}

        <div className="text-center pt-4">
          <Button variant="ghost" size="sm" onClick={pular} disabled={saving} className="text-xs text-muted-foreground">
            Pular por enquanto
          </Button>
        </div>
      </div>
    </div>
  );
}
