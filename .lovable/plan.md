
# Correção do Ícone + Etapa 2: Persistência de Redações

## Parte 1: Correção Rápida do Ícone

Atualizar a imagem na página de cadastro para usar a URL correta do favicon (igual foi feito no Login).

**Arquivo:** `src/pages/Signup.tsx` (linha 83)
- De: `/lovable-uploads/1770063094363-favicon.ico`
- Para: `https://storage.googleapis.com/gpt-engineer-file-uploads/f4QJ9UCag0bQmfSQvlHZMs1PDKy2/uploads/1770063094363-favicon.ico`

---

## Parte 2: Persistência de Redações

Quando o usuário clicar em "Analisar tudo" na página de redação, os dados serão salvos no banco vinculados ao usuário logado.

### O que será implementado:

1. **Modificar o fluxo de análise** (`src/pages/Essay.tsx`)
   - Após a análise ser concluída, salvar no banco:
     - Tema da redação
     - Blocos de texto (introdução, desenvolvimento, conclusão)
     - Resultado completo da análise (JSON)
     - Nota total (0-1000)

2. **Criar função para salvar redação**
   - Inserir na tabela `essays` com o `user_id` do usuário logado
   - A data de análise (`analyzed_at`) será preenchida automaticamente

3. **Adicionar feedback visual**
   - Toast de sucesso quando a redação for salva
   - Tratamento de erros se falhar

### Fluxo após implementação:

```
Usuário escreve redação
        ↓
Clica em "Analisar tudo"
        ↓
IA analisa e retorna resultado
        ↓
Sistema salva no banco (essays)
        ↓
Dashboard mostra estatísticas reais
```

---

## Detalhes Técnicos

### Estrutura do INSERT

```typescript
await supabase.from('essays').insert({
  user_id: user.id,
  theme: currentTheme,
  blocks: blocksData,
  analysis: analysisResult,
  total_score: calculatedScore,
  analyzed_at: new Date().toISOString()
});
```

### Cálculo da Nota Total

A nota será calculada somando as competências:
- C1 + C2 + C3 + C4 + C5 = Total (máximo 1000)

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Signup.tsx` | Corrigir URL do ícone |
| `src/pages/Essay.tsx` | Adicionar lógica para salvar análise no banco |
| `src/hooks/useEssayState.ts` | Adicionar função `saveEssay` se necessário |

Após esta etapa, as redações analisadas ficarão gravadas no banco e poderemos implementar a Etapa 3 (Dashboard com dados reais).
