import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { trackUfu } from "@/lib/ufu/track";

// Card "meu placar subiu" — 1080x1350 (formato Instagram Stories/Reels).
// Renderiza em <canvas>, exporta como PNG, tenta Web Share API primeiro
// e cai pra download manual. Sem cupom nesta fase.

interface Props {
  nota: number;             // 0-100
  areaFraca: string;        // "Matemática" etc.
  nome?: string;            // opcional — sem nome renderiza "candidato UFU"
}

const W = 1080;
const H = 1350;

export function PlacarShareCard({ nota, areaFraca, nome }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gerando, setGerando] = useState(false);

  useEffect(() => { desenhar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [nota, areaFraca, nome]);


  function desenhar(): HTMLCanvasElement | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Fundo
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // Grid sutil
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Badge topo
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 28px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PLACAR UFU 2026", W / 2, 140);

    // Divisor
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath(); ctx.moveTo(W / 2 - 80, 175); ctx.lineTo(W / 2 + 80, 175); ctx.stroke();

    // Nota gigante
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 360px system-ui, -apple-system, sans-serif";
    ctx.fillText(String(nota), W / 2, 620);

    // /100
    ctx.font = "600 64px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("/100", W / 2, 700);

    // Linha zona
    const zona = nota >= 70 ? "ZONA VERDE" : nota >= 50 ? "ZONA AMARELA" : "ZONA VERMELHA";
    const zonaColor = nota >= 70 ? "#22c55e" : nota >= 50 ? "#eab308" : "#ef4444";
    ctx.fillStyle = zonaColor;
    ctx.font = "700 44px system-ui, -apple-system, sans-serif";
    ctx.fillText(zona, W / 2, 800);

    // Área fraca
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "500 34px system-ui, -apple-system, sans-serif";
    ctx.fillText("meu ponto pra subir:", W / 2, 920);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 52px system-ui, -apple-system, sans-serif";
    ctx.fillText(areaFraca, W / 2, 985);

    // Nome (opcional)
    if (nome) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "500 32px system-ui, -apple-system, sans-serif";
      ctx.fillText(`— ${nome}`, W / 2, 1080);
    }

    // Rodapé
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "500 26px system-ui, -apple-system, sans-serif";
    ctx.fillText("faça o seu em inteligenciatlas.com/ufu", W / 2, 1260);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 32px system-ui, -apple-system, sans-serif";
    ctx.fillText("Inteligência Atlas", W / 2, 1220);

    return canvas;
  }

  async function toBlob(): Promise<Blob | null> {
    const canvas = desenhar();
    if (!canvas) return null;
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  }

  async function baixar() {
    setGerando(true);
    try {
      const blob = await toBlob();
      if (!blob) throw new Error("Falha ao gerar imagem");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `placar-ufu-${nota}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      trackUfu("card_downloaded", { nota });
    } catch (e) {
      toast({ title: "Não deu pra baixar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setGerando(false);
    }
  }

  async function compartilhar() {
    setGerando(true);
    try {
      const blob = await toBlob();
      if (!blob) throw new Error("Falha ao gerar imagem");
      const file = new File([blob], `placar-ufu-${nota}.png`, { type: "image/png" });
      trackUfu("card_generated", { nota });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: "Meu placar UFU",
          text: `Meu placar UFU: ${nota}/100. Faz o seu em inteligenciatlas.com/ufu`,
        });
        trackUfu("card_shared", { nota });
      } else {
        await baixar();
      }
    } catch (e) {
      const msg = (e as Error).message;
      if (!/abort/i.test(msg)) {
        toast({ title: "Não deu pra compartilhar", description: msg, variant: "destructive" });
      }
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="font-semibold text-sm">Mostra pro time — meu placar subiu.</p>
      </div>
      <canvas ref={canvasRef} className="w-full max-w-xs mx-auto rounded-lg border border-border" />
      <div className="flex gap-2">
        <Button className="flex-1 rounded-xl" onClick={compartilhar} disabled={gerando}>
          <Share2 className="h-4 w-4" /> Compartilhar
        </Button>
        <Button variant="outline" className="flex-1 rounded-xl" onClick={baixar} disabled={gerando}>
          <Download className="h-4 w-4" /> Baixar
        </Button>
      </div>
    </div>
  );
}
