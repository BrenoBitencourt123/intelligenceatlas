import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Lock, Target, Play, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Trilha da folga UFU + simulados. Só quem tem Passe UFU ativo entra.
// V1: mostra 3 simulados mockados baseados nas questões do diagnóstico
// (motor de sessão vem em iteração seguinte, junto com a curadoria completa).
export default function TrilhaUfu() {
  const { user, loading } = useAuth();
  const [passeAtivo, setPasseAtivo] = useState<boolean | null>(null);
  const [totalQuestoes, setTotalQuestoes] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select("ufu_passe_ativo, ufu_passe_expira_em" as any)
        .eq("id", user.id)
        .maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = data as any;
      const hoje = new Date().toISOString().slice(0, 10);
      const valido = !!p?.ufu_passe_ativo && (!p.ufu_passe_expira_em || p.ufu_passe_expira_em >= hoje);
      setPasseAtivo(valido);
    })();
  }, [user?.id]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("ufu_diagnostico_questoes")
      .select("id", { count: "exact", head: true })
      .eq("ativo", true)
      .then(({ count }: { count: number | null }) => setTotalQuestoes(count));
  }, []);

  if (loading || passeAtivo === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!user) return <Navigate to="/login?next=/ufu/trilha" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/hoje" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <span className="text-xs font-medium text-muted-foreground">Trilha da vaga · UFU</span>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-10 space-y-8">
        <section>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-primary/10 text-primary rounded-full">
            <Target className="h-3 w-3" /> Trilha até a prova
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3">
            Simulados UFU + prática dirigida.
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Sequência curta focada nos temas que caem: você chega no dia da prova
            calibrado pra rubrica DIRPS e pra prova objetiva.
          </p>
        </section>

        {!passeAtivo ? (
          <section className="rounded-2xl border-2 border-primary bg-primary/5 p-8 text-center space-y-4">
            <Lock className="h-10 w-10 mx-auto text-primary" />
            <h2 className="text-xl font-bold">Precisa do Passe UFU pra abrir a trilha</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              R$ 149 pagamento único, libera corretor ilimitado + trilha + simulados até a prova.
            </p>
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/ufu/passe">Ver o Passe UFU</Link>
            </Button>
          </section>
        ) : (
          <section className="space-y-4">
            {[
              { titulo: "Simulado UFU · Bloco 1", desc: "20 questões objetivas — Humanas e Linguagens (60 min)" },
              { titulo: "Simulado UFU · Bloco 2", desc: "20 questões objetivas — Natureza e Matemática (60 min)" },
              { titulo: "Simulado UFU · Reta final", desc: "Simulado completo com redação DIRPS (5h30)" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Play className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{s.titulo}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
                <Button variant="outline" className="rounded-lg" disabled>
                  Em breve
                </Button>
              </div>
            ))}
            {totalQuestoes !== null && totalQuestoes < 60 && (
              <p className="text-xs text-muted-foreground flex items-center gap-2 pt-2">
                <Sparkles className="h-3 w-3" />
                Estamos ampliando o banco UFU. Simulados abrem assim que atingir 60 questões (hoje: {totalQuestoes}).
              </p>
            )}
            <div className="pt-2">
              <Button asChild variant="ghost" className="rounded-xl">
                <Link to="/redacao-ufu">Enquanto isso, treinar redação →</Link>
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
