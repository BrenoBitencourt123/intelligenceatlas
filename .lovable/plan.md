
# Plano: Corrigir Versao Melhorada para Atender os Criterios de Analise

## Resumo do Problema

A funcao "Gerar versao melhorada" esta desconectada das analises feitas. A IA que reescreve nao recebe:
1. Os problemas identificados pelo checklist
2. As sugestoes de melhoria ("howToImprove")
3. As evidencias textuais com problemas ("textEvidence")

Por isso, a versao "melhorada" pode nao corrigir os problemas que a propria plataforma identificou, resultando em nota igual ou menor.

## Solucao Proposta

Passar as analises dos blocos como contexto para o endpoint de melhoria, garantindo que a IA saiba exatamente o que precisa corrigir.

## Mudancas Tecnicas

### 1. Atualizar o Endpoint improve-essay

**Arquivo:** `supabase/functions/improve-essay/index.ts`

**Mudancas:**
- Receber as analises de cada bloco junto com o texto
- Reformular o prompt para incluir os problemas identificados
- Instruir a IA a corrigir especificamente cada ponto do checklist nao atendido
- Garantir que os 5 elementos da proposta de intervencao estejam presentes na conclusao

**Novo formato de entrada:**
```typescript
{
  blocks: [
    {
      type: 'introduction',
      text: '...',
      analysis: {
        checklist: [
          { label: 'Tese identificavel', checked: false },
          // ...
        ],
        howToImprove: ['Tornar a tese mais explicita'],
        textEvidence: [
          { quote: '...', issue: '...', suggestion: '...' }
        ]
      }
    }
  ],
  theme?: string
}
```

**Novo prompt:**
- Listar explicitamente o que precisa ser corrigido por bloco
- Para a conclusao, exigir os 5 elementos (agente, acao, meio, finalidade, detalhamento)
- Instruir a IA a manter as ideias mas corrigir os pontos falhos

### 2. Atualizar o Frontend

**Arquivo:** `src/lib/ai.ts`

**Mudanca:**
- Passar as analises dos blocos para o endpoint
- Filtrar apenas os itens nao atendidos do checklist

**Arquivo:** `src/pages/Index.tsx`

**Mudanca:**
- Garantir que o handleGenerateImproved envie os blocos com suas analises

### 3. Refinar o Prompt do Sistema (improve-essay)

O novo prompt deve:
1. Receber uma lista explicita de "PROBLEMAS A CORRIGIR" por bloco
2. Para a conclusao, verificar e incluir os 5 elementos obrigatorios
3. Manter o tom didatico e nao adicionar informacoes que o aluno nao mencionou
4. Melhorar conectivos e coesao de forma consistente

### Exemplo de Prompt Reformulado

```text
Voce e um professor especialista em redacao ENEM. Reescreva a redacao do aluno corrigindo ESPECIFICAMENTE os problemas listados abaixo.

REGRAS:
- CORRIJA cada problema listado
- MANTENHA as ideias e argumentos do aluno
- NAO adicione informacoes novas
- Melhore conectivos e clareza

PROBLEMAS A CORRIGIR:

[INTRODUCAO]
- Tese esta implicita, precisa ser mais assertiva
- Falta conectivo inicial forte

[DESENVOLVIMENTO 1]
- Relacao causa-consequencia nao esta clara

[CONCLUSAO]
- Proposta de intervencao incompleta:
  - Agente: presente (Governo)
  - Acao: presente (investir)
  - Meio: presente (corredores exclusivos)
  - Finalidade: presente (reduzir desigualdades)
  - Detalhamento: FALTANDO - detalhar melhor o meio ou a acao

REDACAO ORIGINAL:
...

Reescreva garantindo que TODOS os problemas acima sejam corrigidos.
```

## Fluxo Corrigido

```text
[Aluno escreve] -> [Analisa blocos] -> [Checklist gerado]
                                              |
                                              v
                                   [Gerar versao melhorada]
                                              |
                                              v
                        [IA recebe texto + problemas identificados]
                                              |
                                              v
                           [Versao melhorada corrige os problemas]
```

## Resultado Esperado

1. A versao melhorada vai corrigir especificamente os pontos que a plataforma identificou como falhos
2. Ao reanalisar a versao melhorada, ela deve ter notas iguais ou maiores
3. O aluno consegue ver claramente a diferenca entre o original e a versao corrigida
4. Maior consistencia entre analise e melhoria

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/improve-essay/index.ts` | Refatorar prompt para receber e usar analises |
| `src/lib/ai.ts` | Passar analises para o endpoint |
| `src/pages/Index.tsx` | Nenhuma mudanca necessaria (ja passa os blocos) |
