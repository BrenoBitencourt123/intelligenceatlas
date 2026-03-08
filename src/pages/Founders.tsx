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
  ArrowRight,
  Sparkles,
  Rocket,
  BarChart3,
  BookOpen,
  BrainCircuit,
} from "lucide-react";

/* ─── Dark theme colors (inline, isolated to this page) ─── */
const C = {
  bg: "hsl(160, 15%, 12%)",
  bgCard: "hsl(160, 12%, 16%)",
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

const CHECKS = [
  { icon: BookOpen, text: "Questões reais do ENEM" },
  { icon: BrainCircuit, text: "Plano de estudo inteligente" },
  { icon: BarChart3, text: "Análise de desempenho" },
];

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full">
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

      {/* Main content — single centered section */}
      <main className="flex-1 flex items-center justify-center px-6 py-10 sm:py-16">
        <div className="max-w-2xl w-full text-center space-y-6 relative">

          {/* Floating promotional badges */}
          <motion.div
            className="absolute -top-2 -right-4 sm:right-4 z-20"
            initial={{ opacity: 0, scale: 0, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 12 }}
            transition={{ duration: 0.6, delay: 0.8, type: "spring", stiffness: 200 }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div
                className="px-4 py-2 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-xl"
                style={{ backgroundColor: C.green }}
              >
                <span className="block text-[10px] sm:text-xs opacity-80 font-medium">DESCONTO DE</span>
                <span className="text-lg sm:text-xl leading-none">50% OFF</span>
              </div>
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                style={{ backgroundColor: C.green }}
              />
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute top-32 -left-4 sm:left-0 z-20"
            initial={{ opacity: 0, scale: 0, rotate: 15 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            transition={{ duration: 0.6, delay: 1.1, type: "spring", stiffness: 200 }}
          >
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [-8, -5, -8] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div
                className="px-3 py-1.5 rounded-xl text-white font-bold text-[10px] sm:text-xs shadow-lg"
                style={{ backgroundColor: "hsl(150, 60%, 38%)" }}
              >
                🎉 VITALÍCIO!
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-48 -right-2 sm:right-8 z-20"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.3, type: "spring" }}
          >
            <motion.div
              animate={{ y: [0, -5, 0], rotate: [5, 8, 5] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div
                className="px-3 py-1.5 rounded-xl font-bold text-[10px] sm:text-xs shadow-lg border"
                style={{
                  backgroundColor: "hsla(150,60%,45%,0.15)",
                  borderColor: C.green,
                  color: C.green,
                }}
              >
                ⚡ VAGAS ACABANDO
              </div>
            </motion.div>
          </motion.div>

          {/* Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold"
              style={{
                borderColor: C.green,
                backgroundColor: "hsla(150,60%,45%,0.1)",
                color: C.green,
              }}
            >
              <Rocket className="w-3.5 h-3.5" />
              Vagas limitadas para membros fundadores
            </div>
          </motion.div>

          {/* Headline — smaller */}
          <motion.h1
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-[1.15]"
            style={{ color: C.text }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            O jeito mais inteligente de estudar para o ENEM<span style={{ color: C.green }}>.</span>
          </motion.h1>

          {/* Description — smaller */}
          <motion.div
            className="space-y-3 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: C.textMuted }}>
              O Atlas analisa seu desempenho nas próprias questões do ENEM e mostra exatamente o que estudar para alcançar{" "}
              <span className="font-bold" style={{ color: C.text }}>900+ pontos</span>.
            </p>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: C.textMuted }}>
              Os primeiros membros fundadores recebem{" "}
              <span className="font-bold" style={{ color: C.green }}>50% de desconto vitalício</span>.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              size="lg"
              className="text-base h-12 px-10 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-white border-0"
              style={{ backgroundColor: C.green }}
              onClick={() => setModalOpen(true)}
            >
              Começar agora
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>

          {/* Checkmarks */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            {CHECKS.map((item) => (
              <div key={item.text} className="flex items-center gap-1.5">
                <item.icon className="w-3.5 h-3.5" style={{ color: C.green }} />
                <span className="text-xs sm:text-sm font-medium" style={{ color: C.textMuted }}>
                  {item.text}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Dashboard mockup placeholder */}
          <motion.div
            className="mt-2 aspect-[16/9] rounded-2xl border flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: C.bgCard, borderColor: C.border }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
          >
            {/* Animated glow inside */}
            <motion.div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 30% 50%, ${C.green} 0%, transparent 60%)`,
              }}
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="text-center space-y-2 relative z-10">
              <motion.div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{ backgroundColor: "hsla(150,60%,45%,0.12)" }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <BarChart3 className="w-7 h-7" style={{ color: C.green }} />
              </motion.div>
              <p className="text-xs font-medium" style={{ color: C.textMuted }}>
                Dashboard do Atlas — em breve
              </p>
            </div>
          </motion.div>
        </div>
      </main>

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
