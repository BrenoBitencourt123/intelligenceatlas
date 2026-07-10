# Cluster pSEO de redação UFU — public/ufu/redacao/*.html (INDEXÁVEL)
# Fonte: src/data/ufu/redacao.ts (rubrica oficial, Edital DIRPS 18/2026).
# 10 páginas: pilar (como a banca corrige) + 7 gêneros + o-que-zera + quanto-vale.
# CTA primário: corretor (1ª grátis). Rodar de novo se a rubrica mudar.
import re, os, unicodedata

BASE = os.path.join(os.path.dirname(__file__), "..")
SRC = open(os.path.join(BASE, "src/data/ufu/redacao.ts"), encoding="utf-8").read()
OUT = os.path.join(BASE, "public/ufu/redacao")
os.makedirs(OUT, exist_ok=True)
SITE = "https://inteligenciatlas.com"

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")

# ---- parse redacao.ts ----
generos = []
gen_block = re.search(r"GENEROS_UFU: GeneroUfu\[\] = \[(.*?)\n\];", SRC, re.S).group(1)
for m in re.finditer(r'id:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*elementos:\s*\[(.*?)\]', gen_block, re.S):
    generos.append(dict(id=m.group(1), label=m.group(2),
                        elementos=re.findall(r'"([^"]+)"', m.group(3))))
criterios = []
crit_block = re.search(r"CRITERIOS_UFU: CriterioUfu\[\] = \[(.*?)\n\];", SRC, re.S).group(1)
for m in re.finditer(r'id:\s*"([^"]+)",\s*nome:\s*"([^"]+)",\s*max:\s*(\d+),\s*faixas:\s*\[(.*?)\]\s*,\s*\}', crit_block, re.S):
    faixas = [dict(pontos=int(p), rotulo=r, descricao=d) for p, r, d in
              re.findall(r'pontos:\s*(\d+),\s*rotulo:\s*"([^"]+)",\s*descricao:\s*"([^"]+)"', m.group(4))]
    criterios.append(dict(id=m.group(1), nome=m.group(2), max=int(m.group(3)), faixas=faixas))
zeros = re.findall(r'"([^"]+)"', re.search(r"MOTIVOS_ZERO = \[(.*?)\];", SRC, re.S).group(1))
propostas = [dict(generoId=g, titulo=t, enunciado=e) for g, t, e in
             re.findall(r'generoId:\s*"([^"]+)",\s*titulo:\s*"([^"]+)",\s*enunciado:\s*\n?\s*"([^"]+)"', SRC)]
assert len(generos) == 7 and len(criterios) == 5 and len(zeros) == 7, (len(generos), len(criterios), len(zeros))

FONT = ('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">')
CSS = """body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;max-width:720px;margin:0 auto;padding:24px 18px;color:#1c2029;background:#fbfaf8;line-height:1.6}
h1{font-size:25px;margin:6px 0 4px}h2{font-size:19px;margin-top:26px}a{color:#171717;font-weight:600;text-decoration:none}
table{width:100%;border-collapse:collapse;font-size:14px;margin:10px 0}th,td{padding:7px 6px;border-bottom:1px solid #eee;text-align:left;vertical-align:top}
th{color:#737373;font-size:13px}.tag{color:#737373;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:700}
.box{background:#fff;border:1px solid #eee;border-radius:12px;padding:16px 18px;margin:14px 0}
.warn{background:#fffbeb;border-color:#fde68a}ul{padding-left:20px}li{margin:5px 0}
.cta{display:block;text-align:center;background:#171717;color:#fff;border-radius:10px;padding:13px;margin:10px 0;font-weight:700}
.cta.sec{background:#fff;color:#171717;border:2px solid #171717}.muted{color:#737373;font-size:14px}td.r,th.r{text-align:right}"""

