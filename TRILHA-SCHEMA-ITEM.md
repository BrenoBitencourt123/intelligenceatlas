# Schema canônico do item da Trilha (contrato do player)
> Gaveta da trilha · 11/07/2026. Este arquivo vira a base do prompt Lovable
> "migration + player" (entrega #3 do documento-mestre). O player renderiza
> QUALQUER item deste formato sem saber de qual matéria/nó ele veio.

## O item (JSON)

```json
{
  "id": "uuid",
  "no_id": "geo-setores-circulares",
  "nivel": 0,
  "ordem": 1,
  "tipo": "tocar | ligar | ordenar | completar | multipla",
  "enunciado": "Toque nos triângulos equiláteros.",
  "midia": { "svg": "<svg>...</svg>" },
  "opcoes": [
    { "id": "a", "texto": "…", "svg": null },
    { "id": "b", "texto": "…", "svg": null }
  ],
  "gabarito": ["a", "c"],
  "feedback_erro": "Equilátero = 3 lados iguais. Olha os tracinhos nos lados.",
  "feedback_acerto": "Isso. 3 lados iguais, 3 ângulos de 60°.",
  "explicacao_curta": "1 linha confirmando o caminho (mostrada mesmo no acerto)."
}
```

## Os 5 tipos e o que o player faz com cada um

| tipo | interação | gabarito | uso típico |
|---|---|---|---|
| `tocar` | toca em 1+ opções (com ou sem SVG) | ids corretos | Nível 0 — reconhecer |
| `ligar` | parear coluna A ↔ coluna B | pares `[["a1","b3"],…]` | Nível 1 — vocabulário |
| `ordenar` | arrastar itens pra ordem certa | sequência de ids | Nível 2 — passos de resolução |
| `completar` | escolher a opção que preenche a lacuna (`___` no enunciado) | id correto | Níveis 1-3 — fórmula/regra |
| `multipla` | alternativa única (formato prova) | id correto | Níveis 3-5 — estilo DIRPS |

Regras do player (valem pra todos):
1. Errou → mostra `feedback_erro` (1 linha de ENSINO, nunca "errou ✗") e
   deixa tentar de novo; 2º erro → destaca o gabarito com a legenda.
2. Acertou → `feedback_acerto` ou `explicacao_curta` por 2s (pega o chute).
3. Todo item alimenta `trilha_progresso` (item_id, acertou_1a, tentativas).
4. Sem timer no modo normal (timer só em simulado).
5. SVG sempre inline no JSON (gerado por código, determinístico).

## Tabelas (migration da entrega #3)

```sql
trilha_nos       (id text pk, disciplina text, titulo text, descricao text,
                  nivel_max int, pre_requisitos text[], peso_info jsonb,
                  ativo boolean default false)
trilha_itens     (id uuid pk, no_id ref, nivel int, ordem int, tipo text,
                  payload jsonb,           -- o item inteiro acima
                  needs_review boolean default true)
trilha_progresso (user_id ref, no_id ref, nivel_atual int, dourado boolean,
                  updated_at, pk (user_id, no_id))
trilha_respostas (user_id, item_id, acertou_primeira boolean, tentativas int,
                  created_at)              -- alimenta mastery e calibração
```

## Estados do nó (mapa)

`bloqueado` (pré-requisito aberto) → `disponivel` → `em_progresso`
→ `dourado` (acertou o cume Nível 5). Diagnóstico pinta `disponivel`/`pulado`
("provar que já sei": 3 itens `multipla` do nível 4-5; acertou 2+ → dourado
sem andar os níveis).
