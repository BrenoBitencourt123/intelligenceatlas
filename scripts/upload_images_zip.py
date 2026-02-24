#!/usr/bin/env python3
"""
Extrai um ZIP de imagens e faz upload para o Supabase Storage
preservando a estrutura de pastas.

Uso:
  pip install supabase
  python scripts/upload_images_zip.py caminho/para/imagens.zip

Variáveis de ambiente necessárias:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
"""

import os
import sys
import zipfile
import mimetypes
from pathlib import Path

from supabase import create_client

BUCKET = "question-images"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://elqbgbcoyocxgtcswyyh.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("❌ Defina SUPABASE_SERVICE_ROLE_KEY como variável de ambiente.")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def upload_zip(zip_path: str):
    if not os.path.isfile(zip_path):
        print(f"❌ Arquivo não encontrado: {zip_path}")
        sys.exit(1)

    with zipfile.ZipFile(zip_path, "r") as zf:
        members = [m for m in zf.namelist() if not m.endswith("/")]
        total = len(members)
        print(f"📦 {total} arquivos encontrados no ZIP.\n")

        success = 0
        errors = 0

        for i, name in enumerate(members, 1):
            # Ignora arquivos ocultos do macOS
            if "__MACOSX" in name or name.startswith("."):
                continue

            content_type = mimetypes.guess_type(name)[0] or "application/octet-stream"
            data = zf.read(name)

            try:
                supabase.storage.from_(BUCKET).upload(
                    path=name,
                    file=data,
                    file_options={"content-type": content_type, "upsert": "true"},
                )
                success += 1
                if i % 50 == 0 or i == total:
                    print(f"  ✅ {i}/{total} enviados...")
            except Exception as e:
                errors += 1
                print(f"  ❌ Erro em {name}: {e}")

    print(f"\n🏁 Concluído! {success} enviados, {errors} erros.")
    print(f"\n🔗 URL base pública:")
    print(f"   https://elqbgbcoyocxgtcswyyh.supabase.co/storage/v1/object/public/{BUCKET}/")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python scripts/upload_images_zip.py <arquivo.zip>")
        sys.exit(1)
    upload_zip(sys.argv[1])
