import { useState } from "react";
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
  Users,
  Trophy,
  Target,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const BENEFITS = [
  {
    icon: Target,
    title: "Prática direcionada",
    desc: "Questões reais do ENEM com estudo adaptativo ao seu nível",
  },
  {
    icon: BookOpen,
    title: "Redações com IA",
    desc: "Correção detalhada por competência com feedback imediato",
  },
  {
    icon: Brain,
    title: "Flashcards inteligentes",
    desc: "Revisão espaçada que se adapta ao seu ritmo de aprendizado",
  },
  {
    icon: Star,
    title: "Desconto para sempre",
    desc: "Pague metade do preço — hoje e em todas as renovações futuras",
  },
];

const SOCIAL_PROOF = [
  "Acesso antecipado a todas as funcionalidades",
  "Canal direto com os criadores da plataforma",
  "Influência nas próximas features do produto",
  "Badge exclusiva de Membro Fundador",
];

function SuccessState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 bg-accent rounded-full animate-ping opacity-20" />
          <div className="relative w-20 h-20 bg-accent rounded-full flex items-center justify-center">
            <Check className="w-9 h-9 text-accent-foreground" />
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
          className="w-full text-lg h-14 font-semibold rounded-xl bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white"
          onClick={() =>
            window.open("https://chat.whatsapp.com/SEU_LINK_AQUI", "_blank")
          }
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

function HeroSection({ onCTAClick }: { onCTAClick: () => void }) {
  return (
    <section className="relative px-6 pt-20 pb-16 max-w-4xl mx-auto text-center overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/[0.03] blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Urgency badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card mb-10 shadow-sm">
          <div className="w-2 h-2 bg-[hsl(0,72%,51%)] rounded-full animate-pulse" />
          <Users className="w-4 h-4 text-foreground" />
          <span className="text-sm font-semibold text-foreground tracking-wide">
            Apenas 20 vagas · Oferta limitada
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05] mb-6">
          Pague metade.
          <br />
          <span className="relative inline-block mt-2">
            Para sempre.
            <svg
              className="absolute -bottom-2 left-0 w-full"
              viewBox="0 0 300 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 8C50 2 100 2 150 6C200 10 250 4 298 7"
                stroke="hsl(var(--foreground))"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.2"
              />
            </svg>
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Seja um dos <span className="font-bold text-foreground">20 membros fundadores</span> do
          Intelligence Atlas e garanta{" "}
          <span className="font-bold text-foreground">50% de desconto vitalício</span>{" "}
          na plataforma de estudos inteligente para o ENEM.
        </p>

        {/* Giant 50% visual */}
        <div className="relative inline-flex flex-col items-center mb-12">
          <div className="text-[120px] sm:text-[160px] md:text-[200px] font-black text-foreground leading-none tracking-tighter select-none">
            50<span className="text-[60px] sm:text-[80px] md:text-[100px] align-top">%</span>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <span className="inline-block bg-accent text-accent-foreground text-sm sm:text-base font-bold px-6 py-2 rounded-full tracking-wider uppercase">
              Desconto vitalício
            </span>
          </div>
        </div>

        <div className="pt-4">
          <Button
            size="lg"
            className="text-lg sm:text-xl h-16 px-10 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={onCTAClick}
          >
            Garantir minha vaga
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <ChevronDown className="w-4 h-4 animate-bounce" />
            Vagas preenchendo rápido
          </p>
        </div>
      </div>
    </section>
  );
}

function VideoSection({ onCTAClick }: { onCTAClick: () => void }) {
  return (
    <section className="px-6 pb-20 max-w-3xl mx-auto">
      <div className="aspect-video bg-card border border-border rounded-2xl flex items-center justify-center cursor-pointer hover:border-foreground/20 transition-all hover:shadow-lg group">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-accent-foreground ml-1" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Vídeo em breve
          </p>
        </div>
      </div>
      {/* CTA below video */}
      <div className="text-center mt-8">
        <Button
          size="lg"
          className="text-lg h-14 px-8 font-bold rounded-xl"
          onClick={onCTAClick}
        >
          Quero ser membro fundador
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </section>
  );
}

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
        {BENEFITS.map((b, i) => (
          <div
            key={b.title}
            className="group p-7 rounded-2xl border border-border bg-card hover:border-foreground/20 hover:shadow-md transition-all"
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

function SocialProofSection() {
  return (
    <section className="px-6 pb-20 max-w-3xl mx-auto">
      <div className="p-8 sm:p-10 rounded-2xl border border-border bg-accent text-accent-foreground">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6" />
          <h3 className="text-xl font-bold">Vantagens exclusivas de fundador</h3>
        </div>
        <ul className="space-y-4">
          {SOCIAL_PROOF.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-accent-foreground/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-accent-foreground/90">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function LeadForm({
  loading,
  onSubmit,
  name,
  setName,
  email,
  setEmail,
  whatsapp,
  setWhatsapp,
}: {
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  whatsapp: string;
  setWhatsapp: (v: string) => void;
}) {
  return (
    <section id="form-section" className="px-6 pb-24 max-w-md mx-auto">
      <div className="p-8 sm:p-10 rounded-2xl border border-border bg-card shadow-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            50% vitalício
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Garanta sua vaga
          </h2>
          <p className="text-sm text-muted-foreground">
            Preencha abaixo para entrar no grupo VIP e receber seu cupom
            exclusivo.
          </p>
        </div>

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
            className="w-full text-lg h-14 font-bold rounded-xl"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Entrar no grupo VIP"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Ao se inscrever, você receberá o cupom de 50% no grupo do WhatsApp.
          </p>
        </form>
      </div>
    </section>
  );
}

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
    document
      .getElementById("form-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  if (submitted) return <SuccessState />;

  return (
    <div className="min-h-screen bg-background">
      <HeroSection onCTAClick={scrollToForm} />
      <VideoSection onCTAClick={scrollToForm} />
      <BenefitsSection />
      <SocialProofSection />
      <LeadForm
        loading={loading}
        onSubmit={handleSubmit}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        whatsapp={whatsapp}
        setWhatsapp={setWhatsapp}
      />

      {/* Footer */}
      <footer className="py-8 text-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          Intelligence Atlas © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
