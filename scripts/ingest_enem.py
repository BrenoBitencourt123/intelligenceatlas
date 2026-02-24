#!/usr/bin/env python3
"""
Script de ingestão de questões do ENEM para o Supabase.

Requisitos:
  pip install supabase pymupdf Pillow

Uso:
  python ingest_enem.py --year 2023 --day 1 --pdf prova_2023_dia1.pdf

O script:
  1. Extrai texto e imagens do PDF usando PyMuPDF
  2. Separa as questões por regex
  3. Faz upload das imagens para o bucket 'question-images'
  4. Insere as questões na tabela 'questions'
"""

import argparse
import json
import re
import sys
import uuid
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("❌ Instale PyMuPDF: pip install pymupdf")
    sys.exit(1)

try:
    from supabase import create_client
except ImportError:
    print("❌ Instale supabase-py: pip install supabase")
    sys.exit(1)

# ── Configuração ──────────────────────────────────────────────
SUPABASE_URL = "https://elqbgbcoyocxgtcswyyh.supabase.co"
SUPABASE_SERVICE_KEY = "COLE_SUA_SERVICE_ROLE_KEY_AQUI"

# ID do usuário admin que será o "dono" das questões importadas
ADMIN_USER_ID = "COLE_SEU_USER_ID_AQUI"

BUCKET = "question-images"
# ──────────────────────────────────────────────────────────────

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def extract_images_from_page(doc: fitz.Document, page_num: int) -> list[dict]:
    """Extrai imagens de uma página do PDF."""
    page = doc[page_num]
    images = []
    for img_index, img in enumerate(page.get_images(full=True)):
        xref = img[0]
        base_image = doc.extract_image(xref)
        if not base_image:
            continue
        images.append({
            "data": base_image["image"],
            "ext": base_image["ext"],
            "width": base_image.get("width", 0),
            "height": base_image.get("height", 0),
        })
    return images


def upload_image(image_bytes: bytes, ext: str, year: int, question_num: int, idx: int) -> str:
    """Faz upload de uma imagem para o Supabase Storage e retorna a URL pública."""
    file_name = f"{year}/q{question_num}_{idx}.{ext}"
    
    content_type = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "gif": "image/gif",
        "webp": "image/webp",
    }.get(ext, "image/png")

    # Tenta remover se já existir
    try:
        sb.storage.from_(BUCKET).remove([file_name])
    except Exception:
        pass

    sb.storage.from_(BUCKET).upload(
        file_name,
        image_bytes,
        file_options={"content-type": content_type}
    )

    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{file_name}"


def parse_questions_from_text(text: str, year: int) -> list[dict]:
    """
    Extrai questões do texto bruto do PDF do ENEM.
    Adapte os regexes conforme o formato específico do seu PDF.
    """
    # Padrão para separar questões: "QUESTÃO XX" ou "Questão XX"
    pattern = r'(?:QUEST[ÃA]O|Quest[ãa]o)\s+(\d+)'
    splits = re.split(f'({pattern})', text)
    
    questions = []
    i = 0
    while i < len(splits):
        # Procura o próximo número de questão
        match = re.match(pattern, splits[i]) if i < len(splits) else None
        if match:
            q_num = int(match.group(1))
            # O conteúdo da questão está no próximo bloco
            if i + 1 < len(splits):
                content = splits[i + 1].strip()
            else:
                content = ""
            
            question = parse_single_question(content, q_num, year)
            if question:
                questions.append(question)
            i += 2
        else:
            i += 1

    return questions


def parse_single_question(content: str, number: int, year: int) -> dict | None:
    """Parseia o conteúdo de uma questão individual."""
    if not content or len(content) < 20:
        return None

    # Tenta extrair alternativas (A) (B) (C) (D) (E)
    alt_pattern = r'\(([A-E])\)\s*(.*?)(?=\([A-E]\)|$)'
    alt_matches = re.findall(alt_pattern, content, re.DOTALL)
    
    alternatives = []
    if alt_matches:
        for letter, text in alt_matches:
            alternatives.append({
                "letter": letter,
                "text": text.strip(),
            })
        # O enunciado é tudo antes da primeira alternativa
        first_alt_pos = content.find(f"({alt_matches[0][0]})")
        statement = content[:first_alt_pos].strip() if first_alt_pos > 0 else content
    else:
        statement = content
        alternatives = [
            {"letter": "A", "text": ""},
            {"letter": "B", "text": ""},
            {"letter": "C", "text": ""},
            {"letter": "D", "text": ""},
            {"letter": "E", "text": ""},
        ]

    return {
        "number": number,
        "year": year,
        "statement": statement,
        "alternatives": alternatives,
        "correct_answer": "",  # Preencher manualmente ou com gabarito
        "area": classify_area(number, year),
        "topic": "Geral",
        "subtopic": "",
        "difficulty": 2,
        "explanation": None,
        "images": [],
        "tags": [],
        "skills": [],
        "user_id": ADMIN_USER_ID,
    }


