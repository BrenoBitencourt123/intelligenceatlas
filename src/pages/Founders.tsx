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
  BarChart3,
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
        else setRemaining(20);
      })
      .catch(() => setRemaining(20))
      .finally(() => setLoading(false));
  }, []);

  return { remaining, loading };
}

const CHECKS = [
  "+2000 questões reais do ENEM",
  "Plano de estudo inteligente",
  "Correção estruturada de redação",
];

/* ─── Success State ─── */
function SuccessState() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[hsl(142,71%,45%)]" />
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-[hsl(142,71%,45%)]">
            <Check className="w-9 h-9 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Inscrição confirmada! 🎉
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Agora entre no nosso grupo exclusivo no WhatsApp para receber seu cupom
          de <span className="font-bold text-foreground">50% vitalício</span> e
          todas as novidades em primeira mão.
        </p>
        <Button
          size="lg"
          className="w-full text-lg h-14 font-semibold rounded-xl text-white hover:opacity-90 bg-[hsl(142,71%,45%)]"
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
        <div className="h-1.5 w-full bg-[hsl(142,71%,45%)]" />

        <div className="p-6 sm:p-8">
          <DialogHeader className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mx-auto mb-3 bg-[hsl(142,71%,93%)] text-[hsl(142,71%,30%)]">
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
              <p className="mt-2 text-sm font-bold text-[hsl(142,71%,30%)]">
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
              className="w-full text-lg h-14 font-bold rounded-xl text-white shadow-lg transition-all hover:shadow-xl hover:opacity-90 bg-[hsl(142,71%,45%)]"
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <span className="font-bold text-lg tracking-tight text-foreground">
          Atlas
        </span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full font-medium"
          onClick={() => window.open("/login", "_self")}
        >
          Entrar
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center px-6 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto w-full space-y-8">

          {/* Eyebrow */}
          <motion.p
            className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Treine com as próprias provas do ENEM
          </motion.p>

          {/* Headline */}
          <motion.h1
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-[1.12] text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            O jeito mais inteligente de estudar para o ENEM.
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            O Atlas analisa seu desempenho nas questões do ENEM e mostra exatamente o que estudar para alcançar{" "}
            <span className="font-semibold text-foreground">700+ ou 900+ pontos</span>.
          </motion.p>

          {/* Discount */}
          <motion.p
            className="text-base sm:text-lg font-semibold text-[hsl(142,71%,45%)]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            🔥 R$24,95/mês para sempre — membros fundadores
          </motion.p>

          {/* Video placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative aspect-video rounded-2xl border bg-card shadow-card overflow-hidden flex items-center justify-center cursor-pointer group">
              <div className="absolute inset-0 bg-foreground/[0.02] group-hover:bg-foreground/[0.04] transition-colors" />
              <div className="text-center space-y-3 relative z-10">
                <div className="w-16 h-16 rounded-full bg-[hsl(142,71%,45%)] flex items-center justify-center mx-auto shadow-lg group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Veja como o Atlas funciona
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              size="lg"
              className="h-14 px-10 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl transition-all hover:brightness-110 active:scale-[0.98] bg-[hsl(142,71%,45%)] border-0"
              onClick={() => setModalOpen(true)}
            >
              Começar agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          {/* Checkmarks */}
          <motion.div
            className="flex flex-wrap gap-x-6 gap-y-2 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {CHECKS.map((text, i) => (
              <motion.div
                key={text}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.45 + i * 0.08 }}
              >
                <div className="w-5 h-5 rounded-full bg-[hsl(142,71%,45%)] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="text-sm text-muted-foreground">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t">
        <p className="text-sm text-muted-foreground">
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
