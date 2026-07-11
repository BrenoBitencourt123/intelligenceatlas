-- ============================================================
-- Nó 2 da Trilha: MATEMÁTICA — "O setor circular e o triângulo
-- escondido" (Questão 21 DIRPS como cume, gabarito 6π).
-- Segue a Lei Zero + regra "apresenta antes de cobrar".
-- SVGs desenhados em código (determinísticos).
-- ============================================================

ALTER TABLE public.trilha_nos ADD COLUMN IF NOT EXISTS ordem int NOT NULL DEFAULT 0;
UPDATE public.trilha_nos SET ordem = 1 WHERE id = 'red-generos-zeros';

INSERT INTO public.trilha_nos (id, disciplina, titulo, descricao, nivel_max, ordem, ativo) VALUES
('mat-setores-triangulo', 'matematica', 'O setor circular e o triângulo escondido',
 'Do "o que é raio" até uma questão real da prova — a jogada que a banca adora esconder.',
 5, 1, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.trilha_itens (no_id, nivel, ordem, tipo, payload, needs_review) VALUES

-- ── NÍVEL 0: apresentar as peças, depois reconhecer ──
('mat-setores-triangulo', 0, 0, 'info', $j${
  "enunciado": "As 4 peças de hoje (30 segundos)",
  "corpo": "⭕ RAIO: distância do centro até a borda. Todo raio do MESMO círculo mede igual — guarda isso, é a chave de tudo hoje.\n🍕 SETOR CIRCULAR: a fatia de pizza do círculo.\n🔺 TRIÂNGULO EQUILÁTERO: 3 lados iguais, e os 3 ângulos SEMPRE medem 60°.\n🌗 SEMICÍRCULO: metade de um círculo.",
  "gabarito": [],
  "feedback_erro": "",
  "feedback_acerto": ""
}$j$, false),

('mat-setores-triangulo', 0, 1, 'tocar', $j${
  "enunciado": "Toque no triângulo EQUILÁTERO (os números são os lados):",
  "midia": {"svg": "<svg viewBox='0 0 400 130' xmlns='http://www.w3.org/2000/svg' fill='none' stroke='currentColor' stroke-width='2'><polygon points='15,90 85,90 50,29'/><text x='50' y='110' text-anchor='middle' font-size='12' fill='currentColor' stroke='none'>A · 7,7,7</text><polygon points='115,90 155,90 135,20'/><text x='135' y='110' text-anchor='middle' font-size='12' fill='currentColor' stroke='none'>B · 9,9,4</text><polygon points='205,90 205,35 265,90'/><text x='235' y='110' text-anchor='middle' font-size='12' fill='currentColor' stroke='none'>C · 3,4,5</text><polygon points='300,90 385,82 330,40'/><text x='342' y='110' text-anchor='middle' font-size='12' fill='currentColor' stroke='none'>D · 4,6,8</text></svg>"},
  "opcoes": [{"id":"a","texto":"A"},{"id":"b","texto":"B"},{"id":"c","texto":"C"},{"id":"d","texto":"D"}],
  "gabarito": ["a"],
  "feedback_erro": "Equilátero = os 3 lados IGUAIS. Só o A tem 7,7,7.",
  "feedback_acerto": "3 lados iguais → 3 ângulos de 60°. Sempre."
}$j$, false),

('mat-setores-triangulo', 0, 2, 'tocar', $j${
  "enunciado": "Dois raios do MESMO círculo podem ter tamanhos diferentes?",
  "opcoes": [{"id":"a","texto":"Sim"},{"id":"b","texto":"Não"}],
  "gabarito": ["b"],
  "feedback_erro": "Nunca. Raio é a distância do centro à borda — a mesma pra qualquer direção.",
  "feedback_acerto": "Exato. E é isso que a prova vai esconder de você daqui a pouco."
}$j$, false),

-- ── NÍVEL 1: apresentar as fórmulas, depois usar ──
('mat-setores-triangulo', 1, 0, 'info', $j${
  "enunciado": "As 3 fórmulas do dia",
  "corpo": "⭕ Área do círculo = π · r²\n🍕 Setor de X° = fração X/360 do círculo (60° → 1/6)\n🔺 Altura do equilátero: h = lado · √3 / 2\n\nSó essas três. A prova inteira de hoje se resolve com elas.",
  "gabarito": [],
  "feedback_erro": "",
  "feedback_acerto": ""
}$j$, false),

('mat-setores-triangulo', 1, 1, 'completar', $j${
  "enunciado": "Círculo de raio 6 → Área = π · 6² = ___ π",
  "opcoes": [{"id":"a","texto":"12"},{"id":"b","texto":"36"},{"id":"c","texto":"18"}],
  "gabarito": ["b"],
  "feedback_erro": "6² = 36 (o raio multiplica ele mesmo, não por 2).",
  "feedback_acerto": "36π. O erro clássico é fazer 6×2 — você não caiu."
}$j$, false),

('mat-setores-triangulo', 1, 2, 'completar', $j${
  "enunciado": "Um setor de 60° é 60/360 = 1/___ do círculo",
  "opcoes": [{"id":"a","texto":"3"},{"id":"b","texto":"4"},{"id":"c","texto":"6"}],
  "gabarito": ["c"],
  "feedback_erro": "60/360: corta o zero → 6/36 → 1/6.",
  "feedback_acerto": "1/6 da pizza."
}$j$, false),

-- ── NÍVEL 2: um passo de conta ──
('mat-setores-triangulo', 2, 1, 'ordenar', $j${
  "enunciado": "Área do setor de 60° num círculo de raio 6 — ordene os passos:",
  "opcoes": [
    {"id":"a","texto":"Área do círculo inteiro: π·6² = 36π"},
    {"id":"b","texto":"60° é 1/6 do círculo"},
    {"id":"c","texto":"Divido: 36π ÷ 6 = 6π"}
  ],
  "gabarito": ["a","b","c"],
  "feedback_erro": "Primeiro o bolo inteiro (36π), depois o tamanho da fatia (1/6), depois corta.",
  "feedback_acerto": "Círculo → fração → fatia. Esse é O algoritmo de setor."
}$j$, false),

('mat-setores-triangulo', 2, 2, 'completar', $j${
  "enunciado": "No triângulo equilátero, cada ângulo mede ___°",
  "opcoes": [{"id":"a","texto":"45"},{"id":"b","texto":"60"},{"id":"c","texto":"90"}],
  "gabarito": ["b"],
  "feedback_erro": "180° divididos igualmente entre 3 ângulos = 60° cada.",
  "feedback_acerto": "60°. E um ângulo de 60° no centro de um círculo abre um setor de 1/6…"
}$j$, false),

-- ── NÍVEL 3: a fórmula em ação ──
('mat-setores-triangulo', 3, 1, 'completar', $j${
  "enunciado": "A altura de um equilátero é h = 3√3. Como h = lado·√3/2, o lado vale ___",
  "opcoes": [{"id":"a","texto":"3"},{"id":"b","texto":"6"},{"id":"c","texto":"12"}],
  "gabarito": ["b"],
  "feedback_erro": "3√3 = lado·√3/2 → corta o √3 dos dois lados → 3 = lado/2 → lado = 6.",
  "feedback_acerto": "Cortou o √3, dobrou o 3. Lado 6."
}$j$, false),

('mat-setores-triangulo', 3, 2, 'multipla', $j${
  "enunciado": "Área do setor de 60° num círculo de raio 12:",
  "opcoes": [{"id":"a","texto":"12π"},{"id":"b","texto":"24π"},{"id":"c","texto":"144π"},{"id":"d","texto":"6π"}],
  "gabarito": ["b"],
  "feedback_erro": "Círculo: π·12² = 144π. Fatia de 1/6: 144π ÷ 6 = 24π.",
  "feedback_acerto": "144π ÷ 6 = 24π. O algoritmo já é seu."
}$j$, false),

-- ── NÍVEL 4: a jogada da prova ──
('mat-setores-triangulo', 4, 1, 'multipla', $j${
  "enunciado": "A JOGADA: o ponto C está na borda dos DOIS círculos, que têm o MESMO raio r. Os centros são A e B, e a distância AB também é r. O triângulo ABC é:",
  "midia": {"svg": "<svg viewBox='0 0 170 125' xmlns='http://www.w3.org/2000/svg' fill='none' stroke='currentColor' stroke-width='1.5'><circle cx='60' cy='62' r='45'/><circle cx='105' cy='62' r='45'/><polygon points='60,62 105,62 82.5,23' stroke-dasharray='4 3'/><circle cx='60' cy='62' r='2.5' fill='currentColor'/><circle cx='105' cy='62' r='2.5' fill='currentColor'/><circle cx='82.5' cy='23' r='2.5' fill='currentColor'/><text x='50' y='75' font-size='11' fill='currentColor' stroke='none'>A</text><text x='110' y='75' font-size='11' fill='currentColor' stroke='none'>B</text><text x='79' y='15' font-size='11' fill='currentColor' stroke='none'>C</text></svg>"},
  "opcoes": [
    {"id":"a","texto":"Isósceles (só 2 lados iguais)"},
    {"id":"b","texto":"Equilátero (AC = BC = AB = r)"},
    {"id":"c","texto":"Retângulo"}
  ],
  "gabarito": ["b"],
  "feedback_erro": "C está na borda do círculo de centro A → AC = raio = r. Na borda do de centro B → BC = r. E AB = r. Três lados r = equilátero.",
  "feedback_acerto": "ESSA é a jogada. A banca esconde um equilátero em todo cruzamento de círculos iguais — e equilátero entrega o ângulo de 60°."
}$j$, false),

('mat-setores-triangulo', 4, 2, 'multipla', $j${
  "enunciado": "Treino da jogada: mesma figura, e a altura do triângulo ABC vale 4√3. Quanto vale o raio r (= lado do equilátero)?",
  "opcoes": [{"id":"a","texto":"4"},{"id":"b","texto":"8"},{"id":"c","texto":"16"}],
  "gabarito": ["b"],
  "feedback_erro": "4√3 = r·√3/2 → corta √3 → 4 = r/2 → r = 8.",
  "feedback_acerto": "Altura → lado → e o lado É o raio. A corrente está montada."
}$j$, false),

-- ── NÍVEL 5: O CUME — Questão 21 DIRPS (real) ──
('mat-setores-triangulo', 5, 1, 'multipla', $j${
  "enunciado": "(UFU/DIRPS) Na figura, a região hachurada de extremidades A e E é um semicírculo de raio r, e o setor circular ABD tem o mesmo raio r. Sabendo que a altura h do triângulo ABC é 3√3 cm, a área do setor circular BAC (cinza), em cm², é:",
  "midia": {"svg": "<svg viewBox='0 0 210 125' xmlns='http://www.w3.org/2000/svg' fill='none' stroke='currentColor' stroke-width='1.5'><path d='M 20 105 A 80 80 0 0 1 180 105'/><path d='M 100 105 A 80 80 0 0 0 20 25'/><polygon points='20,105 100,105 60,35.7' fill='currentColor' fill-opacity='0.15'/><line x1='60' y1='35.7' x2='60' y2='105' stroke-dasharray='4 3'/><line x1='20' y1='105' x2='180' y2='105'/><circle cx='20' cy='105' r='2.5' fill='currentColor'/><circle cx='100' cy='105' r='2.5' fill='currentColor'/><circle cx='180' cy='105' r='2.5' fill='currentColor'/><circle cx='60' cy='35.7' r='2.5' fill='currentColor'/><text x='12' y='120' font-size='11' fill='currentColor' stroke='none'>A</text><text x='96' y='120' font-size='11' fill='currentColor' stroke='none'>B</text><text x='176' y='120' font-size='11' fill='currentColor' stroke='none'>E</text><text x='54' y='28' font-size='11' fill='currentColor' stroke='none'>C</text><text x='14' y='22' font-size='11' fill='currentColor' stroke='none'>D</text><text x='64' y='75' font-size='10' fill='currentColor' stroke='none'>h</text></svg>"},
  "opcoes": [{"id":"a","texto":"12π"},{"id":"b","texto":"6π"},{"id":"c","texto":"9π"},{"id":"d","texto":"3π"}],
  "gabarito": ["b"],
  "feedback_erro": "A corrente inteira: C está nos dois círculos de raio r → ABC equilátero → h = 3√3 → r = 6 → ângulo em A = 60° = 1/6 → π·6²/6 = 6π.",
  "feedback_acerto": "Nó dourado 🏅 Você resolveu uma questão REAL da UFU — começando de 'o que é raio' há 8 minutos. Essa corrente (dois círculos → equilátero → 60° → setor) vai cair de novo.",
  "cta": {"texto": "Ver minha posição no placar", "href": "/hoje"}
}$j$, false)
ON CONFLICT (no_id, nivel, ordem) DO NOTHING;
