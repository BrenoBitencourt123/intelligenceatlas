
# Plano: Camada Pedagógica de Contexto

## Objetivo
Adicionar uma seção de apoio pedagógico acima dos blocos de escrita para reduzir bloqueio criativo e orientar o aluno, sem alterar nenhum comportamento do editor atual.

## O que será adicionado

### 1. Card: Tema do Dia (Fixo)
- Exibe o tema no formato ENEM com texto motivador
- Não editável pelo usuário
- Badge indicando "Tema liberado automaticamente no plano básico"
- Design destaque com ícone de calendário

### 2. Card: Contexto do Tema
- Texto conceitual explicando o problema social
- Foco em informar, não em dar modelo de redação
- Abordagem contextual sem estruturar como introdução
- Tom educacional e acolhedor

### 3. Card Colapsável: Perguntas Norteadoras
- Lista de 4-5 perguntas reflexivas
- Foco em estimular argumentação
- Texto auxiliar: "São apenas guias para reflexão"
- Inicia colapsado para não sobrecarregar visualmente

### 4. Card Colapsável: Estrutura Sugerida
- Checklist visual orientativo da estrutura ENEM
- Sem texto pronto, apenas orientação mental
- Itens: Introdução (contextualização + tese), Desenvolvimento 1 (argumento 1), etc.
- Inicia colapsado

## Layout Visual

```text
┌─────────────────────────────────────────────────────────────────────┐
│  📅 TEMA DO DIA                                  [Plano Básico]     │
│  ───────────────────────────────────────────────────────────────── │
│  "A persistência da violência contra a mulher na sociedade         │
│   brasileira"                                                       │
│                                                                     │
│  [Texto motivador ENEM - contextualização do tema]                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  💡 CONTEXTO DO TEMA                                                │
│  ───────────────────────────────────────────────────────────────── │
│  Explicação conceitual sobre o problema social abordado.           │
│  Dados relevantes e contexto histórico sem dar modelo de texto.    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ❓ PERGUNTAS NORTEADORAS                                    [▼]   │
├─────────────────────────────────────────────────────────────────────┤
│  • Quais são as principais causas desse problema?                  │
│  • Quem são os agentes responsáveis pela mudança?                  │
│  • Que exemplos ilustram essa realidade?                           │
│  • Qual seria uma proposta de intervenção viável?                  │
│                                                                     │
│  ⚠️ São apenas guias para reflexão, não há respostas certas.      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  📋 ESTRUTURA SUGERIDA                                       [▼]   │
├─────────────────────────────────────────────────────────────────────┤
│  ○ Introdução: Contextualizar tema + apresentar tese               │
│  ○ Desenvolvimento 1: Primeiro argumento + exemplos                │
│  ○ Desenvolvimento 2: Segundo argumento + exemplos                 │
│  ○ Conclusão: Proposta de intervenção (agente, ação, meio, fim)    │
└─────────────────────────────────────────────────────────────────────┘

─────────────────────────────────────────────────────────────────────

[ BLOCOS DE ESCRITA - Introdução, Dev 1, Dev 2, Conclusão ]
(Editor atual permanece 100% igual)
```

## O que NÃO muda
- Blocos de escrita (Introdução, Desenvolvimento, Conclusão)
- Botão "Analisar tudo" e seu comportamento
- Aba de Resumo e Competências
- Fluxo de análise e geração de versão melhorada
- Contabilização de uso (apenas no "Analisar tudo")
- Paleta de cores P&B
- Responsividade mobile

## Estrutura de Arquivos

```text
src/
├── components/
│   └── atlas/
│       ├── ThemeCard.tsx           ← Novo: Card do tema do dia
│       ├── ContextCard.tsx         ← Novo: Card de contexto
│       ├── GuidingQuestionsCard.tsx← Novo: Card de perguntas (colapsável)
│       ├── StructureGuideCard.tsx  ← Novo: Card de estrutura (colapsável)
│       ├── PedagogicalSection.tsx  ← Novo: Wrapper que agrupa os 4 cards
│       └── ... (existentes)
├── data/
│   └── dailyThemes.ts              ← Novo: Dados mockados de temas diários
└── pages/
    └── Index.tsx                   ← Apenas adiciona PedagogicalSection
```

---

## Detalhes Técnicos

### 1. Dados do Tema (dailyThemes.ts)
Estrutura de dados para temas mockados:
```typescript
interface DailyTheme {
  id: string;
  date: string;
  title: string;           // Tema principal
  motivatingText: string;  // Texto motivador estilo ENEM
  context: string;         // Contextualização do problema
  guidingQuestions: string[];
  structureGuide: StructureItem[];
}
```

### 2. ThemeCard.tsx
- Card destacado com ícone de calendário
- Exibe título do tema em destaque
- Texto motivador em blockquote
- Badge "Plano Básico" no canto

### 3. ContextCard.tsx
- Card simples com ícone de lâmpada
- Texto explicativo do contexto social
- Design clean, apenas informativo

### 4. GuidingQuestionsCard.tsx
- Usa Collapsible do Radix (já instalado)
- Lista de perguntas com bullet points
- Nota de rodapé explicativa
- Inicia fechado (defaultOpen={false})

### 5. StructureGuideCard.tsx
- Usa Collapsible do Radix
- Lista visual com círculos vazios (orientação, não checklist)
- Descrição breve de cada parte
- Inicia fechado

### 6. PedagogicalSection.tsx
- Componente wrapper que:
  - Recebe o tema do dia como prop
  - Renderiza os 4 cards em sequência
  - Adiciona espaçamento adequado
  - Responsivo (funciona em mobile)

### 7. Integração em Index.tsx
Mínima alteração:
```tsx
<div className="lg:w-[62%] space-y-4">
  {/* NOVA SEÇÃO - acima dos blocos */}
  <PedagogicalSection theme={dailyTheme} />
  
  {/* Blocos existentes - sem alteração */}
  {state.blocks.map((block) => (
    <BlockCard ... />
  ))}
</div>
```

### 8. Tema mockado inicial
Um tema de exemplo será incluído para demonstração:
- Tema: "A persistência da violência contra a mulher na sociedade brasileira"
- Com texto motivador, contexto, perguntas e estrutura

### 9. Estilização
- Segue paleta P&B existente
- Cards com borda sutil e fundo card
- Cards colapsáveis com animação suave
- Ícones lucide-react (Calendar, Lightbulb, HelpCircle, List)