def shell(slug, title, desc, body):
    return f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{SITE}/ufu/redacao/{slug}.html">
{FONT}</head><body><style>{CSS}</style>
<p class="tag"><a href="{SITE}/ufu/">Placar UFU</a> · <a href="{SITE}/ufu/redacao/index.html">redação UFU</a></p>
{body}
<a class="cta" href="{SITE}/redacao-ufu">Corrigir minha redação nos 5 critérios da banca — 1ª correção grátis</a>
<a class="cta sec" href="{SITE}/ufu/lista?origem=pseo-redacao">Receber o guia de folga do meu curso</a>
<p class="muted">Fonte: Edital DIRPS 18/2026, seção 6.3 (rubrica oficial). O Placar UFU não tem vínculo com a UFU.</p>
</body></html>"""

def tabela_criterio(c):
    rows = "".join(f"<tr><td class='r'><b>{f['pontos']}</b></td><td>{f['rotulo']}</td><td>{f['descricao']}</td></tr>" for f in c["faixas"])
    return f"<h2>{c['nome']} (até {c['max']} pontos)</h2><table><tr><th class='r'>Pts</th><th>Faixa</th><th>O que a banca vê</th></tr>{rows}</table>"

paginas = []  # (slug, html)

# 1. PILAR
body = f"""<h1>Como a banca DIRPS corrige a redação da UFU</h1>
<p class="muted">5 critérios · 80 pontos · notas por faixa · 15 a 34 linhas</p>
<div class="box warn"><b>O dado que muda tudo:</b> a redação tem <b>peso 3</b> — e nota ZERO em
qualquer critério eliminatório te tira do vestibular inteiro, mesmo com a objetiva boa.
Veja <a href="o-que-zera-a-redacao-ufu.html">os 7 erros que zeram</a>.</div>
<p>A DIRPS não dá nota "no olho": cada um dos 5 critérios tem faixas fixas de pontuação,
publicadas no edital. Abaixo, a rubrica oficial completa — é exatamente contra ela que
sua redação vai ser lida.</p>
{''.join(tabela_criterio(c) for c in criterios)}
<h2>Os 7 gêneros que a UFU pode cobrar</h2>
<ul>{''.join(f'<li><a href="{slugify(g["label"])}.html">{g["label"]}</a></li>' for g in generos)}</ul>
<p>A prova indica o gênero na hora — treinar só dissertação (modelo ENEM) é o erro mais comum
de quem vem do ENEM: aqui, <b>fuga de gênero zera</b>.</p>"""
paginas.append(("index", shell("index", "Redação UFU: como a banca DIRPS corrige (5 critérios, 80 pontos) | Placar UFU",
    "A rubrica oficial da redação da UFU: 5 critérios, faixas de pontuação do edital, os 7 gêneros possíveis e o que zera.", body)))

# 2-8. GÊNEROS
crit_gen = next(c for c in criterios if c["id"] == "genero_discurso")
for g in generos:
    slug = slugify(g["label"])
    props = [p for p in propostas if p["generoId"] == g["id"]]
    prop_html = "".join(f'<div class="box"><b>Proposta real ({p["titulo"]}):</b><br>{p["enunciado"]}</div>' for p in props)
    body = f"""<h1>{g['label']} na redação da UFU: o que a banca cobra</h1>
