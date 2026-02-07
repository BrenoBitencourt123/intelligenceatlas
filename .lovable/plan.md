

## Corrigir o botao "Refazer" e salvar ambas as tentativas no historico

### Problema atual

Quando o usuario clica em "Refazer", o `resetAll()` limpa o editor local (localStorage), mas o `hasWrittenToday` continua `true` porque vem do banco de dados. Resultado: a tela continua mostrando o card compacto "Redacao concluida" em vez de reabrir o editor.

### O que muda

1. **Ambas as redacoes ficam no historico** -- a primeira tentativa ja esta salva no banco. Ao clicar em "Tentar novamente", o editor reabre limpo para uma nova tentativa, que ao ser analisada tambem sera salva como um registro separado no historico.

2. **Renomear o botao** -- trocar "Refazer" por "Tentar novamente", com icone mais adequado (seta pra frente em vez de "desfazer").

3. **O editor reabre de verdade** -- ao clicar, o estado local e resetado e um override temporario ignora o `hasWrittenToday` do banco, permitindo que o editor completo apareca novamente.

### Alteracoes

**1. `src/pages/Essay.tsx`**
- Criar um estado local `redoOverride` (booleano, inicia como `false`)
- Calcular `effectiveHasWrittenToday = hasWrittenToday && !redoOverride`
- Criar funcao `handleRedo` que seta `redoOverride = true` e chama `resetAll()`
- Passar `effectiveHasWrittenToday` para o `PedagogicalSection` no lugar de `hasWrittenToday`
- Passar `handleRedo` como `onRedo`

**2. `src/components/atlas/ThemeCard.tsx`**
- Trocar o texto do botao de "Refazer" para "Tentar novamente"
- Trocar o icone de `RotateCcw` para `RefreshCw` (ou manter `RotateCcw` mas com texto atualizado, conforme preferencia)

### Detalhes tecnicos

Fluxo atual (com bug):

```text
Clique em "Refazer"
  -> onRedo() = resetAll()
    -> limpa localStorage
    -> hasWrittenToday (do banco) ainda e true
    -> PedagogicalSection mostra card compacto
    -> editor nao reabre
```

Fluxo corrigido:

```text
Clique em "Tentar novamente"
  -> handleRedo()
    -> redoOverride = true
    -> resetAll() (limpa localStorage)
    -> effectiveHasWrittenToday = true && !true = false
    -> PedagogicalSection mostra editor completo
    -> usuario escreve nova tentativa
    -> ao analisar, nova redacao e salva como registro separado no banco
```

Nenhuma alteracao no banco de dados e necessaria. A primeira redacao ja esta salva. A segunda sera salva automaticamente pela logica existente de `saveEssayToDatabase` quando o usuario analisar a nova tentativa.

