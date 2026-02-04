
# Plano de Melhorias de Interface

## 1. Card de Tema Concluído (Home)

**Problema**: Quando o usuário conclui a redação do dia, o card continua mostrando o tema completo, ocupando espaço desnecessário.

**Solução**: Criar uma versão compacta e sutil do card quando a redação já foi feita.

**Mudanças em `src/components/home/DailyThemeCard.tsx`:**
- Adicionar renderização condicional baseada em `hasWrittenToday`
- Quando concluído: card menor com ícone de check, texto "Redação do dia concluída" e botão "Ver correção"
- Remover exibição do tema completo neste estado
- Manter estilo visual sutil (sem borda destacada) para redações concluídas

---

## 2. Campo de Tema Editável (Editor)

**Problema**: O input do tema não pode ser apagado porque a lógica de value usa fallback para `state.theme` ou `dailyTheme.title`.

**Solução**: Ajustar a lógica do input para permitir campo vazio.

**Mudanças em `src/pages/Essay.tsx`:**
- Usar apenas `customTheme` como valor do input quando o usuário está editando
- Adicionar lógica para detectar se o input foi "tocado" pelo usuário
- Permitir limpar o campo completamente (voltando ao placeholder)
- Sincronizar corretamente o tema efetivo com o state

---

## 3. Truncamento do Tema no Histórico

**Problema**: O nome do tema ultrapassa a lateral do card na lista e no detalhe.

**Solução**: Aplicar truncamento com ellipsis (...) em ambos os lugares.

**Mudanças em `src/pages/History.tsx`:**
- Na lista de redações: já tem `truncate`, verificar se está funcionando corretamente
- No header do detalhe (linha 223-225): adicionar classe `line-clamp-2` para limitar a 2 linhas com ellipsis
- Garantir que `min-w-0` está presente para o truncate funcionar dentro de flex containers

---

## Detalhes Técnicos

```text
DailyThemeCard.tsx:
┌─────────────────────────────────────┐
│  Antes (hasWrittenToday = true)     │
│  ┌───────────────────────────────┐  │
│  │ TEMA DO DIA       [Concluída] │  │
│  │ "Tema completo aqui..."       │  │
│  │ [Ver correção →]              │  │
│  └───────────────────────────────┘  │
│                                     │
│  Depois (hasWrittenToday = true)    │
│  ┌───────────────────────────────┐  │
│  │ ✓ Redação do dia concluída    │  │
│  │   [Ver correção →]            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

Essay.tsx (tema input):
- Trocar: value={customTheme || state.theme || dailyTheme?.title || ''}
- Para: value controlado que permite apagar

History.tsx (detalhe):
- CardTitle: adicionar "line-clamp-2" para truncar em 2 linhas
```

## Arquivos a Modificar

1. `src/components/home/DailyThemeCard.tsx` - Card simplificado para tema concluído
2. `src/pages/Essay.tsx` - Lógica do input de tema
3. `src/pages/History.tsx` - Truncamento do título no detalhe
