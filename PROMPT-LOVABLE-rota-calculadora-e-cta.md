# Prompt para Lovable — Rota da calculadora + captura na calculadora + entrega do guia

Cole na Lovable DEPOIS do fix do ufu_leads (PROMPT-LOVABLE-fix-ufu-leads.md).

Contexto: o arquivo estático `public/ufu/index.html` (hub pSEO) sombreia a rota SPA
`/ufu` no acesso direto — hoje quem digita `/ufu` cai no hub estático, e só a
navegação interna renderiza a calculadora. Decisão: **/ufu é oficialmente o hub
estático de SEO; a calculadora passa a viver em /calculadora-ufu.**

## 1. Troca de rota em `src/App.tsx`

- `/calculadora-ufu` → renderiza `<CalculadoraUfu />` (hoje é um redirect pra /ufu — inverter).
- Remover a rota SPA `/ufu` (o estático assume). Se preferir manter fallback,
  `/ufu` → `<Navigate to="/calculadora-ufu" replace />` — mas ele quase nunca será
  atingido, pois o servidor serve o arquivo estático primeiro.
- Atualizar TODOS os links internos que apontam pra `/ufu` como calculadora
  (Landing, ListaUfu "Voltar ao Placar UFU", navegação, CTA do corretor etc.)
  para `/calculadora-ufu`. Buscar por `to="/ufu"` e `href="/ufu"` no projeto.
  ⚠ NÃO mexer em `/ufu/lista` nem em links para `/ufu/` com barra (hub estático).
- Se o card compartilhável (`src/lib/ufu/cardImage.ts`) imprime a URL
  `inteligenciatlas.com/ufu`, trocar para `inteligenciatlas.com/calculadora-ufu`.

## 2. Captura na calculadora (o momento mais quente do funil)

Em `src/pages/CalculadoraUfu.tsx`, logo APÓS o bloco de resultado (quando
`resultado` existe), adicionar um card de CTA:

- Título: **"Receber o guia de folga de {resultado.curso.nome}"**
- Texto: "Corte e meta por cota, onde cada acerto vale mais e o plano de 4 passos.
  De graça, no seu e-mail — e você é avisado quando abrir a pré-venda fundadora (20 vagas)."
- Botão → `Link` para `/ufu/lista?curso=<SLUG>&origem=calc`.
- O slug no formato do pSEO é derivável: slugify(`${nome}-${turno}-${cidade}`)
  (minúsculas, sem acento, espaços→hífen). Ex.: Medicina/Integral/Uberlândia →
  `medicina-integral-uberlandia`. Criar helper `slugCursoUfu(curso)` em
  `src/lib/ufu/` e usar.
- Registrar `trackUfu("calc_completed", { evento: "cta_lista_visto", curso: resultado.curso.id })`
  quando o card renderizar pela primeira vez.

## 3. `src/pages/ListaUfu.tsx` — origem + entrega do guia

- Ler query param `origem` (default `'pseo'`) e gravar no insert em vez do
  `'pseo'` fixo.
- Na tela de SUCESSO, adicionar o botão principal (acima de "Voltar ao Placar UFU"):
  **"Abrir meu guia de folga agora →"** apontando para
  `` `/ufu/guia/${curso}.html` `` — usar `<a href>` (arquivo estático, não rota SPA).
  Só mostrar se `curso` existir; sem curso, apontar para `https://inteligenciatlas.com/ufu/`.
  (Os 51 guias já existem em `public/ufu/guia/` — commitados no repo.)
- O texto de promessa pode virar: "O guia abre na hora + você recebe o aviso da
  pré-venda fundadora."

## 4. Verificação

1. `/calculadora-ufu` abre a calculadora; nenhum link interno aponta mais pra
   calculadora via `/ufu`.
2. Calcular uma nota → card "Receber o guia de folga de {curso}" aparece → clique
   leva pra `/ufu/lista?curso=<slug>&origem=calc` com o título certo.
3. Cadastro na lista → sucesso mostra "Abrir meu guia de folga agora" → abre
   `/ufu/guia/<slug>.html` com os números do curso.
4. Linha em `ufu_leads` tem `origem = 'calc'` quando veio da calculadora.
5. `public/ufu/` e `public/ufu/guia/` continuam no build publicado.
