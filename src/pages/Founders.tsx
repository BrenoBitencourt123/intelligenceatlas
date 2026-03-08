import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

/* ─── Slots hook (real from Stripe) ─── */
function useFounderSlots() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.functions
      .invoke("founders-slots")
      .then(({ data, error }) => {
        if (!error && data?.remaining != null) setRemaining(data.remaining);
        else setRemaining(20); // fallback
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
    color: "hsl(220, 70%, 55%)",
    bgColor: "hsl(220, 70%, 95%)",
  },
  {
    icon: BookOpen,
    title: "Redações com IA",
    desc: "Correção detalhada por competência com feedback instantâneo",
    color: "hsl(262, 60%, 55%)",
    bgColor: "hsl(262, 60%, 95%)",
  },
  {
    icon: Brain,
    title: "Flashcards inteligentes",
    desc: "Revisão espaçada que se adapta ao seu ritmo de aprendizado",
    color: "hsl(150, 60%, 40%)",
    bgColor: "hsl(150, 60%, 93%)",
  },
  {
    icon: Star,
    title: "50% para sempre",
    desc: "Pague metade — hoje e em todas as renovações futuras. Sem pegadinha.",
    color: "hsl(35, 90%, 50%)",
    bgColor: "hsl(35, 90%, 93%)",
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
    <div className={`
      inline-flex items-center gap-3 px-6 py-3 rounded-2xl border-2 
      ${isUrgent 
        ? "border-[hsl(0,72%,60%)] bg-[hsl(0,72%,97%)]" 
        : "border-[hsl(150,60%,45%)] bg-[hsl(150,60%,96%)]"
      }
      shadow-sm
    `}>
      <div className={`
        relative flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg
        ${isUrgent 
          ? "bg-[hsl(0,72%,51%)] text-white" 
          : "bg-[hsl(150,60%,40%)] text-white"
        }
      `}>
        {!loading && <div className="absolute inset-0 rounded-xl animate-ping opacity-20 bg-current" />}
        <span className="relative z-10">{display}</span>
      </div>
      <div className="text-left">
        <p className={`text-sm font-bold ${isUrgent ? "text-[hsl(0,72%,40%)]" : "text-[hsl(150,60%,30%)]"}`}>
          {isUrgent ? "Últimas vagas!" : "Vagas restantes"}
        </p>
        <p className="text-xs text-muted-foreground">de 20 disponíveis</p>
      </div>
    </div>
  );
}

