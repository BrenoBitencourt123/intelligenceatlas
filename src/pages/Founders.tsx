import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Check,
  BookOpen,
  Brain,
  Star,
  Play,
  ArrowRight,
  Trophy,
  Target,
  Sparkles,
  Zap,
  Shield,
  MessageCircle,
  X,
} from "lucide-react";

/* ─── Colors ─── */
const GREEN = {
  base: "hsl(150, 60%, 40%)",
  dark: "hsl(150, 60%, 30%)",
  light: "hsl(150, 60%, 93%)",
  text: "hsl(150, 60%, 35%)",
  glow: "hsl(150, 60%, 45%)",
};

/* ─── Slots hook (real from Stripe) ─── */
function useFounderSlots() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.functions
      .invoke("founders-slots")
      .then(({ data, error }) => {
        if (!error && data?.remaining != null) setRemaining(data.remaining);
        else setRemaining(20);
      })
      .catch(() => setRemaining(20))
      .finally(() => setLoading(false));
  }, []);

  return { remaining, loading };
}

/* ─── Data ─── */
const BENEFITS = [
  {
    icon: Target,
    title: "Estudo adaptativo",
    desc: "Questões reais do ENEM selecionadas por IA de acordo com suas fraquezas",
  },
  {
    icon: BookOpen,
    title: "Redações com IA",
    desc: "Correção detalhada por competência com feedback instantâneo",
  },
  {
    icon: Brain,
    title: "Flashcards inteligentes",
    desc: "Revisão espaçada que se adapta ao seu ritmo de aprendizado",
  },
  {
    icon: Star,
    title: "50% para sempre",
    desc: "Pague metade — hoje e em todas as renovações futuras. Sem pegadinha.",
  },
];

const FOUNDER_PERKS = [
  { icon: Zap, text: "Acesso antecipado a todas as funcionalidades" },
  { icon: MessageCircle, text: "Canal direto com os criadores da plataforma" },
  { icon: Shield, text: "Influência nas próximas features do produto" },
  { icon: Trophy, text: "Badge exclusiva de Membro Fundador" },
];

/* ─── Slots Counter ─── */
function SlotsCounter({ remaining, loading }: { remaining: number | null; loading: boolean }) {
  const display = loading ? "—" : (remaining ?? 20);
  const isUrgent = !loading && remaining !== null && remaining <= 5;

  return (
    <div
      className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-sm"
      style={{
        borderColor: isUrgent ? "hsl(0,72%,70%)" : GREEN.glow,
        backgroundColor: isUrgent ? "hsl(0,72%,97%)" : GREEN.light,
      }}
    >
      <div className="relative w-2.5 h-2.5">
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-40"
          style={{ backgroundColor: isUrgent ? "hsl(0,72%,51%)" : GREEN.base }}
        />
        <div
          className="relative w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: isUrgent ? "hsl(0,72%,51%)" : GREEN.base }}
        />
      </div>
      <span
        className="text-sm font-bold"
        style={{ color: isUrgent ? "hsl(0,72%,40%)" : GREEN.dark }}
      >
        {isUrgent ? `Últimas ${display} vagas!` : `Restam ${display} vagas`}
      </span>
    </div>
  );
}

/* ─── Success State ─── */
function SuccessState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: GREEN.base }} />
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: GREEN.base }}>
            <Check className="w-9 h-9 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Inscrição confirmada! 🎉
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Agora entre no nosso grupo exclusivo no WhatsApp para receber seu cupom
          de <span className="font-bold text-foreground">50% vitalício</span> e
          todas as novidades em primeira mão.
        </p>
        <Button
          size="lg"
          className="w-full text-lg h-14 font-semibold rounded-xl text-white"
          style={{ backgroundColor: GREEN.base }}
          onClick={() =>
            window.open("https://chat.whatsapp.com/SEU_LINK_AQUI", "_blank")
          }
        >
          Entrar no grupo VIP
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Hero Section ─── */
function HeroSection({
  remaining,
  loading,
}: {
  remaining: number | null;
  loading: boolean;
}) {
  return (
    <section className="relative px-6 pt-12 pb-16 max-w-3xl mx-auto text-center">
      <div className="relative z-10">
        {/* Slots counter */}
        <div className="mb-8">
          <SlotsCounter remaining={remaining} loading={loading} />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-5">
          Pague metade.
          <br />
          Para sempre.
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Seja um dos{" "}
          <span className="font-bold text-foreground">20 membros fundadores</span>{" "}
          do Intelligence Atlas e garanta{" "}
          <span className="font-bold" style={{ color: GREEN.text }}>
            50% de desconto vitalício
          </span>{" "}
          na plataforma de estudos inteligente para o ENEM.
        </p>
      </div>
    </section>
  );
}

