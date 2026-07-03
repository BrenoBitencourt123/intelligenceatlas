# Redação-teste de calibração — corretor UFU

> Uso: colar em `/redacao-ufu` (gênero: **Artigo de opinião**, tema: "desafios
> da adoção no Brasil" — proposta real 2026/2) e comparar a correção com o
> gabarito de expectativa abaixo. A redação foi escrita DE PROPÓSITO como
> "mediana com defeitos plantados". Se o corretor der nota muito acima da
> faixa esperada, está bonzinho demais (recalibrar prompt); muito abaixo,
> rigoroso demais.

## Expectativa geral

**Faixa esperada: 46–56 / 80.** Banca rigorosa, não bondosa.

| Critério | Esperado | Por quê (defeitos plantados) |
|---|---|---|
| Proposta temática (20) | **15** | Trata do tema com recorte correto, mas o 3º parágrafo desliza pro tema amplo "abandono infantil" sem conectar à adoção (falha pontual, não tangenciamento). |
| Gênero do discurso (20) | **10–15** | Tem tese e conclusão, mas: sem título; 2º parágrafo escorrega pra tom de carta ("caro leitor, pense comigo") — falha de ESTILO. |
| Coesão e coerência (20) | **10** | Clichês plantados ("desde os primórdios", "a sociedade como um todo"), repetição de "adoção" sem retomada pronominal, contradição leve (diz que a fila é o maior problema, depois diz que o perfil exigido é o maior problema), progressão fraca no 3º parágrafo. |
| Convenções de escrita (12) | **6** | 6 desvios plantados (lista abaixo) + sintaxe majoritariamente simples. |
| Leitura motivadores/repertório (8) | **4** | Só menção genérica a "dados oficiais" sem diálogo real + repertório de bolso (citação decorada de Mandela sem função argumentativa). |

**Desvios de convenções plantados (o corretor deve achar ≥4 destes 6):**
1. "haviam muitas crianças" (concordância — haver impessoal)
2. "menas burocracia" (menas não existe)
3. "os brasileiros anseiam por adotar, mas prefere bebês" (concordância verbal)
4. "assistir o sofrimento" (regência — assistir a)
5. "porisso" (grafia — por isso)
6. Vírgula entre sujeito e verbo: "As famílias que esperam na fila, desistem"

**Não deve eliminar** (nenhuma condição de zero): tem 20+ linhas, atende tema
e gênero (com falhas), sem cópia, sem identificação.

---

## Texto (colar exatamente como está)

Desde os primórdios da humanidade, a adoção existe como forma de acolher quem não tem família. No Brasil, porém, esse gesto de amor enfrenta desafios enormes, como a fila de espera gigantesca e o perfil restrito desejado pelas famílias. É preciso discutir esse problema com urgência, pois a sociedade como um todo perde quando uma criança cresce sem lar.

Em primeiro lugar, os dados oficiais mostram que haviam muitas crianças esperando nos abrigos enquanto milhares de pretendentes aguardam na fila. Caro leitor, pense comigo: como pode sobrar criança e sobrar família ao mesmo tempo? A resposta está no perfil. Os brasileiros anseiam por adotar, mas prefere bebês recém-nascidos, brancos e sem irmãos, enquanto a maioria das crianças disponíveis é mais velha, negra e tem irmãos. Esse é o maior problema da adoção no país.

Além disso, o abandono infantil é uma realidade triste no Brasil. Muitas crianças sofrem violência e negligência em casa, e é impossível assistir o sofrimento delas sem se comover. Como disse Nelson Mandela, "a educação é a arma mais poderosa para mudar o mundo". As famílias que esperam na fila, desistem no meio do caminho porisso a burocracia é tão criticada. A fila de espera é o maior problema da adoção no país.

Portanto, é necessário que o poder público crie campanhas de incentivo à adoção tardia e reduza a burocracia com menas etapas no processo. A adoção precisa deixar de ser um sonho distante. Se cada família abrisse o coração para as crianças reais que esperam, e não para o filho ideal imaginado, a fila andaria e menos crianças cresceriam sozinhas.

---

## Protocolo de calibração

1. Rodar a correção 3× com o mesmo texto (temperatura 0.3 — deve variar pouco;
   se variar mais que 1 faixa em qualquer critério, reduzir temperatura ou
   endurecer o prompt).
2. Comparar com a tabela acima, critério a critério.
3. Sinais de corretor bonzinho: 20 em proposta; 15+ em coesão; 9+ em
   convenções (ele tem que CONTAR os 6 desvios); 6+ em leitura.
4. Testar também a versão evoluída: os 2 critérios-alvo devem ser
   coesão_coerencia e convencoes_escrita (os mais fracos em %), e o texto
   evoluído NÃO pode ganhar argumentos novos.
5. Repetir com uma redação boa de verdade (escrever uma 70+) pra checar o teto.
