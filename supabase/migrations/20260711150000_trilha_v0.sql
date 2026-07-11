-- ============================================================
-- TRILHA v0 — tabelas + RLS + seed do primeiro nó (redação).
-- Contrato do item: TRILHA-SCHEMA-ITEM.md · Conteúdo revisável:
-- TRILHA-NO-REDACAO-01.md · Espec: ESPEC-TRILHA-PLACAR-UFU.md
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trilha_nos (
  id text PRIMARY KEY,
  disciplina text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  nivel_max int NOT NULL DEFAULT 5,
  pre_requisitos text[] NOT NULL DEFAULT '{}',
  peso_info jsonb,
  ativo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trilha_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  no_id text NOT NULL REFERENCES public.trilha_nos(id) ON DELETE CASCADE,
  nivel int NOT NULL,
  ordem int NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('tocar','ligar','ordenar','completar','multipla')),
  payload jsonb NOT NULL,
  needs_review boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (no_id, nivel, ordem)
);

CREATE TABLE IF NOT EXISTS public.trilha_progresso (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  no_id text NOT NULL REFERENCES public.trilha_nos(id) ON DELETE CASCADE,
  nivel_atual int NOT NULL DEFAULT 0,
  dourado boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, no_id)
);

CREATE TABLE IF NOT EXISTS public.trilha_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.trilha_itens(id) ON DELETE CASCADE,
  acertou_primeira boolean NOT NULL,
  tentativas int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trilha_respostas_user_idx ON public.trilha_respostas (user_id, created_at);

-- RLS: conteúdo ativo é público (SEO futuro); progresso/respostas são do dono.
ALTER TABLE public.trilha_nos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trilha_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trilha_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trilha_respostas ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.trilha_nos, public.trilha_itens TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.trilha_progresso TO authenticated;
GRANT SELECT, INSERT ON public.trilha_respostas TO authenticated;
GRANT ALL ON public.trilha_nos, public.trilha_itens, public.trilha_progresso, public.trilha_respostas TO service_role;

CREATE POLICY "trilha_nos_read" ON public.trilha_nos FOR SELECT TO anon, authenticated USING (ativo = true);
CREATE POLICY "trilha_itens_read" ON public.trilha_itens FOR SELECT TO anon, authenticated
  USING (needs_review = false AND EXISTS (SELECT 1 FROM public.trilha_nos n WHERE n.id = no_id AND n.ativo));
CREATE POLICY "trilha_prog_own" ON public.trilha_progresso FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trilha_resp_own" ON public.trilha_respostas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trilha_nos_admin" ON public.trilha_nos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "trilha_itens_admin" ON public.trilha_itens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ─── SEED: nó "Os 7 gêneros e as armadilhas do zero" ───
-- needs_review=false: conteúdo já revisado no TRILHA-NO-REDACAO-01.md.
-- Se o Breno editar o MD, refletir aqui (fonte de verdade = banco).