def classify_area(number: int, year: int) -> str:
    """
    Classifica a área com base no número da questão.
    ENEM padrão (a partir de 2017):
    - Dia 1: Linguagens (1-45) + Ciências Humanas (46-90)
    - Dia 2: Ciências da Natureza (91-135) + Matemática (136-180)
    Ajuste conforme necessário.
    """
    if number <= 45:
        return "Linguagens"
    elif number <= 90:
        return "Ciências Humanas"
    elif number <= 135:
        return "Ciências da Natureza"
    else:
        return "Matemática"


def apply_gabarito(questions: list[dict], gabarito_path: str | None):
    """Aplica gabarito oficial se fornecido (arquivo txt com formato: NUMERO LETRA)."""
    if not gabarito_path:
        return
    
    gab = {}
    with open(gabarito_path, "r") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 2:
                try:
                    gab[int(parts[0])] = parts[1].upper()
                except ValueError:
                    continue
    
    for q in questions:
        if q["number"] in gab:
            q["correct_answer"] = gab[q["number"]]
    
    print(f"✅ Gabarito aplicado: {len(gab)} respostas")


def insert_questions(questions: list[dict]):
    """Insere questões no Supabase."""
    inserted = 0
    skipped = 0
    
    for q in questions:
        # Verifica se já existe
        existing = sb.table("questions").select("id").eq("year", q["year"]).eq("number", q["number"]).execute()
        
        if existing.data:
            print(f"  ⏭️  Questão {q['number']}/{q['year']} já existe, pulando...")
            skipped += 1
            continue
        
        try:
            sb.table("questions").insert(q).execute()
            inserted += 1
            print(f"  ✅ Questão {q['number']}/{q['year']} inserida")
        except Exception as e:
            print(f"  ❌ Erro na questão {q['number']}: {e}")
    
    print(f"\n📊 Resultado: {inserted} inseridas, {skipped} já existiam")


def main():
    parser = argparse.ArgumentParser(description="Importar questões do ENEM para o Supabase")
    parser.add_argument("--pdf", required=True, help="Caminho do PDF da prova")
    parser.add_argument("--year", type=int, required=True, help="Ano da prova (ex: 2023)")
    parser.add_argument("--day", type=int, default=1, help="Dia da prova (1 ou 2)")
    parser.add_argument("--gabarito", help="Arquivo de gabarito (formato: NUMERO LETRA)")
    parser.add_argument("--dry-run", action="store_true", help="Apenas mostra o que seria inserido")
    parser.add_argument("--with-images", action="store_true", help="Extrai e faz upload de imagens")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"❌ Arquivo não encontrado: {pdf_path}")
        sys.exit(1)

    print(f"📄 Processando: {pdf_path.name} (ENEM {args.year} - Dia {args.day})")

    # Abre o PDF
    doc = fitz.open(str(pdf_path))
    print(f"   {doc.page_count} páginas encontradas")

    # Extrai texto completo
    full_text = ""
    for page_num in range(doc.page_count):
        page = doc[page_num]
        full_text += page.get_text() + "\n"

    # Parseia questões
    questions = parse_questions_from_text(full_text, args.year)
    print(f"   {len(questions)} questões extraídas")

    if not questions:
        print("⚠️  Nenhuma questão encontrada. Verifique o formato do PDF.")
        sys.exit(1)

    # Extrai e faz upload de imagens (opcional)
    if args.with_images:
        print("\n🖼️  Extraindo imagens...")
        for page_num in range(doc.page_count):
            images = extract_images_from_page(doc, page_num)
            for idx, img in enumerate(images):
                # Heurística simples: associa imagem à questão mais próxima
                # Na prática, você pode querer fazer isso manualmente
                url = upload_image(
                    img["data"], img["ext"],
                    args.year, page_num + 1, idx
                )
                print(f"   📤 Imagem p.{page_num + 1} → {url}")

    # Aplica gabarito
    apply_gabarito(questions, args.gabarito)

    # Dry run ou inserção
    if args.dry_run:
        print("\n🔍 DRY RUN - Questões que seriam inseridas:")
        for q in questions[:5]:
            print(f"   Q{q['number']}: {q['statement'][:80]}...")
            print(f"   Área: {q['area']}, Alternativas: {len(q['alternatives'])}")
            print()
        if len(questions) > 5:
            print(f"   ... e mais {len(questions) - 5} questões")
    else:
        print("\n📤 Inserindo questões no banco...")
        insert_questions(questions)

    doc.close()
    print("\n✅ Concluído!")


if __name__ == "__main__":
    main()
