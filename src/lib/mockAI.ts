// Mock AI responses for MVP (replace with actual API calls)
import { BlockType, BlockAnalysis, Competency } from '@/types/atlas';
import { hashText } from './storage';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock block analysis
export const analyzeBlock = async (
  blockType: BlockType,
  text: string,
  _theme?: string
): Promise<BlockAnalysis> => {
  await delay(1500 + Math.random() * 1000);
  
  // Simulate occasional failures (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('AI temporarily unavailable');
  }
  
  const wordCount = text.trim().split(/\s+/).length;
  
  const analyses: Record<BlockType, () => BlockAnalysis> = {
    introduction: () => ({
      summary: 'Sua introdução apresenta o tema de forma clara e contextualizada. A tese está presente, mas pode ser mais assertiva. Considere usar dados ou referências históricas para fortalecer a contextualização.',
      whyItMatters: 'A introdução no ENEM deve contextualizar o tema e apresentar a tese. Uma introdução forte demonstra domínio do tema e orienta o leitor sobre sua argumentação.',
      checklist: [
        { id: 'ctx', label: 'Contextualização do tema', checked: wordCount > 30, description: 'Apresenta o contexto histórico/social' },
        { id: 'thesis', label: 'Tese clara', checked: true, description: 'Posicionamento definido' },
        { id: 'hook', label: 'Gancho inicial', checked: wordCount > 40, description: 'Elemento que capta atenção' },
      ],
      textEvidence: [
        {
          quote: text.substring(0, 50) + '...',
          issue: 'A abertura poderia ser mais impactante',
          suggestion: 'Considere iniciar com uma citação, dado estatístico ou referência histórica',
        },
      ],
      howToImprove: [
        'Adicione um dado estatístico para contextualizar a gravidade do problema',
        'Deixe sua tese mais explícita, indicando claramente sua posição',
        'Use um conectivo para fazer a transição para o desenvolvimento',
      ],
      strengths: ['Contextualização adequada', 'Linguagem formal'],
      tags: ['contextualização', 'tese', 'repertório'],
      timestamp: Date.now(),
      textHash: hashText(text),
    }),
    
    development: () => ({
      summary: 'O parágrafo apresenta argumentação coerente com uso de conectivos. Para fortalecer, inclua dados específicos ou citações de autoridades no assunto.',
      whyItMatters: 'Os parágrafos de desenvolvimento são avaliados nas Competências 3 e 4. Argumentos bem estruturados com evidências concretas são essenciais para uma nota alta.',
      checklist: [
        { id: 'conn', label: 'Conectivo inicial', checked: true, description: 'Ligação com parágrafo anterior' },
        { id: 'arg', label: 'Argumento central', checked: true, description: 'Ideia principal clara' },
        { id: 'evid', label: 'Evidência/exemplo', checked: wordCount > 50, description: 'Dados ou exemplos concretos' },
        { id: 'link', label: 'Relação com tema', checked: true, description: 'Conexão clara com a tese' },
      ],
      textEvidence: [
        {
          quote: text.substring(20, 70) + '...',
          issue: 'Argumento pode ser mais desenvolvido',
          suggestion: 'Adicione causa/consequência para aprofundar a análise',
        },
      ],
      howToImprove: [
        'Inclua dados estatísticos de fontes confiáveis (IBGE, ONU, etc.)',
        'Explique a relação de causa e efeito do problema',
        'Finalize com uma frase que conecte ao próximo parágrafo',
      ],
      strengths: ['Uso adequado de conectivos', 'Argumentação lógica'],
      cohesionTip: {
        current: 'Além disso',
        suggested: 'Nesse contexto, é fundamental ressaltar que',
        explanation: 'Conectivos mais elaborados demonstram maior domínio linguístico',
      },
      tags: ['argumentação', 'coesão', 'evidências'],
      timestamp: Date.now(),
      textHash: hashText(text),
    }),
    
    conclusion: () => ({
      summary: 'A conclusão apresenta proposta de intervenção, mas precisa detalhar melhor os elementos exigidos: agente, ação, meio e finalidade.',
      whyItMatters: 'A Competência 5 avalia a proposta de intervenção. Para nota máxima, você precisa de: agente, ação, meio, finalidade e detalhamento.',
      checklist: [
        { id: 'agent', label: 'Agente definido', checked: wordCount > 30, description: 'Quem vai agir (Governo, ONGs, etc.)' },
        { id: 'action', label: 'Ação proposta', checked: true, description: 'O que deve ser feito' },
        { id: 'means', label: 'Meio/modo', checked: wordCount > 50, description: 'Como será feito' },
        { id: 'purpose', label: 'Finalidade', checked: wordCount > 60, description: 'Para que/objetivo' },
        { id: 'detail', label: 'Detalhamento', checked: wordCount > 80, description: 'Especificação de um elemento' },
      ],
      textEvidence: [
        {
          quote: text.substring(0, 60) + '...',
          issue: 'Proposta precisa de mais detalhamento',
          suggestion: 'Especifique como a ação será realizada e quem será beneficiado',
        },
      ],
      howToImprove: [
        'Identifique claramente o agente: "O Ministério da Educação deve..."',
        'Detalhe o meio: "por meio de campanhas educativas..."',
        'Explicite a finalidade: "a fim de reduzir..."',
        'Adicione um elemento extra de detalhamento',
      ],
      strengths: ['Retoma a tese', 'Proposta presente'],
      tags: ['proposta', 'intervenção', 'C5'],
      timestamp: Date.now(),
      textHash: hashText(text),
    }),
  };
  
  return analyses[blockType]();
};

