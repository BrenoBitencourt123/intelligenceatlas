# Gera os 51 guias de folga estáticos em public/ufu/guia/{slug}.html
# Fonte de verdade: src/data/ufu/vestibular.ts (mesma do app e do pSEO).
# Páginas NOINDEX de propósito: são a recompensa da lista (/ufu/lista),
# não superfície de SEO. Rodar de novo sempre que os dados mudarem.
import re, os, math, unicodedata

# Link do grupo Placar UFU no WhatsApp. Quando o Breno criar o grupo,
# preencher e rodar de novo: os 51 guias ganham o bloco de convite.
GRUPO_WHATSAPP = ""

BASE = os.path.join(os.path.dirname(__file__), "..")
SRC = open(os.path.join(BASE, "src/data/ufu/vestibular.ts"), encoding="utf-8").read()
OUT = os.path.join(BASE, "public/ufu/guia")
os.makedirs(OUT, exist_ok=True)

DISCIPLINAS = [  # (label, questões) na ordem do quadro de pesos
    ("Língua Portuguesa", 10), ("Literatura", 5), ("Língua Estrangeira", 5),
    ("Matemática", 10), ("Física", 5), ("Química", 5), ("Biologia", 5),
    ("Geografia", 5), ("História", 5), ("Filosofia", 5), ("Sociologia", 5),
]
COTAS_LABEL = {
    "AC": "Ampla concorrência", "LI_EP": "LI · Escola pública",
    "LI_PCD": "LI · Esc. pública + PcD", "LI_PPI": "LI · Esc. pública + PPI",
    "LI_Q": "LI · Esc. pública + Quilombola", "LB_EP": "LB · Esc. pública + renda",
    "LB_PCD": "LB · Renda + PcD", "LB_PPI": "LB · Renda + PPI", "LB_Q": "LB · Renda + Quilombola",
}
PERFIL_NOME = {
    "bio": "biológicas", "exatas": "exatas", "humanas": "humanas", "dados": "dados",
    "gestao": "gestão", "linguagens": "linguagens", "edfisica": "educação física", "si_mc": "SI Monte Carmelo",
}

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")

def meta(corte):  # mesma regra do pSEO e do app: corte + ~22%, arredondado pra cima
    return math.ceil(corte * 1.22)

# --- parse vestibular.ts ---
pesos_map = {}
m = re.search(r"const PESOS = \{(.*?)\} as const;", SRC, re.S)
for line in m.group(1).splitlines():
    mm = re.match(r"\s*(\w+):\s*\[([\d, ]+)\]", line)
    if mm:
        pesos_map[mm.group(1)] = [int(x) for x in mm.group(2).split(",")]

cursos = []
for mm in re.finditer(
    r'c\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*PESOS\.(\w+),\s*\{([^}]*)\}\)', SRC
):
    cid, nome, campus, cidade, turno, perfil, cortes_s = mm.groups()
    cortes = {k: int(v) for k, v in re.findall(r"(\w+):\s*(\d+)", cortes_s)}
    cursos.append(dict(
        id=cid, nome=nome, campus=campus, cidade=cidade, turno=turno,
        perfil=perfil, pesos=pesos_map[perfil], cortes=cortes,
        slug=f"{slugify(nome)}-{slugify(turno)}-{slugify(cidade)}",
    ))
assert len(cursos) == 51, f"esperava 51 cursos, achei {len(cursos)}"

CSS = """body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:24px 18px;color:#1a1a2e;background:#faf9fc;line-height:1.55}
h1{font-size:26px;margin:6px 0 4px}h2{font-size:19px;margin-top:28px}a{color:#6d28d9;font-weight:600;text-decoration:none}
table{width:100%;border-collapse:collapse;font-size:15px;margin:10px 0}th,td{padding:7px 6px;border-bottom:1px solid #eee;text-align:left}
th{color:#64748b;font-size:13px}.tag{color:#64748b;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:700}
.num{font-size:34px;font-weight:800}.box{background:#fff;border:1px solid #eee;border-radius:12px;padding:16px 18px;margin:14px 0}
.warn{background:#fffbeb;border-color:#fde68a}.ok{background:#f0fdf4;border-color:#bbf7d0}
.cta{display:block;text-align:center;background:#6d28d9;color:#fff;border-radius:10px;padding:13px;margin:10px 0;font-weight:700}
.cta.sec{background:#fff;color:#6d28d9;border:2px solid #6d28d9}.muted{color:#64748b;font-size:14px}td.r,th.r{text-align:right}"""

def bloco_pesos(c):
    grupos = {3: [], 2: [], 1: []}
    for (label, q), p in zip(DISCIPLINAS, c["pesos"]):
        grupos[p].append((label, q))
    linhas = []
    for p in (3, 2, 1):
        if not grupos[p]:
            continue
        qtot = sum(q for _, q in grupos[p])
        nomes = ", ".join(l for l, _ in grupos[p])
        linhas.append(
            f"<tr><td><b>Peso {p}</b></td><td>{nomes}</td>"
            f"<td class='r'>{qtot} questões</td><td class='r'>{qtot*p} pts</td></tr>"
        )
    return grupos, "<table><tr><th>Bloco</th><th>Disciplinas</th><th class='r'>Questões</th><th class='r'>Pontos máx.</th></tr>" + "".join(linhas) + "</table>"

