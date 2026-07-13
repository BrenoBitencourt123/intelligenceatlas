# Prompt para Lovable — Baú variável pós-missão

⚠ GATILHO: só colar depois de 2 semanas de dados dos prompts 01-03 mostrando
o loop básico funcionando (D1 medido, celebração com pct_pulo <60%).
Recompensa variável em cima de loop fraco é maquiagem. Está escrito agora só
pra fila não parar.

Contexto de negócio: o baú do Duolingo funciona por 3 propriedades — pede um
2º toque (antecipação), o conteúdo varia (recompensa imprevisível) e o que sai
tem uso. SEM moeda/cristais: moeda sem loja é número morto. O prêmio aqui é
conteúdo proprietário DIRPS — coisa que o aluno realmente quer e nenhum
concorrente tem.

## 1. Tabela de prêmios

- `bau_conteudos`: id, tipo ('dado_dirps' | 'dica_banca' | 'mapa_revelacao'),
  titulo, corpo, curso_slug null (prêmio segmentado por curso quando fizer
  sentido), ativo bool, peso int (raridade: comum=10, raro=3, épico=1).
- Seed inicial: 15 linhas placeholder marcadas `-- PLACEHOLDER Cowork cura`
  (ex.: "Em 2026/2, {curso} chamou até a posição {n} — folga é isso",
  "A DIRPS repetiu média aritmética em 4 das últimas 5 provas").
- `bau_aberturas`: user_id, conteudo_id, opened_at (evita repetir prêmio até
  esgotar o pool; RLS por user).

## 2. Fluxo (entra na cascata do prompt 01, entre streak e placar)

1. Tela do baú FECHADO balançando levemente + "Toque pra abrir".
2. 1º toque: baú pula, "Toque de novo!" (o ritual dos 2 toques).
3. 2º toque: abre com confete curto → card do prêmio (título + corpo).
   Raro/épico ganham moldura diferente (borda âmbar / gradiente).
4. Sorteio ponderado por `peso`, excluindo já abertos; pool vazio → baú não
   aparece (nunca prêmio repetido, nunca baú vazio).
- Frequência: 1 baú por dia no máximo (na primeira missão completa do dia),
  senão vira ruído.
- Eventos (padrão prompt 03): `bau_aberto` { conteudo_id, tipo, raridade },
  `bau_pulado`.

## 3. Verificação

1. Completar a missão do dia → baú aparece 1x; segunda sessão no dia → não.
2. Dois toques abrem; prêmios não repetem em aberturas seguidas.
3. Pool esgotado → cascata segue direto pro placar sem tela vazia.
4. Eventos aparecem em ufu_events.

## Fora deste prompt
- Curadoria real dos prêmios (Cowork, do acervo DIRPS/cortes/EFTs de 16/07).
- Cosméticos/mascote/coleções visuais — só com receita pagando a obra
  (espec §8, entrega 7).
