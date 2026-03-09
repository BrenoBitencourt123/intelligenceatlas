
Objetivo: impedir que a headline quebre em 3 linhas no mobile, mantendo impacto visual.

Diagnóstico rápido:
- Em `src/pages/Founders.tsx`, a headline já força 2 linhas com `<br />`, mas o trecho “Membros Fundadores” ainda quebra internamente por falta de largura.
- O tamanho atual (`text-[2.25rem]`) está grande para algumas larguras mobile (ex.: 360–390px), então o segundo bloco estoura e quebra.

Plano de ajuste:
1) Travar “Membros Fundadores” na mesma linha
- No segundo `<span>`, aplicar `inline-block whitespace-nowrap`.
- Trocar o texto para `Membros&nbsp;Fundadores` para evitar quebra entre as palavras.

2) Usar escala tipográfica fluida no mobile (sem perder destaque)
- No `<motion.h1>`, substituir o tamanho fixo mobile por `text-[clamp(1.95rem,8.5vw,2.2rem)]` (mantendo `sm:text-5xl lg:text-6xl`).
- Ajustar levemente `leading`/`tracking` para caber melhor sem “apertar” demais.

3) Garantir segurança para telas muito estreitas
- Adicionar fallback para telas pequenas (ex.: `max-[360px]:text-[1.85rem]`) se necessário, evitando overflow horizontal.

4) Validação visual
- Conferir a hero em 320, 360, 390 e 414px:
  - headline em exatamente 2 linhas;
  - sem quebra de “Membros Fundadores”;
  - sem scroll horizontal;
  - mantendo contraste e legibilidade do CTA/subheadline.

Detalhe técnico (arquivo único):
- `src/pages/Founders.tsx`
  - bloco Hero (`<motion.h1>` e segundo `<span>` da headline).
