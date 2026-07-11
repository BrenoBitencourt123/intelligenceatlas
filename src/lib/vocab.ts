// Vocabulário da trilha visível pro usuário. "Nó" é jargão interno e tem
// conotação negativa em PT (nó cego, nó na cabeça) — nunca vai pra tela.
// Rotas, colunas, tabelas e tipos permanecem com "no" (trilha_nos, /ufu/no/:id).

export const VOCAB = {
  fase: {
    singular: 'fase',
    Singular: 'Fase',
    plural: 'fases',
    Plural: 'Fases',
    completa: 'Fase completa',
    naoEncontrada: 'Fase não encontrada.',
    semItens: 'Esta fase ainda não tem exercícios.',
    termineAnterior: 'Termine a fase anterior primeiro.',
    novasEmBreve: 'Novas fases chegando em breve.',
    doradaFem: 'dourada',
  },
} as const;
