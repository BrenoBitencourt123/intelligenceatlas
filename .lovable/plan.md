
## Ajustes de responsividade mobile — Founders.tsx

### Problemas identificados nas screenshots

1. **Título quebrado estranhamente**: "Membros Fundadores" aparece em cinza e separado, criando hierarquia visual confusa no mobile
2. **Quebra de linha forçada**: O `<br />` entre "20" e "Membros Fundadores" não funciona bem em telas estreitas
3. **Espaçamento excessivo**: `space-y-8` cria muito espaço vertical no mobile, empurrando conteúdo para fora da viewport

### Correções

**1. Título (linhas 163-173)**
- Remover o `<span className="text-muted-foreground">` — manter título todo em preto
- Remover `<br />` fixo, adicionar `<br className="hidden sm:block" />` para quebrar apenas no desktop
- Resultado mobile: "Seja um dos 20 Membros Fundadores" em uma ou duas linhas naturais, todo em preto

**2. Espaçamento do hero (linha 150)**
- Trocar `space-y-8` por `space-y-6 sm:space-y-8`
- Reduz espaço vertical no mobile, mantém confortável no desktop

**3. Tamanho da oferta (linhas 176-184)**
- Ajustar `text-2xl sm:text-3xl` para `text-xl sm:text-2xl lg:text-3xl`
- Evita texto muito grande no mobile que força quebras ruins

**4. Padding do hero (linha 148)**
- Adicionar `px-4 sm:px-5` — reduz padding lateral no mobile para dar mais espaço ao texto

### Resultado esperado
- Título limpo, sem confusão de cores, que quebra naturalmente
- Hierarquia visual clara mesmo em 320px
- Menos scroll necessário para ver CTA
- Mantém elegância do desktop

### Arquivo
- `src/pages/Founders.tsx` (linhas 148, 150, 163-173, 176-184)
