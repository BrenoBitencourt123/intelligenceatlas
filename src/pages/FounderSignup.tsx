import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FounderSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);

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
      .insert([{ name: name.trim(), email: email.trim(), whatsapp: phoneClean }] as any);

    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between px-6 py-5 max-w-lg mx-auto w-full">
        <button
          onClick={() => (step === 1 ? navigate("/fundadores") : setStep(1))}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <span className="text-sm font-bold tracking-tight text-foreground">
          Atlas
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {step}/2
        </span>
      </header>

      {/* ─── Progress ─── */}
      <div className="max-w-lg mx-auto w-full px-6">
        <div className="h-0.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            initial={{ width: "50%" }}
            animate={{ width: step === 1 ? "50%" : "100%" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ─── Content ─── */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
                className="space-y-8"
              >
                {/* Header text */}
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground">
                    Membro Fundador · 50% off vitalício
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                    Garanta sua vaga
                  </h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Preencha seus dados para receber o cupom exclusivo de 50%
                    de desconto vitalício no Atlas.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Nome completo
                    </label>
                    <Input
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                      required
                      className="h-12 rounded-xl bg-card border-border focus-visible:ring-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      E-mail
                    </label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={255}
                      required
                      className="h-12 rounded-xl bg-card border-border focus-visible:ring-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      WhatsApp
                    </label>
                    <Input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      maxLength={15}
                      required
                      className="h-12 rounded-xl bg-card border-border focus-visible:ring-foreground"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base font-bold rounded-xl bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98] transition-transform"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Continuar"}
                    {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Seus dados estão seguros e não serão compartilhados.
                  </p>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
                className="space-y-8 text-center"
              >
                {/* Success icon */}
                <div className="mx-auto w-16 h-16 rounded-full bg-foreground flex items-center justify-center">
                  <Check className="w-8 h-8 text-background" />
                </div>

                {/* Text */}
                <div className="space-y-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Inscrição confirmada!
                  </h1>
                  <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Agora entre no nosso grupo exclusivo no WhatsApp para
                    receber seu cupom de{" "}
                    <span className="font-semibold text-foreground">
                      50% vitalício
                    </span>{" "}
                    e todas as novidades em primeira mão.
                  </p>
                </div>

                {/* CTA */}
                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full h-12 text-base font-bold rounded-xl bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98] transition-transform"
                    onClick={() =>
                      window.open(
                        "https://chat.whatsapp.com/LINK_DO_GRUPO_VIP",
                        "_blank"
                      )
                    }
                  >
                    Entrar no grupo VIP
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <button
                    onClick={() => navigate("/hoje")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                  >
                    Ir para o Atlas
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
