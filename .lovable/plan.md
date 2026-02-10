
## Atlas Hub: Integrar Objetivas + Flashcards (Fase 1)

Transformar o Atlas em plataforma unica de estudo para o ENEM, adicionando modulo de questoes objetivas, flashcards com repeticao espacada, e uma tela "Hoje" que organiza o estudo diario.

---

### Nova estrutura de navegacao

A barra inferior (mobile) e o menu superior (desktop) mudam para:

| Posicao | Item | Icone | Rota |
|---------|------|-------|------|
| 1 | Hoje | CalendarCheck | / |
| 2 | Objetivas | ListChecks | /objetivas |
| 3 | Redacao | PenLine | /redacao |
| 4 | Perfil | User | /perfil |

- "Historico" sai da nav principal e fica acessivel via Perfil ou dentro de cada modulo
- Flashcards e Erros sao acessados como sub-telas dentro de "Hoje"

---

### Novas tabelas no banco de dados

**1. `questions` -- banco de questoes importadas**
- id (uuid, PK)
- user_id (uuid) -- quem importou
- year (integer) -- ano da prova
- area (text) -- matematica, linguagens, natureza, humanas
- number (integer) -- numero da questao na prova
- statement (text) -- enunciado
- alternatives (jsonb) -- [{letter: "A", text: "..."}, ...]
- correct_answer (text) -- "A", "B", etc.
- explanation (text, nullable) -- explicacao do gabarito
- image_url (text, nullable)
- tags (jsonb, default [])
- created_at (timestamptz)
- RLS: usuario so ve/edita as proprias questoes

**2. `question_attempts` -- respostas do usuario**
- id (uuid, PK)
- user_id (uuid)
- question_id (uuid, FK -> questions)
- session_date (date) -- dia da sessao
- selected_answer (text, nullable) -- "A"-"E" ou null (nao sei)
- is_correct (boolean)
- response_time_ms (integer, nullable)
- created_at (timestamptz)
- RLS: usuario so ve as proprias

**3. `flashcards` -- cards de repeticao espacada**
- id (uuid, PK)
- user_id (uuid)
- source_type (text) -- "question_error", "manual", "essay_tip"
- source_id (uuid, nullable) -- FK para question ou essay
- front (text) -- pergunta/conceito
- back (text) -- resposta/explicacao
- area (text, nullable) -- area do ENEM
- ease_factor (numeric, default 2.5) -- fator SRS
- interval_days (integer, default 1) -- intervalo atual
- next_review (date) -- proxima revisao
- review_count (integer, default 0)
- created_at (timestamptz)
- RLS: usuario so ve os proprios

**4. `flashcard_reviews` -- historico de revisoes**
- id (uuid, PK)
- user_id (uuid)
- flashcard_id (uuid, FK -> flashcards)
- rating (text) -- "forgot", "hard", "easy"
- reviewed_at (timestamptz, default now())
- RLS: usuario so ve as proprias

**5. `study_sessions` -- registro diario de estudo**
- id (uuid, PK)
- user_id (uuid)
- session_date (date)
- area (text) -- area estudada
- questions_answered (integer, default 0)
- correct_answers (integer, default 0)
- flashcards_reviewed (integer, default 0)
- duration_minutes (integer, default 0)
- created_at (timestamptz)
- RLS: usuario so ve as proprias

---

### Agenda semanal (logica fixa no frontend)

```text
Seg: Matematica (45 questoes)
Ter: Linguagens (45 questoes)
Qua: Natureza (45 questoes)
Qui: Humanas (45 questoes)
Sex: Redacao + revisao de flashcards
Sab: Simulado (90 questoes mistas)
Dom: Descanso ativo (apenas flashcards)
```

A area do dia e calculada no frontend com base no dia da semana (`getDay()`).

---

### Novos componentes e paginas

