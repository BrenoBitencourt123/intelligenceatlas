import type { Source } from '@/types/atlas';

export interface StructureItem {
  id: string;
  label: string;
  description: string;
}

export interface DailyTheme {
  id: string;
  date: string;
  title: string;
  motivatingText: string;
  context: string;
  guidingQuestions: string[];
  structureGuide: StructureItem[];
  sources?: Source[];
}

// Tema mockado para demonstração
export const currentTheme: DailyTheme = {
  id: 'theme-001',
  date: new Date().toISOString().split('T')[0],
  title: 'A persistência da violência contra a mulher na sociedade brasileira',
  motivatingText: `"A violência contra a mulher é todo ato de violência de gênero que resulte em dano físico, sexual, psicológico ou sofrimento para a mulher, incluindo ameaças, coerção ou privação arbitrária da liberdade, seja na vida pública ou privada." — Declaração da ONU sobre a Eliminação da Violência contra a Mulher (1993)

Segundo dados do Fórum Brasileiro de Segurança Pública, o Brasil registra, em média, um caso de feminicídio a cada 7 horas. A Lei Maria da Penha (Lei nº 11.340/2006) representa um avanço legislativo importante, mas os números revelam que o problema persiste em diferentes esferas da sociedade.`,
  context: `A violência contra a mulher é um fenômeno estrutural que atravessa todas as classes sociais, regiões e níveis de escolaridade no Brasil. Suas raízes estão em padrões históricos de desigualdade de gênero, em que a mulher foi historicamente relegada a papéis de subordinação.

Apesar dos avanços legais, como a Lei Maria da Penha e a tipificação do feminicídio, os dados mostram que a violência doméstica, o assédio no trabalho e nos espaços públicos, e a violência psicológica continuam sendo realidades cotidianas para milhões de brasileiras.

A subnotificação é um agravante: muitas vítimas não denunciam por medo, dependência econômica ou descrença no sistema de justiça. Compreender as causas estruturais e propor soluções eficazes é fundamental para enfrentar esse problema.`,
  guidingQuestions: [
    'Quais são as principais causas históricas e culturais que perpetuam a violência contra a mulher?',
    'Quem são os agentes (governo, sociedade, família, escolas) que podem atuar na transformação desse cenário?',
    'Que exemplos ou dados podem ilustrar a gravidade e a persistência do problema?',
    'Por que as leis existentes, como a Maria da Penha, não são suficientes para eliminar a violência?',
    'Qual proposta de intervenção seria viável, considerando agente, ação, meio e finalidade?',
  ],
  structureGuide: [
    {
      id: 'intro',
      label: 'Introdução',
      description: 'Contextualizar o tema + apresentar sua tese (posicionamento)',
    },
    {
      id: 'dev1',
      label: 'Desenvolvimento 1',
      description: 'Primeiro argumento com exemplos, dados ou referências',
    },
    {
      id: 'dev2',
      label: 'Desenvolvimento 2',
      description: 'Segundo argumento com exemplos, dados ou referências',
    },
    {
      id: 'conclusion',
      label: 'Conclusão',
      description: 'Proposta de intervenção: agente + ação + meio + finalidade',
    },
  ],
};

// Função para obter tema do dia (futuramente pode buscar de API)
export const getDailyTheme = (): DailyTheme => {
  return currentTheme;
};
