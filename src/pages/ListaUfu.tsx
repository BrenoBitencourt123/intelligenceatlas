import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackUfu } from "@/lib/ufu/track";

const META = 50;

function nomeDoCurso(slug: string | null): string {
  if (!slug) return "seu curso";
  const turnos = ["integral", "matutino", "noturno", "vespertino"];
  const parts = slug.split("-");
  const idx = parts.findIndex((p) => turnos.includes(p));
  const base = idx > 0 ? parts.slice(0, idx) : parts;
  return base
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "seu curso";
}

export default function ListaUfu() {
  const [params] = useSearchParams();
  const curso = params.get("curso");
  const nome = useMemo(() => nomeDoCurso(curso), [curso]);

  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  async function refetchCount() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("ufu_leads_count");
    if (!error && typeof data === "number") setTotal(data);
  }

  useEffect(() => {
    refetchCount();
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setEnviando(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("ufu_leads")
        .upsert(
          {
            email: email.trim().toLowerCase(),
            whatsapp: whatsapp.trim() || null,
            curso: curso ?? null,
            origem: "pseo",
          },
          { onConflict: "email", ignoreDuplicates: true },
        );
      if (error && !/duplicate|unique/i.test(error.message)) {
        throw error;
      }
      trackUfu("calc_completed", { evento: "lista_signup", curso });
      setSucesso(true);
      await refetchCount();
    } catch (err) {
      toast({
        title: "Não deu pra entrar na lista",
        description: (err as Error)?.message ?? "Tenta de novo?",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  }

  const restantes = total !== null ? Math.max(0, META - total) : null;
  const atingiuMeta = total !== null && total >= META;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/ufu" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Placar UFU
          </Link>
          {total !== null && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {total} {total === 1 ? "pessoa" : "pessoas"} já na lista
            </span>
          )}
        </div>

        <header className="space-y-2">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Placar UFU · lista de interesse
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {curso ? `Guia de folga de ${nome}` : "Guia de folga do seu curso"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Passar no corte não é vaga — a UFU classifica ~6× as vagas. O guia mostra quantos
            acertos te dão folga real em <span className="text-foreground font-medium">{nome}</span>{" "}
            e onde focar pelos pesos. E você é avisado quando abrir a pré-venda fundadora
            (20 vagas).
          </p>
        </header>

        {!sucesso ? (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={enviar} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">
                    WhatsApp <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(34) 9 9999-9999"
                    autoComplete="tel"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={enviando}>
                  {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Quero receber o guia
                </Button>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Sem spam. Você entra na lista de interesse e recebe o guia + aviso quando abrir a
                  pré-venda fundadora.
                </p>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-primary">
            <CardContent className="pt-6 space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg font-semibold">Você está na lista ✅</p>
              {atingiuMeta ? (
                <p className="text-sm text-muted-foreground">
                  As 20 vagas fundadoras já vão abrir — fique de olho no seu e-mail
                  {whatsapp ? "/WhatsApp" : ""}.
                </p>
              ) : restantes !== null ? (
                <p className="text-sm text-muted-foreground">
                  Faltam <span className="text-foreground font-semibold">{restantes}</span> para
                  abrirmos a pré-venda fundadora (20 vagas).
                </p>
              ) : null}
              <Link
                to="/ufu"
                className="inline-block text-sm text-foreground underline underline-offset-4 pt-2"
              >
                Voltar ao Placar UFU
              </Link>
            </CardContent>
          </Card>
        )}

        <footer className="text-center text-xs text-muted-foreground pb-8">
          Placar UFU · dados públicos da DIRPS/UFU. Não somos afiliados à UFU.
        </footer>
      </div>
    </div>
  );
}