def pagina(c):
    corte = c["cortes"].get("AC")
    mt = meta(corte) if corte else None
    grupos, tabela_pesos = bloco_pesos(c)
    top = ", ".join(l for l, _ in grupos[3]) if grupos[3] else ""
    gap = mt - corte if corte else 0

    grupo_bloco = (
        f'<br><br><a class="cta" style="margin:6px 0 0" href="{GRUPO_WHATSAPP}">'
        "Entrar no grupo do Placar UFU no WhatsApp</a>"
        "<span class='muted'>Avisos, dúvidas e a pré-venda acontecem lá primeiro.</span>"
    ) if GRUPO_WHATSAPP else ""

    cotas_rows = "".join(
        f"<tr><td>{COTAS_LABEL.get(k, k)}</td><td class='r'>{v}</td><td class='r'>{meta(v)}</td></tr>"
        for k, v in sorted(c["cortes"].items(), key=lambda kv: -kv[1])
    )

    return f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Guia de folga de {c['nome']} — UFU 2026/2 | Placar UFU</title>
</head><body><style>{CSS}</style>
<p class="tag"><a href="https://inteligenciatlas.com/ufu/">Placar UFU</a> · guia de folga</p>
<h1>Guia de folga de {c['nome']}</h1>
<p class="muted">{c['turno']} · {c['cidade']} · Vestibular UFU 2026/2 · dados oficiais DIRPS</p>

<div class="box"><span class="tag">Os números que importam</span><br>
<span class="num">{corte} → {mt}</span><br>
O corte da 1ª fase em ampla concorrência foi <b>{corte} acertos</b> (de 65).
A sua meta não é essa: é <b>{mt} acertos</b> — corte + ~22%.</div>

<div class="box warn"><b>Por que mirar acima do corte?</b> A UFU classifica cerca de <b>6× as vagas</b>
para a 2ª fase. Passar no corte só te coloca na disputa da redação (peso 3, 80 pontos), com
até 6 candidatos por vaga. Quem entra raspando precisa de uma redação quase perfeita;
quem entra com folga transforma a redação em vantagem, não em salvação.</div>

<h2>Corte e meta por modalidade</h2>
<table><tr><th>Modalidade</th><th class="r">Corte 2026/2</th><th class="r">Meta com folga</th></tr>{cotas_rows}</table>

<h2>Onde cada acerto vale mais</h2>
<p>Perfil <b>{PERFIL_NOME[c['perfil']]}</b>: um acerto em {top or 'disciplina de maior peso'} vale
<b>3×</b> um acerto de peso 1. Os {gap} acertos entre o corte e a sua meta saem mais barato aqui:</p>
{tabela_pesos}

<h2>O plano em 4 passos</h2>
<div class="box"><b>1. Diagnóstico.</b> Use a calculadora com seus acertos de simulado e veja sua zona:
abaixo do corte, zona perigosa (passa na 1ª fase e perde a vaga) ou folga.<br><br>
<b>2. Prioridade = peso × frequência.</b> Comece pelo bloco de peso 3 ({top}). Estude exemplo
resolvido antes de resolver sozinho; só então questões em ordem de dificuldade.<br><br>
<b>3. Redação desde o 1º mês.</b> A banca DIRPS cobra <b>gênero</b> (7 possíveis) e zera fuga de
gênero. Peso 3 — vale o mesmo que um bloco inteiro da objetiva.<br><br>
<b>4. Folga de verdade.</b> Folga é <i>média dos simulados menos a variação</i> acima de {mt}.
45/38/47 não é folga — é sorte intermitente. Simule a prova completa (65 questões, 5h30).</div>

<a class="cta" href="https://inteligenciatlas.com/calculadora-ufu">Calcular minha nota completa (pesos + redação)</a>
<a class="cta sec" href="https://inteligenciatlas.com/redacao-ufu">Corrigir minha redação nos 5 critérios da banca</a>

<div class="box ok">Você está na lista de interesse ✅ — será avisado(a) quando a
<b>pré-venda fundadora (20 vagas)</b> do Placar UFU abrir.{grupo_bloco}</div>

<p class="muted">Dados oficiais DIRPS/UFU 2026/2 (Edital 18/2026, pesos retificados 16/03/2026,
cortes 12/06/2026). O Placar UFU não tem vínculo com a universidade.</p>
</body></html>"""

for c in cursos:
    open(os.path.join(OUT, c["slug"] + ".html"), "w", encoding="utf-8").write(pagina(c))
print(f"OK: {len(cursos)} guias gerados em public/ufu/guia/")
