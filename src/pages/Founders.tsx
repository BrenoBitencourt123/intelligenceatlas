import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Zap, BookOpen, Brain, Star, Play, ArrowRight, Users } from "lucide-react";

const BENEFITS = [
  { icon: Zap, title: "Questões ilimitadas", desc: "Pratique sem limites com questões reais do ENEM" },
  { icon: BookOpen, title: "Redações com IA", desc: "Correção detalhada por competência com feedback imediato" },
  { icon: Brain, title: "Flashcards inteligentes", desc: "Revisão espaçada que se adapta ao seu ritmo" },
  { icon: Star, title: "50% para sempre", desc: "Desconto vitalício exclusivo para membros fundadores" },
];

export default function Founders() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitted, setSubmitted] = useState(false);
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
    setSubmitted(true);
  };

  const scrollToForm = () => {
    document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Inscrição confirmada!
          </h1>
          <p className="text-muted-foreground text-lg">
            Agora entre no nosso grupo exclusivo no WhatsApp para receber o cupom de 50% e todas as novidades em primeira mão.
          </p>
          <Button
            size="lg"
            className="w-full text-lg h-14 font-semibold rounded-xl"
            onClick={() => window.open("https://chat.whatsapp.com/SEU_LINK_AQUI", "_blank")}
          >
            Entrar no grupo VIP
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Apenas 20 vagas disponíveis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="px-6 pt-16 pb-12 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card mb-8">
          <Users className="w-4 h-4 text-foreground" />
          <span className="text-sm font-medium text-foreground">Apenas 20 vagas</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
          Seja um dos 20{" "}
          <span className="relative">
            Membros Fundadores
            <span className="absolute -bottom-1 left-0 w-full h-3 bg-primary/10 -z-10 rounded" />
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
          Garanta{" "}
          <span className="font-bold text-foreground">50% de desconto vitalício</span>{" "}
          no Intelligence Atlas — a plataforma de estudos inteligente para o ENEM.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
          <Button
            size="lg"
            className="text-lg h-14 px-8 font-semibold rounded-xl animate-pulse hover:animate-none"
            onClick={scrollToForm}
          >
            Quero minha vaga
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="line-through">R$ 49,90/mês</span>
          <span className="font-bold text-2xl text-foreground">R$ 24,95/mês</span>
          <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
            -50% VITALÍCIO
          </span>
        </div>
      </section>

      {/* Video Section */}
      <section className="px-6 pb-16 max-w-3xl mx-auto">
        <div className="aspect-video bg-card border border-border rounded-2xl flex items-center justify-center cursor-pointer hover:border-foreground/20 transition-colors">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
              <Play className="w-7 h-7 text-primary-foreground ml-1" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Vídeo em breve
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 pb-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">
          O que você recebe como membro fundador
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="p-6 rounded-2xl border border-border bg-card hover:border-foreground/20 transition-colors"
            >
              <b.icon className="w-6 h-6 text-foreground mb-3" />
              <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section id="form-section" className="px-6 pb-20 max-w-md mx-auto">
        <div className="p-8 rounded-2xl border border-border bg-card">
          <h2 className="text-2xl font-bold text-foreground text-center mb-2">
            Garanta sua vaga
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Preencha abaixo para entrar no grupo VIP e receber seu cupom exclusivo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
            <Input
              type="email"
              placeholder="Seu melhor e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              required
            />
            <Input
              type="tel"
              placeholder="WhatsApp (com DDD)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              maxLength={15}
              required
            />
            <Button
              type="submit"
              size="lg"
              className="w-full text-lg h-14 font-semibold rounded-xl"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Entrar no grupo VIP"}
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          Intelligence Atlas © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
