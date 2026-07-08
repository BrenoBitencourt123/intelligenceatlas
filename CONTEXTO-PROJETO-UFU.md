# CONTEXTO — Projeto Placar UFU (colar no início de conversas novas)

> Resumo vivo do projeto para dar contexto a uma conversa nova. Leia antes de
> agir. Documentos-mestres complementares (na pasta do projeto ou no sistema de
> questões): PLANO-MESTRE-UFU.md, MANUAL-EXTRACAO-PROVAS.md, TAXONOMIA-UFU.md.

## 1. O que é
Preparatório para o **Vestibular próprio da UFU** (Universidade Federal de
Uberlândia). Pivô de um app ENEM ("Atlas") que nunca vendeu. Breno é candidato
real (Engenharia Mecatrônica, prova ~maio/2027) — o produto é a ferramenta de
estudo dele E o negócio. Nome do produto: **Placar UFU**. Domínio vivo:
**inteligenciatlas.com** (serve o app). Marca-mãe: Atlas.

Tese: nicho pequeno mas comprador (aluno de escola particular, que foca em
vestibular, não ENEM). ~27 mil inscritos/edição. Mal atendido (só cursinho
genérico caro). Dados públicos da DIRPS organizados = fosso. Playbook
replicável depois (UEM, UEL, UFMG).

Insight central que nenhum concorrente comunica: a UFU classifica **6× as
vagas** para a 2ª fase → passar no corte da objetiva ≠ vaga. O produto vende
FOLGA (meta = corte + ~22%), não aprovação raspada.

## 2. Stack e divisão de trabalho
- App: Vite + React + TS + shadcn (origem Lovable) + Supabase + Stripe. Repo no
  GitHub: BrenoBitencourt123/intelligenceatlas.
- **Lovable** executa código do app (recebe prompts prontos; sincroniza via
  push no GitHub; deploya edge functions).
- **Cowork/Claude** faz dados (DIRPS), extração/classificação de provas, pSEO,
  conteúdo, auditorias, calibração de prompts, planos.
- **Breno** grava/posta, decide, estuda na trilha (dogfood).
- Segundo repo: "sistema para pegar questões" (React) — edita/recorta/publica
  questões no Supabase. Contém MANUAL-EXTRACAO-PROVAS.md, TAXONOMIA-UFU.md e o
  publishToAtlas.js.

## 3. O que JÁ está pronto (não refazer)
- **Calculadora de nota** pública, sem cadastro, em /ufu — dados oficiais DIRPS
  2026/2 (pesos retificados + cortes por curso/cota). Funil.
- **Card compartilhável** (PNG) + tracking de share (tabela ufu_events, view
  ufu_share_rate, meta ≥10%).
- **Corretor de redação UFU** (/redacao-ufu) — edge functions analyze-essay-ufu
  e improve-essay-ufu. Arquitetura "detetive + juiz": a IA coleta evidências,
  código aplica a rubrica oficial (Quadro 2 do edital, 5 critérios, 80 pts,
  faixas). Calibrado (redação mediana ~45/80). "Versão evoluída" = +1 faixa nos
  2 critérios mais fracos, anti-Grammarly.
- **Cartão de meta com folga** na home (corte × 1.22, 3 zonas: abaixo /
  zona perigosa / folga).
- **70 questões da prova UFU 2026/2 Tipo 1** publicadas: byte-fiéis, gabarito
  oficial definitivo, 20 imagens, notação matemática renderizada (\frac, \sqrt,
  \matrix, ^, _), classificadas por tópico/subtópico. Arquivo mestre:
  questoes_ufu_2026_2_FINAL.json (na pasta do sistema de questões).
- **Renderizador** (renderMath.tsx + QuestionContent.tsx no Atlas) suporta:
  fração, raiz, matriz, expoente, subscrito, **negrito**, bloco quote (poema).
  Asterisco único NÃO é itálico (desligado de propósito).
- **Playbook de extração**: MANUAL-EXTRACAO-PROVAS.md (visão-primeiro, regras de
  limpeza, notação, validador Python, classificação, caça-sobras-de-ENEM).

## 4. Estado atual / pendências conhecidas
- ⚠ **Confirmar** que as 70 publicadas vieram do FINAL.json (chip mostra
  "Geometria plana", não "Geral"; Q22 mostra fração, não `\frac` cru). Se veio
  o arquivo errado (questoes (8).json), re-publicar o FINAL por cima (upsert
  sobrescreve por user_id,number,year,foreign_language).
- ⚠ **Push do publishToAtlas.js** corrigido (grava área em CÓDIGO CURTO
  linguagens/matematica/natureza/humanas — o nome longo do AREA_MAP quebrava a
  busca da trilha `.eq('area','linguagens')`).
- Bug de área já resolvido na Lovable (a trilha serve questão UFU).
- Trilha usa "área do dia" (resíduo ENEM). Para UFU deveria ser "mix ponderado
  pelos pesos do curso do aluno" (fase 3 — trilha da folga). Ainda não feito.
- Taxonomia canônica existe em TAXONOMIA-UFU.md, mas NÃO foi portada para o
  taxonomy.ts do app (a etiquetagem em lote automática do app ainda usa a
  taxonomia ENEM). Classificamos a 1ª prova manualmente.
- Nome/domínio: Placar UFU + inteligenciatlas.com (app). pSEO precisa decidir
  subdomínio vs path.

## 5. Próximo bloco escolhido: AQUISIÇÃO
Risco nº 1 = repetir o Atlas (produto bom, ninguém conhece). Métrica da fase =
tamanho da lista de interesse.
- **Reels** (lote 1 pronto em _contexto/REELS-lote1-dado-proprietario.md): 10
  roteiros do pilar "quantos acertos pra passar em X" + os 51 cursos em
  _contexto/cursos_cortes.json. Formato faceless. CTA → calculadora.
- **pSEO** (a construir): gerador de HTML estático das páginas de nota de corte
  por curso (51), "quantos acertos pra passar em X", pesos por curso, prova
  resolvida. Deve ser HTML de verdade (não SPA) — Astro/gerador Node, deploy
  Cloudflare Pages/Netlify. Calculadora como ilha interativa. Validar com ~30
  páginas + Search Console 4-6 semanas antes de escalar. Deadline: indexar até
  set-out/2026.

## 6. Regras de execução (o sistema anti-Atlas)
- Nada fica 7 dias sem tocar um estranho — toda semana algo público.
- Uma métrica por fase (agora = lista de interesse).
- O vestibular é o chefe: dia mínimo = 1 sessão na trilha + 1 coisa pública.
- Testar antes de construir (pré-venda valida preço; 30 páginas validam pSEO).
- Modelo de negócio: grátis (calculadora + conteúdo) → avulso (correção
  R$ 9,90-14,90) → "Passe até a prova" (pagamento único, R$ 149 fundadores →
  R$ 249; NÃO assinatura mensal). Pré-venda fundadora: 20 vagas, gatilho 50+
  interessados.

## 7. Tarefa agendada
16/07/2026 15h: buscar a Classificação Geral UFU 2026/2 (EFTs finais por curso)
no portal DIRPS quando publicada. Salva em src/data/ufu/ + _contexto/.

---
*Última grande sessão: extração+classificação+publicação das 70 questões e
início da máquina de conteúdo. Para continuar aquisição: "vamos pro pSEO" ou
"gerar mais Reels".*
