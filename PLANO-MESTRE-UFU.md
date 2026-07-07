# PLANO-MESTRE — Atlas (ENEM) → Preparatório UFU

> Documento único de referência. Substitui e absorve o PLANO-PIVO-UFU.md.
> Regra de operação: **Lovable escreve o código do app** (prompts prontos na
> seção 7), **Claude/Cowork faz dados + pSEO + fábrica de conteúdo + auditoria**,
> **Breno grava, posta, vende e decide**. Assim o limite do Fable 5 é gasto
> em estratégia e dados, não em CRUD.

---

## 1. Tese (por que UFU, por que vende)

- ENEM abandonado: prova extensa/cansativa, e o público PAGANTE (aluno de
  escola particular, com grana e consciência de compra) foca em vestibular
  próprio, não em ENEM.
- UFU 2026/2: 27.508 inscritos (recorde), 1.729 vagas, 51 cursos. Mal
  atendido: só cursinho genérico caro (R$ 1.000+). Dados públicos DIRPS
  estruturados = fosso quando organizados.
- Insight de produto que nenhum concorrente comunica: a UFU classifica
  **6× as vagas** pra 2ª fase → passar no corte da objetiva ≠ vaga.
  O produto vende FOLGA (meta = corte + 20-25%), não aprovação raspada.

## 2. Ativos já prontos (não refazer)

| Ativo | Onde | Estado |
|---|---|---|
| Calculadora de nota (grátis, sem cadastro) | `/ufu` + `src/data/ufu/vestibular.ts` | Pronto; dados oficiais 2026/2 (pesos retificados + cortes por curso/cota) |
| Card compartilhável PNG + tracking | `src/lib/ufu/cardImage.ts` + tabela `ufu_events` (migration aplicada) | Pronto; share_rate instrumentado (meta ≥10%) |
| Corretor de redação banca DIRPS | `/redacao-ufu` + edge functions `analyze-essay-ufu`, `improve-essay-ufu` | Código pronto; falta deploy (push → Lovable) + calibração com `_contexto/redacao-teste-ufu.md` (expectativa 46-56/80) |
| Versão evoluída (+1 faixa, anti-Grammarly) | `improve-essay-ufu` | Pronto junto com o corretor |
| Rubrica oficial + gêneros + propostas reais | `src/data/ufu/redacao.ts` | Pronto (Quadro 2 do edital literal) |
| Motor pedagógico com cache | `generate-pedagogy` + `question_pedagogy` | Existe (ENEM); falta só trocar prompt |
| Pipeline de etiquetagem IA | `classify-question`, `pre-classify-batch` | Existe; falta taxonomia UFU |
| Import de provas por PDF | `parse-exam-pdf` + `/importar` | Existe; falta testar com 1 prova DIRPS |
| Coleta EFTs finais | Tarefa agendada 16/07 15h | Agendada (Classificação Geral sai 15/07) |

## 3. Produto — transformação em 4 fases (executor: LOVABLE)

**Fase 1 — Casca UFU** (1ª semana): landing UFU com calculadora como isca,
navegação (Hoje · Questões · Redação · Perfil) sem nada de ENEM, onboarding
com UMA pergunta central: curso-alvo + cota (grava em `profiles.curso_ufu`,
`profiles.cota_ufu` — migration). `/redacao` → redirect `/redacao-ufu`.

**Fase 2 — Miolo de dados** (2-3ª semana; dados por Cowork, telas por Lovable):
coluna `exam` em `questions` (default 'enem', filtrar 'ufu' nos hooks);
taxonomia UFU do Conteúdo Programático oficial; ingestão de 2 provas DIRPS;
etiquetagem em lote + revisão das 200 primeiras; view `frequencia_topicos`;
prompt UFU no `generate-pedagogy`.

**Fase 3 — Trilha da folga** (4ª semana em diante):
- **Princípio: o sistema mira a META (corte + 20-25%), nunca o corte.**
  Calibrar com EFTs reais em 16/07.
- 3 zonas em toda tela: abaixo do corte / zona perigosa (passa na 1ª fase,
  perde a vaga) / folga. Tirar o aluno da zona do meio é o produto.
- Trilha prioriza: frequência do tópico × peso do curso × lacuna do aluno
  (motor bayesiano existente).
- **Camada de ensino (aluno perdido):** diagnóstico → pré-requisitos na
  taxonomia (fração antes de função) → AULA POR TÓPICO cacheada (tabela
  `topico_aulas`: conceito + 2 exemplos resolvidos passo a passo + erros
  clássicos da banca) → vídeo curado do YouTube → só então questões
  fácil→difícil → revisão espaçada. Exemplo resolvido ANTES de prática.
