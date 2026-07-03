---
created: 2026-05-14
author: claude (sessao com Breno)
purpose: memoria externa de contexto para sessoes futuras
---

# Indice de contexto - Inteligencia Atlas

Este diretorio guarda o que Claude precisa lembrar entre sessoes para nao recomecar do zero. Toda nova sessao deve **comecar lendo este indice** antes de propor qualquer trabalho.

## Arquivos

- `01_arquitetura_atlas.md` - stack, rotas, schema Supabase, edge functions, taxonomia
- `02_sistemas_core.md` - como funciona o sistema de objetivas e o de redacao hoje (fluxo do aluno + IA)
- `03_extracao_enem.md` - caminhos existentes de import de questoes (e por que o workflow manual atual eh redundante)
- `04_feedback_critico.md` - feedback honesto sobre o que esta bom, o que esta mal, o que falta
- `05_regras_byte_fidelidade.md` - **regras canônicas de extração (aplicar em toda prova)**

## Regras para Claude em sessoes futuras

1. Modo **somente-leitura** no codigo do Atlas (`src/`, `supabase/`) por padrao. So edita se Breno autorizar explicitamente.
2. Atualizar estes arquivos quando descobrir algo novo ou quando uma decisao for tomada.
3. Nao confiar em memoria propria - sempre verificar com Read/bash quando for fazer afirmacao tecnica.
4. Honestidade > educacao: apontar problema mesmo se for desconfortavel.

## Estado do projeto (snapshot 2026-05-14)

- Atlas em producao via Lovable, stack Vite+React+Supabase+Stripe+PWA.
- 24+ tabelas no Supabase, 25 edge functions.
- Sistema de objetivas: funcional, com taxonomia v2 canonica, classificacao automatica via IA, mastery bayesiano por dimensao.
- Sistema de redacao: funcional, com analise de 5 competencias ENEM + "versao melhorada" + tema diario gerado por IA.
- Freemium agressivo (free = 1 redacao/semana, 10 questoes/dia). Pro = R$? (nao li ainda) com 60 redacoes/mes + 2/dia + flashcards automaticos.
- Programa Fundadores ativo com desconto decrescente ate o ENEM.
- Existem 2 caminhos automatizados de import de questoes (`import-enem-api` via enem.dev e `parse-exam-pdf` via Gemini Vision) que tornam o workflow manual de extracao via scripts Python REDUNDANTE.

## Decisoes pendentes (pra discutir com Breno)

- [ ] Confirmar se o workflow de extracao manual ainda eh necessario, ou se podemos usar so as edge functions.
- [ ] Investigar qualidade do `generate-theme` - GPT-4.1-mini alucina URLs com frequencia.
- [ ] Discutir se cota free de 1 redacao/semana nao esta matando engajamento.
- [ ] Decidir se "criar/analisar proprias redacoes" significa novo fluxo ou expansao do atual.