/* ─── Success State ─── */
function SuccessState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 bg-[hsl(150,60%,45%)] rounded-full animate-ping opacity-20" />
          <div className="relative w-20 h-20 bg-[hsl(150,60%,45%)] rounded-full flex items-center justify-center">
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
          className="w-full text-lg h-14 font-semibold rounded-xl bg-[hsl(150,60%,40%)] hover:bg-[hsl(150,60%,35%)] text-white"
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
  onCTAClick,
  remaining,
  loading,
}: {
  onCTAClick: () => void;
  remaining: number | null;
  loading: boolean;
}) {
  return (
    <section className="relative px-6 pt-16 pb-20 max-w-5xl mx-auto text-center overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[hsl(150,60%,85%)] opacity-30 blur-[120px] pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(220,70%,90%)] opacity-30 blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        {/* Slots counter - prominent */}
        <div className="mb-10">
          <SlotsCounter remaining={remaining} loading={loading} />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05] mb-6">
          Pague metade.
          <br />
          <span className="relative inline-block mt-2">
            Para sempre
            <span className="text-[hsl(150,60%,40%)]">.</span>
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
          Seja um dos{" "}
          <span className="font-bold text-foreground">20 membros fundadores</span>{" "}
          do Intelligence Atlas e garante{" "}
          <span className="font-bold text-[hsl(150,60%,35%)]">
            50% de desconto vitalício
          </span>{" "}
          na plataforma de estudos inteligente para o ENEM.
        </p>

        {/* Giant 50% with gradient */}
        <div className="relative inline-flex flex-col items-center mb-14">
          <div
            className="text-[130px] sm:text-[180px] md:text-[220px] font-black leading-none tracking-tighter select-none"
            style={{
              background: "linear-gradient(135deg, hsl(150,60%,40%) 0%, hsl(220,70%,50%) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            50<span className="text-[65px] sm:text-[90px] md:text-[110px] align-top">%</span>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <span className="inline-block bg-[hsl(150,60%,40%)] text-white text-sm sm:text-base font-bold px-7 py-2.5 rounded-full tracking-wider uppercase shadow-lg shadow-[hsl(150,60%,40%)]/20">
              Desconto vitalício
            </span>
          </div>
        </div>

        <div className="pt-6">
          <Button
            size="lg"
            className="text-lg sm:text-xl h-16 px-12 font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] bg-foreground text-background hover:bg-foreground/90"
            onClick={onCTAClick}
          >
            Garantir minha vaga
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">
            ⚡ Vagas preenchendo rápido
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Video Section ─── */
function VideoSection({ onCTAClick }: { onCTAClick: () => void }) {
  return (
    <section className="px-6 pb-20 max-w-3xl mx-auto">
      <div className="aspect-video bg-gradient-to-br from-[hsl(220,20%,96%)] to-[hsl(220,20%,92%)] border border-border rounded-2xl flex items-center justify-center cursor-pointer hover:border-foreground/20 transition-all hover:shadow-xl group overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(150,60%,40%)]/5 to-[hsl(220,70%,55%)]/5" />
        <div className="relative text-center space-y-3">
          <div className="w-20 h-20 bg-foreground rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
            <Play className="w-8 h-8 text-background ml-1" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Vídeo em breve</p>
        </div>
      </div>
      <div className="text-center mt-8">
        <Button
          size="lg"
          className="text-lg h-14 px-8 font-bold rounded-xl bg-foreground text-background hover:bg-foreground/90"
          onClick={onCTAClick}
        >
          Quero ser membro fundador
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
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
            className="group p-7 rounded-2xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
              style={{ backgroundColor: b.bgColor, color: b.color }}
            >
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

/* ─── Founder Perks Section ─── */
function FounderPerksSection() {
  return (
    <section className="px-6 pb-20 max-w-3xl mx-auto">
      <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-foreground to-[hsl(220,20%,20%)] text-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[hsl(150,60%,40%)] opacity-10 blur-[60px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[hsl(150,60%,40%)] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold">Vantagens exclusivas de fundador</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FOUNDER_PERKS.map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-[hsl(150,60%,60%)]" />
                </div>
                <span className="text-sm text-white/80 leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Lead Form ─── */
function LeadForm({
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
    <section id="form-section" className="px-6 pb-24 max-w-md mx-auto">
      <div className="p-8 sm:p-10 rounded-2xl border-2 border-[hsl(150,60%,45%)]/30 bg-card shadow-xl shadow-[hsl(150,60%,45%)]/5 relative overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(150,60%,45%)] to-[hsl(220,70%,55%)]" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(150,60%,93%)] text-[hsl(150,60%,30%)] text-sm font-bold mb-4">
            <Sparkles className="w-4 h-4" />
            50% vitalício
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Garanta sua vaga
          </h2>
          <p className="text-sm text-muted-foreground">
            Preencha abaixo para entrar no grupo VIP e receber seu cupom exclusivo.
          </p>
          {!slotsLoading && remaining !== null && (
            <p className="mt-3 text-sm font-bold text-[hsl(150,60%,35%)]">
              🔥 Restam apenas {remaining} vagas
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
            className="h-12 rounded-xl border-border focus:border-[hsl(150,60%,45%)] focus:ring-[hsl(150,60%,45%)]"
          />
          <Input
            type="email"
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            required
            className="h-12 rounded-xl border-border focus:border-[hsl(150,60%,45%)] focus:ring-[hsl(150,60%,45%)]"
          />
          <Input
            type="tel"
            placeholder="WhatsApp (com DDD)"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            maxLength={15}
            required
            className="h-12 rounded-xl border-border focus:border-[hsl(150,60%,45%)] focus:ring-[hsl(150,60%,45%)]"
          />
          <Button
            type="submit"
            size="lg"
            className="w-full text-lg h-14 font-bold rounded-xl bg-[hsl(150,60%,40%)] hover:bg-[hsl(150,60%,35%)] text-white shadow-lg shadow-[hsl(150,60%,40%)]/20 transition-all hover:shadow-xl"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Entrar no grupo VIP →"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Ao se inscrever, você receberá o cupom de 50% no grupo do WhatsApp.
          </p>
        </form>
      </div>
    </section>
  );
}

/* ─── Page ─── */
export default function Founders() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setSubmitted(true);
  };

  const scrollToForm = () => {
    document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  if (submitted) return <SuccessState />;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
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

      <HeroSection onCTAClick={scrollToForm} remaining={remaining} loading={slotsLoading} />
      <VideoSection onCTAClick={scrollToForm} />
      <BenefitsSection />
      <FounderPerksSection />
      <LeadForm
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

      <footer className="py-8 text-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          Intelligence Atlas © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
