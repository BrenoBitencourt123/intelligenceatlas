
## Plano: Snap Scroll entre Seções

### O que é
Implementar **scroll snapping** para que ao arrastar/rolar, a página "grude" automaticamente na próxima seção completa, criando uma navegação tipo apresentação de slides.

### Como funciona
Usar CSS nativo `scroll-snap-type` no container principal e `scroll-snap-align` em cada seção:

```css
/* Container */
.snap-container {
  scroll-snap-type: y mandatory;  /* snap vertical obrigatório */
  overflow-y: auto;
  height: 100vh;
}

/* Cada seção */
.snap-section {
  scroll-snap-align: start;
  min-height: 100vh;
}
```

### Mudanças no Código

**`src/pages/Founders.tsx`:**
1. Adicionar classes Tailwind ao container principal:
   ```tsx
   <div className="h-screen overflow-y-auto snap-y snap-mandatory">
   ```

2. Adicionar `snap-start` e `min-h-screen` em cada `<section>`:
   - Hero
   - Como funciona
   - Por que ser fundador
   - FAQ
   - CTA Final

3. Ajustar o footer para não ser uma seção de snap (ou incluí-lo na última seção)

### Comportamento Esperado
- Ao arrastar ou rolar levemente, a página "pula" automaticamente para a próxima seção
- Funciona em mobile (touch) e desktop (scroll wheel)
- Suave e nativo, sem JavaScript extra