INSERT INTO public.trilha_nos (id, disciplina, titulo, descricao, nivel_max, ativo) VALUES
('red-generos-zeros', 'redacao', 'Os 7 gêneros e as armadilhas do zero',
 'Do "quais são os gêneros da UFU" até a triagem que evita a nota zero — em 8 minutos.',
 5, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.trilha_itens (no_id, nivel, ordem, tipo, payload, needs_review) VALUES
('red-generos-zeros', 0, 1, 'tocar', $j${
  "enunciado": "A banca DIRPS pode pedir 7 gêneros. Toque nos que SÃO gêneros da UFU:",
  "opcoes": [
    {"id":"a","texto":"Carta aberta"},{"id":"b","texto":"Dissertação ENEM"},
    {"id":"c","texto":"Notícia"},{"id":"d","texto":"Crônica"},
    {"id":"e","texto":"Resenha crítica"},{"id":"f","texto":"Poema"}
  ],
  "gabarito": ["a","c","e"],
  "feedback_erro": "A UFU não pede a dissertação do ENEM — e é aí que muita gente zera por fuga de gênero.",
  "feedback_acerto": "Os 7 da UFU: 3 cartas, artigo de opinião, notícia, resenha e relato."
}$j$, false),
('red-generos-zeros', 0, 2, 'tocar', $j${
  "enunciado": "Qual destes textos começa com manchete e lide (o quê, quem, quando, onde)?",
  "opcoes": [
    {"id":"a","texto":"Notícia"},{"id":"b","texto":"Carta de reclamação"},{"id":"c","texto":"Relato"}
  ],
  "gabarito": ["a"],
  "feedback_erro": "Manchete + lide = notícia. Carta começa com vocativo; relato, com contexto pessoal.",
  "feedback_acerto": "Manchete + lide é o crachá da notícia."
}$j$, false),
('red-generos-zeros', 0, 3, 'tocar', $j${
  "enunciado": "Isso ZERA ou NÃO ZERA? — \"escrever 14 linhas\"",
  "opcoes": [{"id":"a","texto":"Zera"},{"id":"b","texto":"Não zera"}],
  "gabarito": ["a"],
  "feedback_erro": "Menos de 15 linhas = nota zero E eliminação. É a régua mais boba e mais fatal.",
  "feedback_acerto": "15 linhas é o piso. Conte as linhas antes de entregar."
}$j$, false),
('red-generos-zeros', 1, 1, 'ligar', $j${
  "enunciado": "Ligue o gênero à sua marca registrada:",
  "colunaA": [
    {"id":"a1","texto":"Carta aberta"},{"id":"a2","texto":"Artigo de opinião"},
    {"id":"a3","texto":"Notícia"},{"id":"a4","texto":"Relato"}
  ],
  "colunaB": [
    {"id":"b1","texto":"vocativo a um público + voz coletiva"},
    {"id":"b2","texto":"tese clara sobre questão polêmica"},
    {"id":"b3","texto":"lide com o quê/quem/quando/onde"},
    {"id":"b4","texto":"experiência pessoal em 1ª pessoa"}
  ],
  "gabarito": [["a1","b1"],["a2","b2"],["a3","b3"],["a4","b4"]],
  "feedback_erro": "Cada gênero tem um crachá. A banca procura o crachá antes de ler o resto.",
  "feedback_acerto": "Crachás na cabeça = 20 pontos de gênero protegidos."
}$j$, false),
('red-generos-zeros', 1, 2, 'completar', $j${
  "enunciado": "Copiar trechos demais dos textos motivadores dá zero quando a cópia é ___",
  "opcoes": [{"id":"a","texto":"total"},{"id":"b","texto":"de uma frase"},{"id":"c","texto":"de palavras-chave"}],
  "gabarito": ["a"],
  "feedback_erro": "Cópia TOTAL zera. Usar dado dos motivadores com suas palavras não só pode, como pontua (leitura dos motivadores vale 8).",
  "feedback_acerto": "Motivador é matéria-prima: reescreva, não copie."
}$j$, false),
('red-generos-zeros', 1, 3, 'completar', $j${
  "enunciado": "Assinar seu nome no fim da redação ___",
  "opcoes": [{"id":"a","texto":"zera e elimina"},{"id":"b","texto":"tira 2 pontos"},{"id":"c","texto":"é obrigatório na carta"}],
  "gabarito": ["a"],
  "feedback_erro": "Identificação = zero. Na carta, assina-se um PAPEL (\"um estudante\", \"moradores do bairro\"), nunca seu nome.",
  "feedback_acerto": "Papel social sim, nome nunca."
}$j$, false),
('red-generos-zeros', 1, 4, 'ligar', $j${
  "enunciado": "Ligue o critério ao peso na nota (total 80):",
  "colunaA": [
    {"id":"a1","texto":"Proposta temática"},{"id":"a2","texto":"Gênero/discurso"},
    {"id":"a3","texto":"Coesão/coerência"},{"id":"a4","texto":"Convenções da escrita"},
    {"id":"a5","texto":"Leitura dos motivadores"}
  ],
  "colunaB": [
    {"id":"b1","texto":"20"},{"id":"b2","texto":"20"},{"id":"b3","texto":"20"},
    {"id":"b4","texto":"12"},{"id":"b5","texto":"8"}
  ],
  "gabarito": [["a1","b1"],["a2","b2"],["a3","b3"],["a4","b4"],["a5","b5"]],
  "feedback_erro": "3 critérios de 20 dominam a nota — e os 3 se decidem antes da primeira linha, no planejamento.",
  "feedback_acerto": "60 dos 80 pontos se decidem no planejamento."
}$j$, false),
('red-generos-zeros', 2, 1, 'ordenar', $j${
  "enunciado": "Coloque na ordem: o ritual de 5 minutos que evita o zero antes de escrever:",
  "opcoes": [
    {"id":"a","texto":"Ler a proposta e sublinhar o TEMA exato"},
    {"id":"b","texto":"Identificar o GÊNERO pedido e lembrar o crachá dele"},
    {"id":"c","texto":"Checar as exigências (mín. 15 linhas, sem assinatura)"},
    {"id":"d","texto":"Só então começar o rascunho"}
  ],
  "gabarito": ["a","b","c","d"],
  "feedback_erro": "Tema e gênero primeiro — são os dois zeros mais comuns e os dois critérios de 20 pontos.",
  "feedback_acerto": "Esse ritual de 5 min protege 40 pontos."
}$j$, false),
('red-generos-zeros', 2, 2, 'multipla', $j${
  "enunciado": "A proposta pede CARTA ABERTA sobre mobilidade urbana. O aluno escreve um texto dissertativo perfeito, sem vocativo, sem assinatura de papel social. O que acontece?",
  "opcoes": [
    {"id":"a","texto":"Perde uns pontos em gênero"},
    {"id":"b","texto":"Nota zero por fuga de gênero"},
    {"id":"c","texto":"Nada, o conteúdo compensa"}
  ],
  "gabarito": ["b"],
  "feedback_erro": "Texto perfeito no gênero errado = zero. Na UFU o gênero não é detalhe, é eliminatório.",
  "feedback_acerto": "Gênero na UFU é eliminatório — o crachá vem antes do conteúdo."
}$j$, false),
('red-generos-zeros', 3, 1, 'multipla', $j${
  "enunciado": "Trecho: \"Eu acho que tipo assim, a adoção tardia é muito importante sabe.\" Num ARTIGO DE OPINIÃO, o problema principal é:",
  "opcoes": [
    {"id":"a","texto":"Opinar (artigo não pode ter opinião)"},
    {"id":"b","texto":"Registro informal (\"tipo assim\", \"sabe\")"},
    {"id":"c","texto":"Falta de dados"}
  ],
  "gabarito": ["b"],
  "feedback_erro": "Artigo de opinião DEVE opinar — com registro formal. A informalidade fere convenções (12) e o gênero (20).",
  "feedback_acerto": "Opinião sim, informalidade não."
}$j$, false),
('red-generos-zeros', 3, 2, 'tocar', $j${
  "enunciado": "Toque nos 2 elementos que NÃO podem faltar numa carta de reclamação:",
  "opcoes": [
    {"id":"a","texto":"Destinatário explícito"},
    {"id":"b","texto":"Relato objetivo do problema + pedido de providência"},
    {"id":"c","texto":"Rimas"},{"id":"d","texto":"Manchete"}
  ],
  "gabarito": ["a","b"],
  "feedback_erro": "Reclamação sem destinatário e sem pedido é desabafo — e desabafo não é o gênero.",
  "feedback_acerto": "Destinatário + pedido de providência = o esqueleto da reclamação."
}$j$, false),
('red-generos-zeros', 4, 1, 'multipla', $j${
  "enunciado": "A pegadinha clássica da DIRPS: a proposta traz 3 textos motivadores sobre \"trabalho infantil NO BRASIL RURAL\". O aluno escreve sobre trabalho infantil em geral, muito bem escrito. A banca:",
  "opcoes": [
    {"id":"a","texto":"Aceita, o tema é próximo"},
    {"id":"b","texto":"Desconta só na proposta temática"},
    {"id":"c","texto":"Pode zerar por fuga ao tema — o recorte faz parte do tema"}
  ],
  "gabarito": ["c"],
  "feedback_erro": "O RECORTE é o tema. \"No Brasil rural\" não é enfeite — ignorar o recorte é a fuga mais comum entre bons escritores.",
  "feedback_acerto": "ESSA é a jogada: sublinhe o recorte da proposta. A banca esconde o tema no detalhe."
}$j$, false),
('red-generos-zeros', 4, 2, 'multipla', $j${
  "enunciado": "Ainda na mesma prova: o aluno usa UM dado do texto motivador, reescrito com as palavras dele e amarrado ao argumento. Isso:",
  "opcoes": [
    {"id":"a","texto":"Arrisca zero por cópia"},
    {"id":"b","texto":"Pontua em leitura dos motivadores (8/80)"},
    {"id":"c","texto":"É neutro"}
  ],
  "gabarito": ["b"],
  "feedback_erro": "Motivador é matéria-prima, não muleta: reescreveu e integrou = pontos; copiou em bloco = risco.",
  "feedback_acerto": "Reescrever + integrar = os 8 pontos mais fáceis da prova."
}$j$, false),
('red-generos-zeros', 5, 1, 'multipla', $j${
  "proposta_id": "2026_2_artigo_adocao",
  "enunciado": "Leia a proposta real acima (Vestibular UFU 2026/2). Marque a ÚNICA alternativa que NÃO zeraria:",
  "opcoes": [
    {"id":"a","texto":"Texto de 14 linhas com tese impecável"},
    {"id":"b","texto":"Artigo assinado com nome completo do candidato"},
    {"id":"c","texto":"Artigo com título, tese clara e registro formal, sem identificação, 22 linhas"},
    {"id":"d","texto":"Carta aberta emocionada sobre adoção"}
  ],
  "gabarito": ["c"],
  "feedback_erro": "Revise as armadilhas: menos de 15 linhas zera; nome zera; gênero errado zera. Sobra a alternativa que respeita as três réguas.",
  "feedback_acerto": "Nó dourado 🏅 Você acabou de fazer, em 8 minutos, a triagem que reprova metade dos candidatos — antes de escrever uma linha.",
  "cta": {"texto": "Agora escreve: essa proposta é real e a primeira correção é grátis.", "href": "/redacao-ufu"}
}$j$, false)
ON CONFLICT (no_id, nivel, ordem) DO NOTHING;
