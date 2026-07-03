#!/usr/bin/env python3
"""
recortar_regiao.py - Recorta uma região vertical de uma página renderizada,
usando textos-âncora para definir os limites superior e inferior.

A âncora superior eh o texto que aparece IMEDIATAMENTE ANTES da região alvo
(ex: o último parágrafo antes da figura).
A âncora inferior eh o texto que aparece IMEDIATAMENTE DEPOIS da região alvo
(ex: a linha de fonte "Disponível em..." ou o comando "Esse cartaz...").

O script encontra as coordenadas Y dos textos no PDF original, converte para
pixels da imagem renderizada, e recorta a região vertical entre eles.

Uso:
    python3 recortar_regiao.py <setup_dir> <page_num> <ancora_sup> <ancora_inf> <output_png> [--coluna left|right|all] [--margem-px 10]

Exemplo:
    python3 recortar_regiao.py _v2 1 "bloqueando a cadeia respiratória." "ALBERTS, B." figura_127.png --margem-px 20

Reutilizável para qualquer prova.
"""

import sys
import json
import argparse
from pathlib import Path

from PIL import Image


def encontrar_y_ancora(words: list, texto_ancora: str, posicao: str = "fim") -> float | None:
    """
    Encontra a coordenada Y (em pontos PDF, 72 DPI) de uma sequencia de palavras.

    - posicao='fim': retorna y1 da última palavra da âncora (use para âncora SUPERIOR)
    - posicao='inicio': retorna y0 da primeira palavra da âncora (use para âncora INFERIOR)

    Faz busca tolerante: normaliza espaços e procura sequência de palavras na ordem.
    """
    # Normaliza: pega só os tokens da âncora
    ancora_tokens = texto_ancora.split()
    if not ancora_tokens:
        return None

    # Procura na lista de palavras a sequência contígua que começa com ancora_tokens[0]
    # e bate com toda a sequência (palavra por palavra, ignorando pontuação no fim)
    def norm(s: str) -> str:
        # Remove pontuação no início e fim
        return s.strip(".,;:()[]\"'").lower()

    ancora_norm = [norm(t) for t in ancora_tokens]
    n = len(ancora_norm)

    for i in range(len(words) - n + 1):
        candidato = [norm(words[j]["text"]) for j in range(i, i + n)]
        if candidato == ancora_norm:
            if posicao == "fim":
                return words[i + n - 1]["y1"]
            else:
                return words[i]["y0"]

    # Tentativa mais flexível: âncora pode estar quebrada em palavras um pouco diferentes
    # ex: hifenização. Faz uma busca por substring no texto concatenado.
    return None


