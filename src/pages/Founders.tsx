import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

/* ─── Dark theme colors (inline, isolated to this page) ─── */
const C = {
  bg: "hsl(160, 15%, 12%)",
  bgCard: "hsl(160, 12%, 16%)",
  bgCardHover: "hsl(160, 12%, 19%)",
  border: "hsl(160, 10%, 22%)",
  text: "hsl(0, 0%, 94%)",
  textMuted: "hsl(160, 8%, 55%)",
  green: "hsl(150, 60%, 45%)",
  greenDark: "hsl(150, 60%, 35%)",
  greenLight: "hsl(150, 60%, 93%)",
  greenGlow: "hsl(150, 60%, 50%)",
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
      className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border"
      style={{
        borderColor: isUrgent ? "hsl(0,72%,50%)" : C.green,
        backgroundColor: isUrgent ? "hsla(0,72%,50%,0.1)" : "hsla(150,60%,45%,0.1)",
      }}
    >
      <div className="relative w-2.5 h-2.5">
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-40"
          style={{ backgroundColor: isUrgent ? "hsl(0,72%,51%)" : C.green }}
        />
        <div
          className="relative w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: isUrgent ? "hsl(0,72%,51%)" : C.green }}
        />
      </div>
      <span
        className="text-sm font-bold"
        style={{ color: isUrgent ? "hsl(0,72%,65%)" : C.green }}
      >
        {isUrgent ? `Últimas ${display} vagas!` : `Restam ${display} vagas`}
      </span>
    </div>
  );
}

/* ─── Success State ─── */
function SuccessState() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: C.bg }}>
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: C.green }} />
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: C.green }}>
            <Check className="w-9 h-9 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: C.text }}>
          Inscrição confirmada! 🎉
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: C.textMuted }}>
          Agora entre no nosso grupo exclusivo no WhatsApp para receber seu cupom
          de <span className="font-bold" style={{ color: C.text }}>50% vitalício</span> e
          todas as novidades em primeira mão.
        </p>
        <Button
          size="lg"
          className="w-full text-lg h-14 font-semibold rounded-xl text-white hover:opacity-90"
          style={{ backgroundColor: C.green }}
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
      {/* Subtle green glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[150px] pointer-events-none opacity-15"
        style={{ backgroundColor: C.green }}
      />

      <div className="relative z-10">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <SlotsCounter remaining={remaining} loading={loading} />
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5"
          style={{ color: C.text }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Pague metade.
          <br />
          Para sempre<span style={{ color: C.green }}>.</span>
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
          style={{ color: C.textMuted }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Seja um dos{" "}
          <span className="font-bold" style={{ color: C.text }}>20 membros fundadores</span>{" "}
          do Intelligence Atlas e garanta{" "}
          <span className="font-bold" style={{ color: C.green }}>
            50% de desconto vitalício
          </span>{" "}
          na plataforma de estudos inteligente para o ENEM.
        </motion.p>
      </div>
    </section>
  );
}

/* ─── Video + CTA Section ─── */
function VideoSection({ onCTAClick }: { onCTAClick: () => void }) {
  return (
    <section className="px-6 pb-20 max-w-3xl mx-auto">
      <motion.div
        className="aspect-video rounded-2xl flex items-center justify-center cursor-pointer transition-all hover:shadow-xl group border"
        style={{ backgroundColor: C.bgCard, borderColor: C.border }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center space-y-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"
            style={{ backgroundColor: C.green }}
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
          <p className="text-sm font-medium" style={{ color: C.textMuted }}>Vídeo em breve</p>
        </div>
      </motion.div>

      <div className="text-center mt-8 space-y-3">
        <Button
          size="lg"
          className="text-lg h-14 px-10 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-white border-0"
          style={{ backgroundColor: C.green }}
          onClick={onCTAClick}
        >
          Garantir minha vaga
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="text-sm animate-pulse" style={{ color: C.textMuted }}>
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
        <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: C.text }}>
          Tudo que você precisa para o ENEM
        </h2>
        <p className="text-lg" style={{ color: C.textMuted }}>
          Ferramentas inteligentes que se adaptam a você
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {BENEFITS.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
          <div
            key={b.title}
            className="group p-7 rounded-2xl border transition-all hover:-translate-y-0.5"
            style={{
              backgroundColor: C.bgCard,
              borderColor: C.border,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = C.bgCardHover;
              e.currentTarget.style.borderColor = C.green;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = C.bgCard;
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "hsla(150,60%,45%,0.12)" }}
            >
              <b.icon className="w-6 h-6" style={{ color: C.green }} />
            </div>
            <h3 className="font-bold text-lg mb-1.5" style={{ color: C.text }}>{b.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>{b.desc}</p>
          </div>
          </motion.div>
      </div>
    </section>
  );
}

/* ─── Founder Perks Section ─── */
function FounderPerksSection() {
  return (
    <section className="px-6 pb-20 max-w-3xl mx-auto">
      <div
        className="p-8 sm:p-10 rounded-2xl relative overflow-hidden border"
        style={{ backgroundColor: C.bgCard, borderColor: C.border }}
      >
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 blur-[60px]"
          style={{ backgroundColor: C.greenGlow }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.green }}>
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold" style={{ color: C.text }}>
              Vantagens exclusivas de fundador
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FOUNDER_PERKS.map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div
                  className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "hsla(150,60%,45%,0.12)" }}
                >
                  <item.icon className="w-4 h-4" style={{ color: C.green }} />
                </div>
                <span className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
                  {item.text}
                </span>
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
        <div className="h-1.5 w-full" style={{ backgroundColor: C.green }} />

        <div className="p-6 sm:p-8">
          <DialogHeader className="text-center mb-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mx-auto mb-3"
              style={{ backgroundColor: C.greenLight, color: C.greenDark }}
            >
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
              <p className="mt-2 text-sm font-bold" style={{ color: C.greenDark }}>
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
              className="w-full text-lg h-14 font-bold rounded-xl text-white shadow-lg transition-all hover:shadow-xl hover:opacity-90"
              style={{ backgroundColor: C.green }}
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
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <span className="font-bold text-lg tracking-tight" style={{ color: C.text }}>
          Intelligence Atlas
        </span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full font-semibold border-white/20 text-white/80 hover:text-white hover:bg-white/10 bg-transparent"
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
      <footer className="py-8 text-center border-t" style={{ borderColor: C.border }}>
        <p className="text-sm" style={{ color: C.textMuted }}>
          Intelligence Atlas © {new Date().getFullYear()}
        </p>
      </footer>

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
