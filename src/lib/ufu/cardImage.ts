import { TOTAL_QUESTOES, EDICAO } from "@/data/ufu/vestibular";
import type { ResultadoCalculo } from "@/lib/ufu/score";
import { COTAS } from "@/data/ufu/vestibular";

// Gera o card compartilhável (1080×1350, feed/WhatsApp) desenhando em canvas.
// Sem dependências externas — export determinístico e rápido.

const W = 1080;
const H = 1350;

const BRAND = "PLACAR UFU"; // ⚠ nome provisório (pendência: definir antes do 1º card público)

export function gerarCardPng(r: ResultadoCalculo): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // fundo
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, W, H);

  // moldura sutil
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 2;
  roundRect(ctx, 40, 40, W - 80, H - 80, 32);
  ctx.stroke();

  const font = (weight: number, size: number) =>
    `${weight} ${size}px -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

  // marca + edição
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = font(700, 34);
  ctx.textAlign = "left";
  ctx.fillText(BRAND, 96, 140);
  ctx.textAlign = "right";
  ctx.fillText(`VESTIBULAR UFU ${EDICAO}`, W - 96, 140);

  // curso
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = font(600, 46);
  const cursoLabel = `${r.curso.nome} • ${r.curso.turno}`;
  wrapText(ctx, cursoLabel, W / 2, 280, W - 220, 56);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = font(500, 32);
  ctx.fillText(`Campus ${r.curso.campus} — ${r.curso.cidade}`, W / 2, 360);

  // número gigante
  ctx.fillStyle = "#ffffff";
  ctx.font = font(800, 300);
  ctx.fillText(String(r.totalAcertos), W / 2, 700);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = font(600, 48);
  ctx.fillText(`de ${TOTAL_QUESTOES} questões`, W / 2, 775);

  // barra: eu × corte
  const barX = 140, barW = W - 280, barY = 880, barH = 26;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  roundRect(ctx, barX, barY, barW, barH, 13);
  ctx.fill();
  const fillW = Math.max(12, (r.totalAcertos / TOTAL_QUESTOES) * barW);
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, barX, barY, fillW, barH, 13);
  ctx.fill();

  if (r.corte !== null) {
    const cutX = barX + (r.corte / TOTAL_QUESTOES) * barW;
    ctx.strokeStyle = "#f5b942";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cutX, barY - 22);
    ctx.lineTo(cutX, barY + barH + 22);
    ctx.stroke();
    ctx.fillStyle = "#f5b942";
    ctx.font = font(700, 30);
    ctx.fillText(`corte ${r.corte}`, cutX, barY - 40);
  }

  // veredito
  ctx.font = font(700, 52);
  const cotaLabel = COTAS.find((ct) => ct.id === r.cota)?.label ?? r.cota;
  if (r.status === "acima") {
    ctx.fillStyle = "#7dd87d";
    ctx.fillText(`+${r.delta} acima do corte da 2ª fase`, W / 2, 1035);
  } else if (r.status === "no_corte") {
    ctx.fillStyle = "#f5b942";
    ctx.fillText("exatamente no corte da 2ª fase", W / 2, 1035);
  } else if (r.status === "abaixo") {
    ctx.fillStyle = "#f0908d";
    ctx.fillText(`faltam ${Math.abs(r.delta!)} pro corte da 2ª fase`, W / 2, 1035);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("sem corte publicado nesta cota", W / 2, 1035);
  }
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = font(500, 32);
  ctx.fillText(cotaLabel, W / 2, 1090);

  // rodapé
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.font = font(500, 28);
  ctx.fillText(`Corte oficial DIRPS ${EDICAO} (classificados p/ correção da redação)`, W / 2, 1210);
  ctx.font = font(700, 30);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("inteligenciatlas.com/calculadora-ufu — grátis, sem cadastro", W / 2, 1260);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob falhou"))), "image/png");
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}