def recortar_regiao(
    setup_dir: Path,
    page_num: int,
    ancora_sup: str,
    ancora_inf: str,
    output_png: Path,
    coluna: str = "all",
    margem_px: int = 10,
    margem_pt_extra_sup: float = 5.0,
    margem_pt_extra_inf: float = 0.0,
) -> dict:
    """
    Retorna dict com info da operação: y_sup_pt, y_inf_pt, y_sup_px, y_inf_px,
    ancora_sup_encontrada, ancora_inf_encontrada, tamanho do recorte.
    """
    setup_dir = Path(setup_dir)
    info = json.loads((setup_dir / "info.json").read_text(encoding="utf-8"))

    page_id = f"page_{page_num:02d}"
    page_info = next((p for p in info["pages"] if p["page_num"] == page_num), None)
    if not page_info:
        raise ValueError(f"Página {page_num} não encontrada em info.json")

    words_path = setup_dir / "words" / f"{page_id}.json"
    img_path = setup_dir / "pages" / f"{page_id}.png"
    words = json.loads(words_path.read_text(encoding="utf-8"))

    # Filtro de coluna: se o usuário quer só esquerda/direita, filtra
    page_width_pt = page_info["width_pt"]
    mid_x = page_width_pt / 2
    if coluna == "left":
        words_filtered = [w for w in words if w["x1"] < mid_x + 20]
    elif coluna == "right":
        words_filtered = [w for w in words if w["x0"] > mid_x - 20]
    else:
        words_filtered = words

    y_sup_pt = encontrar_y_ancora(words_filtered, ancora_sup, "fim")
    y_inf_pt = encontrar_y_ancora(words_filtered, ancora_inf, "inicio")

    resultado = {
        "page_num": page_num,
        "ancora_sup": ancora_sup,
        "ancora_inf": ancora_inf,
        "ancora_sup_encontrada": y_sup_pt is not None,
        "ancora_inf_encontrada": y_inf_pt is not None,
        "y_sup_pt": y_sup_pt,
        "y_inf_pt": y_inf_pt,
        "coluna": coluna,
    }

    if y_sup_pt is None or y_inf_pt is None:
        resultado["erro"] = "ancora não encontrada"
        return resultado

    # Adiciona margem opcional em pontos PDF
    y_sup_pt -= margem_pt_extra_sup
    y_inf_pt += margem_pt_extra_inf

    # Converte para pixels da imagem renderizada
    page_height_pt = page_info["height_pt"]
    page_height_px = page_info["height_px"]
    scale_y = page_height_px / page_height_pt

    y_sup_px = int(y_sup_pt * scale_y) - margem_px
    y_inf_px = int(y_inf_pt * scale_y) + margem_px
    y_sup_px = max(0, y_sup_px)
    y_inf_px = min(page_height_px, y_inf_px)

    # Filtro horizontal opcional
    page_width_px = page_info["width_px"]
    if coluna == "left":
        x_sup_px = 0
        x_inf_px = page_width_px // 2 + 30
    elif coluna == "right":
        x_sup_px = page_width_px // 2 - 30
        x_inf_px = page_width_px
    else:
        x_sup_px = 0
        x_inf_px = page_width_px

    # Recorta
    img = Image.open(img_path)
    cropped = img.crop((x_sup_px, y_sup_px, x_inf_px, y_inf_px))
    output_png = Path(output_png)
    output_png.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(output_png)

    resultado.update({
        "y_sup_px": y_sup_px,
        "y_inf_px": y_inf_px,
        "x_sup_px": x_sup_px,
        "x_inf_px": x_inf_px,
        "output": str(output_png),
        "altura_recorte_px": y_inf_px - y_sup_px,
        "largura_recorte_px": x_inf_px - x_sup_px,
    })
    return resultado


def main():
    parser = argparse.ArgumentParser(description="Recorta região vertical de página por texto-âncora")
    parser.add_argument("setup_dir", help="Diretório do setup_pdf.py")
    parser.add_argument("page_num", type=int, help="Número da página (1-indexed)")
    parser.add_argument("ancora_sup", help="Texto-âncora superior (vem ANTES da região)")
    parser.add_argument("ancora_inf", help="Texto-âncora inferior (vem DEPOIS da região)")
    parser.add_argument("output_png", help="Caminho do PNG de saída")
    parser.add_argument("--coluna", choices=["left", "right", "all"], default="all")
    parser.add_argument("--margem-px", type=int, default=10)
    parser.add_argument("--margem-pt-sup", type=float, default=5.0)
    parser.add_argument("--margem-pt-inf", type=float, default=0.0)
    args = parser.parse_args()

    res = recortar_regiao(
        Path(args.setup_dir),
        args.page_num,
        args.ancora_sup,
        args.ancora_inf,
        Path(args.output_png),
        coluna=args.coluna,
        margem_px=args.margem_px,
        margem_pt_extra_sup=args.margem_pt_sup,
        margem_pt_extra_inf=args.margem_pt_inf,
    )
    print(json.dumps(res, ensure_ascii=False, indent=2))
    if not res.get("output"):
        sys.exit(1)


if __name__ == "__main__":
    main()
