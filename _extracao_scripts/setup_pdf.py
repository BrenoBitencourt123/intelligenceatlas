#!/usr/bin/env python3
"""
setup_pdf.py - Prepara um PDF de prova para extração de questões.

Uso:
    python3 setup_pdf.py <caminho_pdf> <diretorio_saida> [--dpi 300]

Saídas em <diretorio_saida>:
    pages/page_NN.png       - cada página renderizada em PNG (DPI configurável)
    text_raw/page_NN.txt    - texto bruto extraído via PyMuPDF (sem layout)
    words/page_NN.json      - bounding boxes de cada palavra (x0,y0,x1,y1,texto,bloco,linha)
    info.json               - metadados (nº páginas, tem texto pesquisável, dimensões, etc)

Reutilizável para qualquer prova (ENEM, Fuvest, UERJ, etc).
"""

import sys
import json
import argparse
from pathlib import Path

import fitz  # PyMuPDF


def setup_pdf(pdf_path: Path, out_dir: Path, dpi: int = 300) -> dict:
    pdf_path = Path(pdf_path)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "pages").mkdir(exist_ok=True)
    (out_dir / "text_raw").mkdir(exist_ok=True)
    (out_dir / "words").mkdir(exist_ok=True)

    doc = fitz.open(str(pdf_path))
    info = {
        "pdf_path": str(pdf_path),
        "page_count": doc.page_count,
        "metadata": dict(doc.metadata),
        "dpi": dpi,
        "has_text_layer": False,
        "pages": [],
    }

    # Matriz de zoom para o DPI alvo (PDF nativo é 72 DPI)
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)

    total_text_chars = 0
    for i, page in enumerate(doc):
        page_num = i + 1
        page_id = f"page_{page_num:02d}"

        # 1. Renderiza a página inteira em PNG (vetor + texto + tudo, em alta res)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        pix.save(str(out_dir / "pages" / f"{page_id}.png"))

        # 2. Texto bruto (concatenado, sem layout)
        text = page.get_text()
        total_text_chars += len(text)
        (out_dir / "text_raw" / f"{page_id}.txt").write_text(text, encoding="utf-8")

        # 3. Bounding boxes de palavras: (x0, y0, x1, y1, "palavra", block, line, word)
        words = page.get_text("words")
        words_data = [
            {
                "x0": round(w[0], 2),
                "y0": round(w[1], 2),
                "x1": round(w[2], 2),
                "y1": round(w[3], 2),
                "text": w[4],
                "block": w[5],
                "line": w[6],
                "word": w[7],
            }
            for w in words
        ]
        (out_dir / "words" / f"{page_id}.json").write_text(
            json.dumps(words_data, ensure_ascii=False, indent=1),
            encoding="utf-8",
        )

        info["pages"].append({
            "page_num": page_num,
            "id": page_id,
            "width_pt": page.rect.width,
            "height_pt": page.rect.height,
            "width_px": pix.width,
            "height_px": pix.height,
            "text_chars": len(text),
            "word_count": len(words_data),
        })

    # Se temos texto pesquisável em quantidade razoável, considera que o PDF tem camada de texto
    avg_chars_per_page = total_text_chars / max(doc.page_count, 1)
    info["has_text_layer"] = avg_chars_per_page > 200  # threshold arbitrário mas funcional
    info["total_text_chars"] = total_text_chars
    info["avg_chars_per_page"] = round(avg_chars_per_page, 1)

    (out_dir / "info.json").write_text(
        json.dumps(info, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    doc.close()
    return info


def main():
    parser = argparse.ArgumentParser(description="Setup PDF para extração de questões")
    parser.add_argument("pdf_path", help="Caminho do PDF de entrada")
    parser.add_argument("out_dir", help="Diretório de saída")
    parser.add_argument("--dpi", type=int, default=300, help="DPI de renderização (default 300)")
    args = parser.parse_args()

    info = setup_pdf(Path(args.pdf_path), Path(args.out_dir), dpi=args.dpi)
    print(f"OK: {info['page_count']} páginas processadas")
    print(f"   has_text_layer: {info['has_text_layer']}")
    print(f"   avg_chars_per_page: {info['avg_chars_per_page']}")
    print(f"   saída em: {args.out_dir}")


if __name__ == "__main__":
    main()