**Pagina `/` (Hoje) -- redesenhada**
- Card "Area de hoje" com nome da area, quantidade de questoes e CTA "Comecar"
- Card "Flashcards vencidos" com contagem e CTA "Revisar"
- Card "Redacao" (nos dias de redacao)
- Indicadores: questoes respondidas hoje, % acerto, streak, flashcards revisados
- Manter acesso ao tema do dia para usuarios Pro

**Pagina `/objetivas` (nova)**
- Tela de sessao de estudo
- Mostra 1 questao por vez com alternativas A-E + botao "Nao sei"
- Apos responder: exibir gabarito + explicacao + botao "Gerar flashcard" (se errou)
- Barra de progresso (ex: 15/45)
- Divisao em 3 blocos de 15 (aquecimento, aprendizado, consolidacao)

**Pagina `/flashcards` (nova, acessada via Hoje)**
- Interface de revisao tipo Anki
- Mostra frente do card
- Ao clicar "Mostrar resposta", exibe o verso
- 3 botoes: "Nao lembrei" (vermelho), "Com esforco" (amarelo), "Facil" (verde)
- Algoritmo SRS atualiza intervalo: facil dobra, esforco mantem, esqueci reseta

**Pagina `/importar` (nova, acessada via Perfil ou Objetivas)**
- Upload de PDF de prova ENEM
- Edge function com IA extrai questoes do PDF
- Preview das questoes extraidas antes de confirmar importacao
- Alternativa: colar JSON manual

**Componente de caderno de erros (sub-tela)**
- Lista questoes erradas agrupadas por area
- Filtro por nivel (N0 = errou, N1 = errou 2+ vezes)
- Cada erro mostra a questao, resposta do usuario e gabarito

---

### Novas edge functions

**1. `parse-exam-pdf`**
- Recebe PDF via upload
- Usa IA (Lovable AI, google/gemini-3-flash-preview) para extrair questoes
- Retorna array de questoes no formato padrao
- Cada questao: enunciado, alternativas, numero, area (inferida pela IA)

**2. `explain-question`**
- Recebe questao + alternativa selecionada
- Usa IA para gerar explicacao didatica
- Gera automaticamente o flashcard (front/back) se o usuario errou

---

### Hooks novos

- `useStudySchedule()` -- retorna area do dia, tipo de sessao (objetivas/redacao/descanso)
- `useQuestions(area)` -- busca questoes do banco para a area, seleciona 45 aleatorias
- `useFlashcards()` -- busca flashcards com next_review <= hoje
- `useStudyStats()` -- metricas: streak, acerto hoje, total revisado
- `useQuestionSession()` -- gerencia estado da sessao (questao atual, respostas, progresso)

---

### Ordem de implementacao

Dado o tamanho do projeto, recomendo dividir em sub-fases para voce ir testando:

**Sub-fase 1A: Infraestrutura**
- Criar todas as tabelas + RLS
- Atualizar navegacao (Hoje/Objetivas/Redacao/Perfil)
- Redesenhar tela "Hoje" com cards de area e flashcards
- Mover historico de redacoes para sub-tela

**Sub-fase 1B: Importacao + Objetivas**
- Edge function `parse-exam-pdf` para importar PDFs
- Tela de importacao
- Tela de sessao de objetivas (45 questoes, 1 por vez)
- Salvar tentativas no banco

**Sub-fase 1C: Flashcards + Erros**
- Tela de revisao de flashcards com SRS
- Geracao automatica de flashcard ao errar questao
- Caderno de erros
- Edge function `explain-question`

**Sub-fase 1D: Metricas unificadas**
- Streak diario (qualquer estudo conta)
- Dashboard com % acerto por area
- Progresso semanal

---

### Impacto no codigo existente

- A tela Home (`/`) muda completamente de layout
- A navegacao (BottomNav, TopNav) atualiza itens
- O historico de redacoes vira sub-tela (sem rota principal)
- A redacao (`/redacao`) continua funcionando igual
- Nenhuma tabela existente e alterada
- As edge functions existentes continuam intactas
