

## Atualização da Paleta de Cores - /fundadores

### Paleta Definida pelo Usuário

| Elemento | Cor Atual | Nova Cor |
|----------|-----------|----------|
| Background da página | `#0a0a0a` (preto) | `#F5F5F5` (cinza claro) |
| Headline | `text-white` | `#111827` (grafite) |
| "50% de desconto" | gradient amber | `#111827` (grafite) ou manter destaque |
| Texto secundário | `text-gray-400` | `#6B7280` (cinza médio) |
| Texto leve (descrição) | - | `#9CA3AF` |
| Botão | `bg-foreground` | `#111827` com texto `#FFFFFF` |
| Vagas info | `text-muted-foreground` | `#6B7280` |

### Alterações no Hero (linhas 152-257)

**Linha 154** - Background:
```tsx
className="... bg-[#F5F5F5]"
```

**Linha 170** - Headline:
```tsx
className="... text-[#111827]"
```

**Linhas 182-183** - "50% de desconto":
```tsx
className="... text-amber-600"  // manter destaque dourado
```

**Linha 194** - Descrição:
```tsx
className="... text-[#9CA3AF] ..."
```

**Linha 214** - Botão:
```tsx
className="... bg-[#111827] text-white hover:bg-[#111827]/90 ..."
```

**Linhas 220, 223, 243, 254** - Textos informativos:
```tsx
text-[#6B7280]
```

### Detalhes Técnicos
- Usar cores hardcoded (`#111827`, `#F5F5F5`, etc.) para garantir consistência exata
- O gradiente rainbow do eyebrow permanece intacto
- O texto "50% de desconto" pode manter tom amber (`text-amber-600`) para destaque comercial, ou usar `#111827` se preferir uniformidade total

