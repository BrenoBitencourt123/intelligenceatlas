# Prompt para Lovable — Página /passe (a oferta permanente)

⏳ GATILHO PRA COLAR ESTE PROMPT: pré-venda fundadora concluída (as 20 vagas
ou o deadline). Antes disso o passe se vende no grupo/DM de propósito.

Contexto: quem chegar depois da pré-venda precisa de onde comprar sem DM.
Página pública `/passe`, marca Placar UFU, um objetivo só: o clique no checkout.

## 1. Config
Adicionar em `src/lib/ufu/config.ts`:
```ts
CHECKOUT_PASSE: "",          // Payment Link Stripe do passe — Breno preenche
PASSE_PRECO: "249",          // pós-fundadores
PASSE_VAGAS_FUNDADORAS_ESGOTADAS: true,
```

## 2. Estrutura da página (nesta ordem — é um argumento, não um catálogo)

1. **Hero:** "Passe até a prova — UFU 2027/2". Sub: "Tudo que você precisa
   pra passar com folga em {select do curso — personaliza a página}:
   pagamento único, sem mensalidade."
2. **O vilão (2 parágrafos):** a UFU classifica ~6× as vagas. Passar no
   corte não é vaga. O Placar treina você pra meta com folga — corte +22%
   do SEU curso (mostrar o número real do curso selecionado).
3. **O que está dentro (stack):** trilha da folga pelos pesos do curso ·
   banco de questões oficiais UFU classificadas · simulados completos com
   timer de prova · 4 correções de redação/mês na rubrica DIRPS · grupo
   fechado até a prova. Cada item com 1 linha de benefício, não feature.
4. **Ancoragem:** "Um cursinho em Uberlândia custa R$ 1.000+ POR MÊS, e
   prepara pra ENEM genérico. O passe custa menos que um mês disso — o ano
   inteiro, específico da UFU." + preço grande: R$ {PASSE_PRECO} único.
5. **Prova:** depoimentos dos fundadores (array em src/data/ufu/depoimentos.ts,
   começa vazio — renderizar a seção só se houver itens).
6. **Garantia:** 7 dias, devolução sem pergunta, destaque visual.
7. **FAQ (as objeções reais):** "funciona pra minha cota?" (sim — cortes por
   cota já no sistema) · "e se eu mudar de curso?" (troca livre) · "meu pai
   que paga — como explico?" (parágrafo pronto pro pai) · "até quando vale?"
   (dia da prova 2027/2).
8. **CTA final:** botão pro CHECKOUT_PASSE. Se vazio: "pré-venda em
   andamento — entre na lista" → /ufu/lista?origem=passe.

Instrumentar: trackUfu evento passe_visto e passe_click.

## 3. Verificação
1. /passe abre sem login, personaliza pelo curso, CTA abre o checkout.
2. Sem CHECKOUT_PASSE configurado, cai no fallback da lista.
3. Seção de depoimentos some quando o array está vazio.