/* ─── Video + CTA Section ─── */
function VideoSection({ onCTAClick }: { onCTAClick: () => void }) {
  return (
    <section className="px-6 pb-20 max-w-3xl mx-auto">
      <div className="aspect-video bg-card border border-border rounded-2xl flex items-center justify-center cursor-pointer hover:border-foreground/20 transition-all hover:shadow-lg group">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-foreground rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
            <Play className="w-8 h-8 text-background ml-1" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Vídeo em breve</p>
        </div>
      </div>

      {/* Single CTA */}
      <div className="text-center mt-8 space-y-3">
        <Button
          size="lg"
          className="text-lg h-14 px-10 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          onClick={onCTAClick}
        >
          Garantir minha vaga
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="text-sm text-muted-foreground animate-pulse">
          ⚡ Vagas preenchendo rápido
        </p>
      </div>
    </section>
  );
}

/* ─── Benefits Section ─── */
function BenefitsSection() {
  return (
    <section className="px-6 pb-20 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Tudo que você precisa para o ENEM
        </h2>
        <p className="text-muted-foreground text-lg">
          Ferramentas inteligentes que se adaptam a você
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="group p-7 rounded-2xl border border-border bg-card hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
              <b.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-1.5">{b.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Founder Perks Section (dark card like screenshot) ─── */
function FounderPerksSection() {
  return (
    <section className="px-6 pb-20 max-w-3xl mx-auto">
      <div className="p-8 sm:p-10 rounded-2xl bg-accent text-accent-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 blur-[60px]" style={{ backgroundColor: GREEN.glow }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: GREEN.base }}>
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold">Vantagens exclusivas de fundador</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FOUNDER_PERKS.map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4" style={{ color: GREEN.glow }} />
                </div>
                <span className="text-sm text-accent-foreground/80 leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Lead Modal ─── */
function LeadModal({
  open,
  onOpenChange,
  loading,
  onSubmit,
  name,
  setName,
  email,
  setEmail,
  whatsapp,
  setWhatsapp,
  remaining,
  slotsLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  whatsapp: string;
  setWhatsapp: (v: string) => void;
  remaining: number | null;
  slotsLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-accent" />

        <div className="p-6 sm:p-8">
          <DialogHeader className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mx-auto mb-3" style={{ backgroundColor: GREEN.light, color: GREEN.dark }}>
              <Sparkles className="w-4 h-4" />
              50% vitalício
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Garanta sua vaga
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha abaixo para entrar no grupo VIP e receber seu cupom exclusivo.
            </p>
            {!slotsLoading && remaining !== null && (
              <p className="mt-2 text-sm font-bold" style={{ color: GREEN.text }}>
                🔥 Restam apenas {remaining} vagas
              </p>
            )}
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              className="h-12 rounded-xl"
            />
            <Input
              type="email"
              placeholder="Seu melhor e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              required
              className="h-12 rounded-xl"
            />
            <Input
              type="tel"
              placeholder="WhatsApp (com DDD)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              maxLength={15}
              required
              className="h-12 rounded-xl"
            />
            <Button
              type="submit"
              size="lg"
              className="w-full text-lg h-14 font-bold rounded-xl text-white shadow-lg transition-all hover:shadow-xl"
              style={{ backgroundColor: GREEN.base }}
              disabled={loading}
            >
              {loading ? "Enviando..." : "Entrar no grupo VIP →"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Ao se inscrever, você receberá o cupom de 50% no grupo do WhatsApp.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Page ─── */
export default function Founders() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { remaining, loading: slotsLoading } = useFounderSlots();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !whatsapp.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Email inválido");
      return;
    }

    const phoneClean = whatsapp.replace(/\D/g, "");
    if (phoneClean.length < 10 || phoneClean.length > 13) {
      toast.error("WhatsApp inválido");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("vip_leads" as any)
      .insert([
        { name: name.trim(), email: email.trim(), whatsapp: phoneClean },
      ] as any);

    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }
    setModalOpen(false);
    setSubmitted(true);
  };

  if (submitted) return <SuccessState />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <span className="font-bold text-foreground text-lg tracking-tight">
          Intelligence Atlas
        </span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full font-semibold"
          onClick={() => window.open("/login", "_self")}
        >
          Entrar
        </Button>
      </header>

      <HeroSection remaining={remaining} loading={slotsLoading} />
      <VideoSection onCTAClick={() => setModalOpen(true)} />
      <BenefitsSection />
      <FounderPerksSection />

      {/* Footer */}
      <footer className="py-8 text-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          Intelligence Atlas © {new Date().getFullYear()}
        </p>
      </footer>

      {/* Lead capture modal */}
      <LeadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        loading={loading}
        onSubmit={handleSubmit}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        whatsapp={whatsapp}
        setWhatsapp={setWhatsapp}
        remaining={remaining}
        slotsLoading={slotsLoading}
      />
    </div>
  );
}