- Simulado = prova completa UFU (65 questões, distribuição oficial, timer
  5h30) → resultado alimenta calculadora/card automaticamente → share.
- Folga medida: média dos simulados − variação, acima da meta. 45/38/47
  não é folga, é sorte intermitente.

**Fase 4 — Monetização e limpeza**: apagar código/dados ENEM; quotas UFU
(1 correção de boas-vindas grátis; avulso R$ 9,90-14,90; pacote 5 ~R$ 39;
**passe até a prova** R$ 149 fundadores → R$ 249, pagamento único — pré-venda
roda no Pix antes de mexer no Stripe).

## 4. Aquisição — o coração (executor: COWORK + BRENO)

### 4.1 pSEO em HTML de verdade (não React SPA)

Problema real: o app é Vite SPA — HTML vazio pro crawler; AI Overviews nem
executam JS. Solução: **camada pública separada do app**, HTML estático
gerado por script a partir dos MESMOS dados (Supabase/arquivos ts).

- Gerador: script Node/Astro que roda aqui no Cowork, lê os dados e cospe
  HTML puro + calculadora como ilha interativa (defesa contra AI Overviews:
  página que FAZ algo não é substituível por resposta de IA).
- Deploy: Cloudflare Pages/Netlify (grátis), no domínio definitivo.
- Páginas (validação: 30 páginas + Search Console por 4-6 semanas ANTES de
  escalar; deadline: indexando até set-out/2026):
  1. `nota-de-corte-{curso}` ×51 — dados prontos no vestibular.ts
  2. `quantos-acertos-para-passar-{curso}` ×51 — mesma base, intenção diferente
  3. `pesos-das-disciplinas-{curso}` ×51 — "matemática vale 3× pra Mecatrônica"
  4. Calculadora (página-âncora, ilha interativa)
  5. Prova resolvida questão a questão (após fase 2 — cada questão etiquetada
     vira uma página com explicação do motor pedagógico)
  6. Guia da redação UFU por gênero ×7 (rubrica oficial já digitada)
- **Auto-alimentação:** os dados atualizam 1× por ciclo (edital, cortes,
  classificação) → rodar o gerador → deploy. Uma fonte de verdade, três
  saídas: app, pSEO, Reels.

### 4.2 Fábrica de Reels auto-alimentada

Mesma fonte de dados → gerador de PAUTAS (script aqui no Cowork, sob demanda
ou agendado semanal):
- Pilar A (dado proprietário): "quantos acertos pra Medicina UFU?" — 51
  cursos = 51 roteiros prontos saindo de `vestibular.ts`. Formato faceless:
  Remotion + ElevenLabs (voz única = identidade) + dados do banco.
- Pilar B (demonstração): screen-record da correção de redação real.
- Pilar C (diário): "estudando pra UFU em público" — prints da trilha, 1ª pessoa.
- Pilar D (erro que reprova): fuga de gênero, os 7 zeros do edital, "por que
  passar no corte não te dá a vaga" (o insight das 6× vagas é conteúdo forte).
- Pilar E: resposta a dúvida real de comentário/DM.
- Loop de sexta: pilar campeão (comentários/DMs, não views) ganha slot na
  semana seguinte; pior perde. Buffer mínimo: 7 dias agendados.
- Saída do gerador: roteiro (gancho/desenvolvimento/CTA) + dado exato + texto
  de capa — Breno só grava/renderiza e posta.

### 4.3 Canais quentes (pré-venda fundadora)

Do mais quente pro mais frio: lista de interesse própria → comunidade
vestibulanda no X → grupos WhatsApp/Telegram de UFU (entrar ENTREGANDO
correção grátis, nunca com link; vender por DM) → comentários em conteúdo
UFU → professores/cursinhos da região (comissão 30-40%, cupom rastreável).
Gatilho da pré-venda: 50+ interessados = abrir 20 vagas a R$ 149;
<30 após 1 semana = voltar pro conteúdo.

### 4.4 Métricas (uma por fase — regra do briefing)

Agora: tamanho da lista de interesse. Depois do card: share_rate ≥10%
(`ufu_share_rate` no SQL editor). pSEO: impressões no Search Console em
30 páginas. Temporada: Pix.

## 5. Divisão de trabalho permanente

| Quem | Faz | Não faz |
|---|---|---|
| **Lovable** | Telas, rotas, hooks, migrations do app, deploy de edge functions | Dados externos, SEO estático, conteúdo |
| **Cowork (Claude)** | Ingestão DIRPS, taxonomia, geradores (pSEO/Reels), auditorias, calibração de prompts, planos | Reescrever telas que a Lovable faz melhor/mais barato |
| **Breno** | Gravar/postar, responder DM, grupos, decidir preço/nome, estudar na trilha (QA) | — |

