# PACOTE 15/07 — Reels "a nota do último aprovado" (Classificação Geral 2026/2)
# Uso: depois que a coleta agendada (16/07) salvar os EFTs, rodar:
#   python3 scripts/gerar-reels-ultimo-aprovado.py _contexto/efts_2026_2.json
# Formato aceito do json: { "<slug-ou-id-do-curso>": <eft_do_ultimo_aprovado> }
# Saída: _contexto/REELS-lote2-ultimo-aprovado.md (roteiros prontos, ordenados
# por demanda) — Breno grava e posta no pico de busca.
import json, re, sys, os, math, unicodedata

BASE = os.path.join(os.path.dirname(__file__), "..")
SRC = open(os.path.join(BASE, "src/data/ufu/vestibular.ts"), encoding="utf-8").read()

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")

cursos = []
for mm in re.finditer(
    r'c\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*PESOS\.(\w+),\s*\{([^}]*)\}\)', SRC
):
    cid, nome, campus, cidade, turno, perfil, cortes_s = mm.groups()
    cortes = {k: int(v) for k, v in re.findall(r"(\w+):\s*(\d+)", cortes_s)}
    cursos.append(dict(id=cid, nome=nome, cidade=cidade, turno=turno,
                       corte=cortes.get("AC"),
                       slug=f"{slugify(nome)}-{slugify(turno)}-{slugify(cidade)}"))

efts = {}
if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
    raw = json.load(open(sys.argv[1], encoding="utf-8"))
    for k, v in raw.items():
        efts[k] = v
else:
    print("AVISO: rodando SEM efts (arquivo não passado/encontrado) — roteiros saem com [EFT] placeholder.")

def eft_de(c):
    return efts.get(c["slug"]) or efts.get(c["id"])

def roteiro(c, n):
    eft = eft_de(c)
    eft_s = str(eft) if eft is not None else "[EFT]"
    meta = math.ceil(c["corte"] * 1.22) if c["corte"] else "?"
    return f"""### Reel {n:02d} — {c['nome']} ({c['turno']}, {c['cidade']})

**Capa:** "A vaga de {c['nome']} na UFU fechou em {eft_s} pontos"

**Gancho (0-3s):** "O corte de {c['nome']} na UFU foi {c['corte']} acertos.
Mas o último aprovado DE VERDADE fez {eft_s} pontos. Deixa eu te explicar a diferença."

**Desenvolvimento (3-25s):** "Os {c['corte']} acertos só te classificam pra 2ª fase —
junto com até 6 candidatos por vaga. A vaga mesmo fechou no escore final: objetiva
COM os pesos do curso + redação com peso 3. Saiu agora na Classificação Geral: {eft_s}
pontos. Ou seja: quem passou raspando na objetiva precisou de uma redação quase perfeita.
Quem passou com folga — uns {meta} acertos — chegou na redação podendo errar."

**CTA (25-30s):** "Quer saber quantos acertos te dão folga no SEU curso? Calculadora
gratuita, sem cadastro, link na bio → inteligenciatlas.com/calculadora-ufu"

---
"""

cursos_validos = [c for c in cursos if c["corte"]]
cursos_validos.sort(key=lambda c: -c["corte"])  # proxy de demanda: corte alto = curso disputado

out = ["# REELS lote 2 — \"A nota do último aprovado\" (Classificação Geral 2026/2)\n",
       "Ordem = demanda (corte alto primeiro). Postar 1-2/dia a partir de 16/07.\n",
       "Dado proprietário: ninguém mais cruza corte da objetiva × EFT final.\n\n---\n"]
faltando = [c["slug"] for c in cursos_validos if eft_de(c) is None]
for i, c in enumerate(cursos_validos, 1):
    out.append(roteiro(c, i))

dest = os.path.join(BASE, "_contexto/REELS-lote2-ultimo-aprovado.md")
open(dest, "w", encoding="utf-8").write("".join(out))
print(f"OK: {len(cursos_validos)} roteiros em _contexto/REELS-lote2-ultimo-aprovado.md")
if faltando:
    print(f"SEM EFT ({len(faltando)}): " + ", ".join(faltando[:8]) + ("..." if len(faltando) > 8 else ""))
