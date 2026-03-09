

## Plano: Corrigir mismatch de nomes de área entre DB e código

### Problema
A tabela `questions` armazena áreas com nomes completos do ENEM:
- `Ciências Humanas e suas Tecnologias`
- `Ciências da Natureza e suas Tecnologias`
- `Linguagens, Códigos e suas Tecnologias`
- `Matemática e suas Tecnologias`

Mas o código inteiro (schedule, sessão de estudo, admin) usa chaves curtas: `humanas`, `natureza`, `linguagens`, `matematica`. Resultado: `.eq("area", "matematica")` retorna 0 questões.

### Solução
Normalizar os valores de `area` no banco para as chaves curtas via migração SQL. Isso alinha com o restante do sistema (schedule, importação, taxonomia) que já opera com chaves curtas.

**1. Migração SQL** — `UPDATE questions` para converter os 4 valores longos nos curtos:
```sql
UPDATE questions SET area = 'humanas' WHERE area = 'Ciências Humanas e suas Tecnologias';
UPDATE questions SET area = 'natureza' WHERE area = 'Ciências da Natureza e suas Tecnologias';
UPDATE questions SET area = 'linguagens' WHERE area ILIKE 'Linguagens%';
UPDATE questions SET area = 'matematica' WHERE area ILIKE 'Matemática%';
```

Também normalizar `user_topic_profile.area` que tem o mesmo problema (vimos `"Ciências da Natureza e suas Tecnologias"` nos dados do usuário).

**2. Corrigir o fluxo de importação** — Garantir que a edge function `import-enem-api` e `parse-exam-pdf` gravem as chaves curtas (verificar se já fazem isso).

Nenhuma mudança de código no frontend é necessária, pois ele já usa as chaves curtas corretamente. O problema é exclusivamente nos dados do banco.

### Impacto
- Sessão de estudo passa a encontrar questões corretamente por área
- Filtro de área no Admin funciona
- Mapa de tópicos do usuário fica consistente