## 6. Sequência imediata (ordem de execução)

1. Breno: commit + push do que está pronto (destrava deploy do corretor).
2. Breno: calibrar corretor com a redação-teste (3 rodadas; 46-56/80).
3. Lovable: Fase 1 (prompts abaixo).
4. Cowork: teste de extração de 1 prova DIRPS + taxonomia UFU (fase 2 começa).
5. 16/07: EFTs chegam (tarefa agendada) → calibrar metas de folga + 51 páginas
   ganham "nota do último aprovado".
6. Cowork: gerador pSEO v1 (30 páginas) quando nome/domínio definido.
   ⚠ Decisão bloqueante do Breno: NOME + domínio.
7. Cowork: gerador de pautas de Reels v1 → Breno começa a postar (regra:
   nada fica 7 dias sem tocar um estranho).

## 7. Prompts prontos pra Lovable (colar um por vez, nesta ordem)

### Prompt 1 — Onboarding + perfil UFU
"O app está pivotando de ENEM para o Vestibular da UFU. Crie uma migration
adicionando `curso_ufu text` e `cota_ufu text` na tabela profiles. Refaça o
onboarding para ter uma única pergunta central: 'Qual curso você quer na UFU?'
com um select agrupado por campus usando os dados de `src/data/ufu/vestibular.ts`
(CURSOS_UFU), seguida de 'Em qual modalidade você concorre?' usando COTAS do
mesmo arquivo. Salve no perfil. Não mencione ENEM em nenhum texto do onboarding."

### Prompt 2 — Navegação e casca
"Remova todas as menções a ENEM da interface logada. A navegação (BottomNav e
TopNav) deve ter: Hoje, Questões, Redação, Perfil. O item Redação deve levar
para `/redacao-ufu` (a página `/redacao` antiga do ENEM deve redirecionar para
`/redacao-ufu`). Esconda da navegação: simulado ENEM, tema do dia ENEM e
flashcards. Não delete os arquivos dessas features ainda — só tire da navegação."

### Prompt 3 — Landing UFU
"Substitua a landing page atual (que é sobre ENEM) por uma landing sobre
passar no Vestibular da UFU. Hero: 'Quantos acertos te colocam dentro da UFU?'
com CTA pra `/ufu` (calculadora gratuita, sem cadastro). Seção 2: o insight de
que a UFU classifica 6 vezes mais candidatos que vagas para a 2ª fase, então
passar no corte não garante vaga — o produto treina o aluno pra passar com
folga. Seção 3: corretor de redação nos 5 critérios oficiais da banca DIRPS
(rubrica real do edital), com link pra `/redacao-ufu`. Seção 4: em breve,
trilha de questões por curso com os pesos oficiais. Estilo: o design system
atual (premium minimal preto/branco). Sem depoimentos falsos, sem números
inventados — só os dados reais que estão em `src/data/ufu/vestibular.ts`."

### Prompt 4 — Coluna exam nas questões (preparação fase 2)
"Crie uma migration adicionando a coluna `exam text not null default 'enem'`
na tabela questions, com índice em (exam, area). Atualize os hooks de estudo
(useStudySession, useDayBlocks, useStudySchedule) para filtrarem
`exam = 'ufu'`. Como ainda não há questões UFU no banco, a tela de questões
deve mostrar um estado vazio bonito: 'Banco de questões UFU chegando — estamos
etiquetando as provas oficiais da DIRPS'."

### Prompt 5 — Home "Hoje" com meta de folga
"Na página Hoje, adicione um cartão fixo no topo com a meta do aluno: busque
o curso_ufu do perfil, encontre o corte em CURSOS_UFU (cortes[cota_ufu]) de
`src/data/ufu/vestibular.ts` e calcule a meta = corte × 1.22 arredondado pra
cima. Mostre três zonas visuais: 'abaixo do corte', 'zona perigosa (passa na
1ª fase mas perde a vaga)' e 'folga (meta)'. Texto: 'Seu alvo não é o corte
(X acertos) — é passar com folga (Y acertos)'. Se o perfil não tem curso,
CTA pro onboarding."

---

*Fontes oficiais: Edital DIRPS 18/2026, Quadro de Pesos retificado (16/03/2026),
Nota de Corte 2ª Fase (12/06/2026) — portalselecao.ufu.br. Classificação Geral
esperada 15/07/2026 (coleta agendada).*