<p class="muted">Critério "Gênero do discurso" · até 20 pontos · fuga de gênero zera e elimina</p>
<p>Se a prova pedir {g['label'].lower()} e você entregar outra coisa — ou uma dissertação
disfarçada — a banca aplica <b>zero no critério de gênero, o que elimina do vestibular</b>.
Estes são os elementos constitutivos que o corretor procura:</p>
<div class="box"><ul>{''.join(f'<li>{e}</li>' for e in g['elementos'])}</ul></div>
{prop_html}
<h2>Como o critério pontua</h2>
<table><tr><th class='r'>Pts</th><th>Faixa</th><th>O que a banca vê</th></tr>
{''.join(f"<tr><td class='r'><b>{f['pontos']}</b></td><td>{f['rotulo']}</td><td>{f['descricao']}</td></tr>" for f in crit_gen['faixas'])}</table>
<p>Gênero é só 1 dos 5 critérios — veja <a href="index.html">a rubrica completa da banca</a>
e <a href="o-que-zera-a-redacao-ufu.html">os 7 erros que zeram</a>.</p>"""
    paginas.append((slug, shell(slug, f"{g['label']} na redação da UFU: o que a banca cobra (e o que zera) | Placar UFU",
        f"Elementos que a banca DIRPS exige em {g['label'].lower()} na UFU, a pontuação por faixa e o erro que zera e elimina.", body)))

# 9. O QUE ZERA
body = f"""<h1>O que zera a redação da UFU (e elimina do vestibular)</h1>
<p class="muted">Nota zero na redação = eliminação do certame, mesmo passando na objetiva</p>
<p>O edital lista exatamente o que zera. Não é lenda de cursinho — é a seção 6.3:</p>
<div class="box"><ul>{''.join(f'<li>{z}</li>' for z in zeros)}</ul></div>
<div class="box warn"><b>O mais traiçoeiro é a fuga de gênero:</b> quem treina só dissertação
ENEM escreve dissertação até quando a prova pede <a href="carta-de-solicitacao.html">carta</a>
ou <a href="relato.html">relato</a> — e zera escrevendo "bem". Conheça
<a href="index.html">os 7 gêneros e a rubrica completa</a>.</div>
<h2>Checklist antes de entregar</h2>
<ul><li>Tem entre 15 e 34 linhas?</li><li>É o gênero pedido, com os elementos dele?</li>
<li>Respondeu ao recorte exato do tema (não ao tema amplo)?</li>
<li>Zero assinatura ou identificação?</li><li>Dialogou com os textos motivadores sem copiar?</li></ul>"""
paginas.append(("o-que-zera-a-redacao-ufu", shell("o-que-zera-a-redacao-ufu",
    "O que zera a redação da UFU: os 7 erros que eliminam do vestibular | Placar UFU",
    "A lista oficial do edital: os 7 motivos que zeram a redação da UFU e eliminam o candidato — incluindo o mais traiçoeiro, a fuga de gênero.", body)))

# 10. QUANTO VALE
body = f"""<h1>Quanto vale a redação da UFU?</h1>
<p class="muted">80 pontos · peso 3 · segunda fase</p>
<p>A redação vale <b>80 pontos com peso 3</b> — na prática, é a peça de maior impacto
individual do vestibular. E como a UFU classifica ~6× as vagas pra 2ª fase, é a redação
que decide quem, entre os classificados, leva a vaga.</p>
<div class="box"><b>A conta que ninguém faz:</b> quem passa raspando na objetiva precisa de
redação quase perfeita pra compensar; quem passa com folga chega à redação podendo errar.
Descubra sua folga: <a href="{SITE}/calculadora-ufu">calculadora gratuita</a>.</div>
<h2>Como os 80 pontos se distribuem</h2>
<table><tr><th>Critério</th><th class='r'>Máx.</th></tr>
{''.join(f"<tr><td><a href='index.html'>{c['nome']}</a></td><td class='r'>{c['max']}</td></tr>" for c in criterios)}</table>
<p>Regras da folha: mínimo 15 linhas (menos zera), máximo 34. Rubrica completa:
<a href="index.html">como a banca corrige</a>.</p>"""
paginas.append(("quanto-vale-a-redacao-ufu", shell("quanto-vale-a-redacao-ufu",
    "Quanto vale a redação da UFU? 80 pontos, peso 3, 5 critérios | Placar UFU",
    "A redação da UFU vale 80 pontos com peso 3 e decide a vaga na 2ª fase. Veja a distribuição por critério e as regras da folha oficial.", body)))

for slug, html in paginas:
    open(os.path.join(OUT, slug + ".html"), "w", encoding="utf-8").write(html)
print(f"OK: {len(paginas)} páginas em public/ufu/redacao/")

# ---- sitemap ----
sm_path = os.path.join(BASE, "public/ufu/sitemap.xml")
sm = open(sm_path, encoding="utf-8").read()
novas = [f"{SITE}/ufu/redacao/{slug}.html" for slug, _ in paginas]
add = "".join(f"<url><loc>{u}</loc></url>\n" for u in novas if u not in sm)
if add:
    sm = sm.replace("</urlset>", add + "</urlset>")
    open(sm_path, "w", encoding="utf-8").write(sm)
print("sitemap atualizado")
