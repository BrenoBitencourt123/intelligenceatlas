
# Plano: Simplificar Bloqueio da Secao Pedagogica

## Problema Identificado

Atualmente, quando o usuario e do Plano Basico, todos os 4 cards (Tema, Contexto, Perguntas, Estrutura) sao renderizados com blur e overlay. Isso:

1. Ocupa muito espaco vertical na pagina
2. Cria confusao - usuario pode pensar que o editor tambem esta bloqueado
3. Experiencia visual ruim com muito conteudo borrado

## Solucao Proposta

Substituir a abordagem de overlay por um **card unico e compacto** quando o plano for Basico:

```text
ANTES (Plano Basico):
+------------------------------------------+
| [Tema do Dia - BLUR]                     |
| [Contexto - BLUR]        OVERLAY GRANDE  |
| [Perguntas - BLUR]       cobrindo tudo   |
| [Estrutura - BLUR]                       |
+------------------------------------------+

DEPOIS (Plano Basico):
+------------------------------------------+
| [CADEADO] Orientacao de Redacao          |
|                                          |
| O Plano Pro oferece tema diario,         |
| contexto, perguntas e estrutura          |
| sugerida para guiar sua redacao.         |
|                                          |
| [ Ver Plano Pro -> ]                     |
+------------------------------------------+
```

## Mudancas Necessarias

### 1. Criar Novo Componente: LockedPedagogicalCard

Arquivo: `src/components/atlas/LockedPedagogicalCard.tsx`

Card compacto que substitui toda a secao pedagogica para usuarios Basico:
- Icone de cadeado
- Titulo "Orientacao de Redacao"
- Texto explicativo curto sobre os beneficios do Pro
- Lista resumida do que esta incluido (tema, contexto, perguntas, estrutura)
- Botao "Ver Plano Pro"

### 2. Modificar PedagogicalSection

Arquivo: `src/components/atlas/PedagogicalSection.tsx`

Mudar a logica de:
```typescript
// ANTES
if (isLocked) {
  return <LockedOverlay>{content}</LockedOverlay>;
}
return content;
```

Para:
```typescript
// DEPOIS
if (isLocked) {
  return <LockedPedagogicalCard />;
}
return content;
```

### 3. Remover LockedOverlay (Opcional)

O componente `LockedOverlay` pode ser mantido para uso futuro ou removido se nao for mais necessario.

## Design do Card Compacto

```text
+------------------------------------------+
|  [BOOK/SPARKLE ICON]                     |
|  ORIENTACAO DE REDACAO                   |
|                                          |
|  O Plano Pro oferece recursos para       |
|  guiar sua escrita:                      |
|                                          |
|  * Tema do dia automatico                |
|  * Contexto e fundamentacao              |
|  * Perguntas norteadoras                 |
|  * Estrutura sugerida                    |
|                                          |
|  [ Ver Plano Pro  -> ]                   |
+------------------------------------------+
```

## Beneficios

1. **Clareza** - Usuario entende exatamente o que esta bloqueado
2. **Compacidade** - Ocupa muito menos espaco vertical
3. **UX melhor** - Editor fica visivel imediatamente abaixo
4. **Consistencia** - Mesmo padrao do LockedThemeCard na Home
5. **Performance** - Nao precisa renderizar 4 cards + blur + overlay

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/components/atlas/LockedPedagogicalCard.tsx` | Criar |
| `src/components/atlas/PedagogicalSection.tsx` | Modificar |
| `src/components/atlas/LockedOverlay.tsx` | Manter (pode ser util em outros contextos) |

## Resultado Esperado

- Usuario Basico ve um card compacto explicando os beneficios Pro
- Editor de blocos aparece logo abaixo, claramente acessivel
- Incentivo para upgrade sem confundir o usuario
- Interface limpa e objetiva