// Mock competencies calculation
export const calculateCompetencies = async (
  blocks: { type: BlockType; text: string; analysis?: BlockAnalysis }[]
): Promise<Competency[]> => {
  await delay(500);
  
  const analyzedBlocks = blocks.filter(b => b.analysis);
  const hasIntro = analyzedBlocks.some(b => b.type === 'introduction');
  const hasDev = analyzedBlocks.some(b => b.type === 'development');
  const hasConclusion = analyzedBlocks.some(b => b.type === 'conclusion');
  
  // Base scores
  let c1 = 120, c2 = 120, c3 = 120, c4 = 120, c5 = 80;
  
  // Adjust based on analyzed content
  if (hasIntro) {
    c1 += 20;
    c2 += 40;
  }
  if (hasDev) {
    c3 += 40;
    c4 += 40;
  }
  if (hasConclusion) {
    c5 += 80;
  }
  
  // Cap at 200
  c1 = Math.min(200, c1);
  c2 = Math.min(200, c2);
  c3 = Math.min(200, c3);
  c4 = Math.min(200, c4);
  c5 = Math.min(200, c5);
  
  return [
    {
      id: 'c1',
      name: 'Competência 1',
      description: 'Domínio da norma culta da língua escrita',
      score: c1,
      explanation: 'Poucos desvios gramaticais identificados. Continue atento à concordância e regência.',
    },
    {
      id: 'c2',
      name: 'Competência 2',
      description: 'Compreensão da proposta e aplicação de conceitos',
      score: c2,
      explanation: hasIntro ? 'Tema bem compreendido e repertório sociocultural presente.' : 'Analise a introdução para avaliação mais precisa.',
    },
    {
      id: 'c3',
      name: 'Competência 3',
      description: 'Seleção e organização de argumentos',
      score: c3,
      explanation: hasDev ? 'Argumentação organizada com progressão lógica.' : 'Analise os desenvolvimentos para avaliação mais precisa.',
    },
    {
      id: 'c4',
      name: 'Competência 4',
      description: 'Conhecimento dos mecanismos linguísticos',
      score: c4,
      explanation: hasDev ? 'Bom uso de conectivos e articulação entre partes.' : 'Analise os desenvolvimentos para avaliação mais precisa.',
    },
    {
      id: 'c5',
      name: 'Competência 5',
      description: 'Proposta de intervenção detalhada',
      score: c5,
      explanation: hasConclusion ? 'Proposta presente com elementos identificáveis. Detalhe mais para nota máxima.' : 'Analise a conclusão para avaliação da proposta.',
    },
  ];
};

// Mock improved version generation
export const generateImprovedVersion = async (
  blocks: { type: BlockType; text: string }[]
): Promise<string> => {
  await delay(3000);
  
  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error('AI temporarily unavailable');
  }
  
  // In a real implementation, this would call the AI
  // For now, return a mock improved version
  const improved = blocks.map(block => {
    const text = block.text.trim();
    if (!text) return '';
    
    // Simple mock improvement: add some formal phrases
    const improvements: Record<BlockType, string> = {
      introduction: `Diante do cenário contemporâneo, torna-se evidente a relevância de discutir ${text.substring(0, 50)}... Nesse contexto, é fundamental analisar os fatores que perpetuam tal problemática, bem como propor medidas eficazes para sua mitigação.`,
      development: `Sob essa perspectiva, é necessário destacar que ${text.substring(0, 50)}... Dados do IBGE corroboram essa análise, evidenciando a urgência de ações efetivas. Portanto, fica clara a necessidade de intervenções estruturadas.`,
      conclusion: `Diante do exposto, conclui-se que medidas são necessárias para enfrentar a problemática. O Governo Federal, por meio do Ministério da Educação, deve implementar políticas públicas educacionais, através de campanhas de conscientização nas escolas, a fim de formar cidadãos mais conscientes e reduzir os impactos negativos do problema apresentado.`,
    };
    
    return improvements[block.type];
  }).filter(Boolean).join('\n\n');
  
  return improved;
};
