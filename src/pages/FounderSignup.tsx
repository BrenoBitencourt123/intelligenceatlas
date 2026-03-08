import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Check, Percent } from "lucide-react";
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
    const { error } = await supabase.
    from("vip_leads" as any).
    insert([
    { name: name.trim(), email: email.trim(), whatsapp: phoneClean }] as
    any);

    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }
    setStep(2);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-2xl mx-auto w-full">
        <button
          onClick={() => step === 1 ? navigate("/fundadores") : setStep(1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <span className="text-sm text-muted-foreground">
          Passo {step} de 2
        </span>
      </header>

      {/* Progress bar */}
      <div className="max-w-2xl mx-auto w-full px-6">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[hsl(25,95%,53%)] rounded-full"
            initial={{ width: "50%" }}
            animate={{ width: step === 1 ? "50%" : "100%" }}
            transition={{ duration: 0.4, ease: "easeOut" }} />
          
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <AnimatePresence mode="wait">
            {step === 1 ?
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6">
              
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[hsl(25,95%,53%/0.1)] text-[hsl(25,95%,40%)]">
                    <Percent className="w-3.5 h-3.5" />
                    50% vitalício
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Garanta sua vaga de fundador
                  </h1>
                  <p className="text-muted-foreground">
                    Preencha seus dados para receber o cupom exclusivo de 50% de desconto vitalício.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Nome</label>
                    <Input
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    required
                    className="h-12 rounded-xl" />
                  
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Seu melhor E-mail.</label>
                    <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    required
                    className="h-12 rounded-xl" />
                  
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">WhatsApp</label>
                    <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    maxLength={15}
                    required
                    className="h-12 rounded-xl" />
                  
                  </div>
                  <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl transition-all hover:brightness-110 active:scale-[0.98] bg-[hsl(25,95%,53%)] border-0"
                  disabled={loading}>
                  
                    {loading ? "Enviando..." : "Continuar"}
                    {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Seus dados estão seguros e não serão compartilhados.
                  </p>
                </form>
              </motion.div> :

            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-center">
              
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[hsl(25,95%,53%)]" />
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-[hsl(25,95%,53%)]">
                    <Check className="w-9 h-9 text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    Inscrição confirmada! 🎉
                  </h1>
                  <p className="text-muted-foreground leading-relaxed">
                    Agora entre no nosso grupo exclusivo no WhatsApp para receber seu cupom
                    de <span className="font-bold text-foreground">50% vitalício</span> e
                    todas as novidades em primeira mão.
                  </p>
                </div>

                <Button
                size="lg"
                className="w-full h-14 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl transition-all hover:brightness-110 active:scale-[0.98] bg-[hsl(25,95%,53%)] border-0"
                onClick={() =>
                window.open("https://chat.whatsapp.com/SEU_LINK_AQUI", "_blank")
                }>
                
                  Entrar no grupo VIP
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            }
          </AnimatePresence>
        </div>
      </main>
    </div>);

}