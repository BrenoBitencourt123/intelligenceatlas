

## Plano: Scroll Indicator Badge

### O que vou adicionar

Um indicador de scroll no final da hero section com:

1. **Badge animado** com ícone de chevron apontando para baixo
2. **Texto "Arraste para baixo"** ou similar
3. **Animação de bounce sutil** para chamar atenção
4. **Fade out ao scrollar** para não ficar na tela quando irrelevante

### Estrutura

```
Hero Section
  └── ... conteúdo existente ...
  └── [NEW] Scroll Indicator
        ├── ChevronDown (ícone com bounce)
        └── "Veja mais abaixo"
```

### Posicionamento

- Posição absoluta no bottom da hero section
- Centralizado horizontalmente
- Espaçamento `bottom-6` no mobile, `bottom-10` no desktop
- A hero section passará a ter `min-h-screen` também no mobile (para o indicador fazer sentido)

### Animações

- **Bounce infinito** no ícone (animação CSS ou framer-motion)
- **Fade out** quando o usuário começa a scrollar (usando o `scrollY` já existente)

### Implementação técnica

1. Importar `ChevronDown` do lucide-react
2. Adicionar div posicionada absolutamente após o conteúdo do hero
3. Usar `motion.div` com `animate={{ y: [0, 8, 0] }}` para o bounce
4. Controlar opacidade baseado no scroll (já temos `scrollY` no componente)

