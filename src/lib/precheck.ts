// Pre-check heuristics (no AI required)
import { BlockType, ChecklistItem } from '@/types/atlas';

// Common connectives in Portuguese
const CONNECTIVES = [
  'portanto', 'além disso', 'contudo', 'entretanto', 'todavia', 'no entanto',
  'por conseguinte', 'assim', 'dessa forma', 'desse modo', 'nesse sentido',
  'em suma', 'por fim', 'logo', 'então', 'consequentemente', 'outrossim',
  'ademais', 'porém', 'embora', 'ainda que', 'mesmo que', 'conquanto',
  'posto que', 'visto que', 'uma vez que', 'já que', 'porque', 'pois',
  'haja vista', 'com efeito', 'de fato', 'certamente', 'indubitavelmente',
  'primeiramente', 'em primeiro lugar', 'em segundo lugar', 'por outro lado',
  'sob essa perspectiva', 'sob essa ótica', 'diante disso', 'nesse contexto',
];

// Cause-effect indicators
const CAUSE_EFFECT = [
  'causa', 'efeito', 'consequência', 'resultado', 'provoca', 'gera', 'leva a',
  'acarreta', 'implica', 'desencadeia', 'origina', 'motiva', 'ocasiona',
  'por causa de', 'em razão de', 'devido a', 'em virtude de', 'graças a',
  'em decorrência', 'como resultado', 'como consequência',
];

// Example indicators
const EXAMPLE_INDICATORS = [
  'por exemplo', 'exemplo', 'como', 'tal como', 'assim como', 'a exemplo de',
  'ilustra', 'demonstra', 'comprova', 'evidencia', 'segundo', 'de acordo com',
  'conforme', 'dados', 'estatística', 'pesquisa', 'estudo', 'ibge', 'onu',
  'unesco', 'ministério', 'instituto', '%', 'milhões', 'bilhões', 'milhares',
];

// Proposal elements (for conclusion)
const PROPOSAL_ELEMENTS = {
  agent: ['governo', 'estado', 'poder público', 'ministério', 'secretaria', 
          'ong', 'mídia', 'escola', 'família', 'sociedade', 'empresa', 
          'instituição', 'órgão', 'autoridade', 'população'],
  action: ['deve', 'devem', 'precisa', 'precisam', 'necessita', 'é necessário',
           'é preciso', 'criar', 'implementar', 'desenvolver', 'promover',
           'garantir', 'assegurar', 'estabelecer', 'instituir', 'elaborar',
           'ampliar', 'investir', 'fiscalizar', 'regulamentar'],
  means: ['por meio de', 'através de', 'mediante', 'por intermédio de', 
          'com', 'usando', 'utilizando', 'via', 'campanhas', 'políticas',
          'leis', 'projetos', 'programas', 'ações', 'medidas', 'investimento'],
  purpose: ['para que', 'a fim de', 'com o objetivo de', 'visando', 
            'com a finalidade de', 'de modo que', 'para', 'objetivando',
            'buscando', 'almejando', 'com o intuito de', 'com vistas a'],
};

const containsAny = (text: string, patterns: string[]): boolean => {
  const lowerText = text.toLowerCase();
  return patterns.some(p => lowerText.includes(p.toLowerCase()));
};

const containsNumber = (text: string): boolean => {
  return /\d/.test(text);
};

const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

export interface PrecheckResult {
  checklist: ChecklistItem[];
  score: number; // 0-100 partial score estimate
  suggestions: string[];
}

export const precheckIntroduction = (text: string): PrecheckResult => {
  const items: ChecklistItem[] = [];
  let score = 0;
  const suggestions: string[] = [];
  
  // Check for connectives
  const hasConnective = containsAny(text, CONNECTIVES);
  items.push({
    id: 'intro-connective',
    label: 'Uso de conectivo',
    checked: hasConnective,
    description: 'Conectivos ajudam a estruturar o texto',
  });
  if (hasConnective) score += 25;
  else suggestions.push('Considere usar conectivos para melhorar a coesão');
  
  // Check for thesis presence (simplified: sentences with clear positioning)
  const hasThesis = text.length > 50 && (
    containsAny(text, ['é', 'são', 'deve', 'devem', 'precisa', 'necessário', 'fundamental', 'essencial', 'importante'])
  );
  items.push({
    id: 'intro-thesis',
    label: 'Tese identificável',
    checked: hasThesis,
    description: 'Uma tese clara sobre o tema',
  });
  if (hasThesis) score += 35;
  else suggestions.push('Apresente sua posição sobre o tema de forma clara');
  
  // Check for contextualization
  const hasContext = countWords(text) >= 30;
  items.push({
    id: 'intro-context',
    label: 'Contextualização adequada',
    checked: hasContext,
    description: 'Introdução com contexto suficiente',
  });
  if (hasContext) score += 20;
  else suggestions.push('Desenvolva mais a contextualização do tema');
  
  // Check for proper length
  const wordCount = countWords(text);
  const goodLength = wordCount >= 40 && wordCount <= 100;
  items.push({
    id: 'intro-length',
    label: 'Tamanho adequado (40-100 palavras)',
    checked: goodLength,
    description: `${wordCount} palavras`,
  });
  if (goodLength) score += 20;
  else if (wordCount < 40) suggestions.push('Sua introdução está curta, considere desenvolvê-la mais');
  else suggestions.push('Sua introdução está extensa, considere ser mais conciso');
  
  return { checklist: items, score, suggestions };
};

export const precheckDevelopment = (text: string): PrecheckResult => {
  const items: ChecklistItem[] = [];
  let score = 0;
  const suggestions: string[] = [];
  
  // Check for connectives
  const hasConnective = containsAny(text, CONNECTIVES);
  items.push({
    id: 'dev-connective',
    label: 'Uso de conectivo',
    checked: hasConnective,
    description: 'Conectivos garantem coesão entre parágrafos',
  });
  if (hasConnective) score += 20;
  else suggestions.push('Inicie o parágrafo com um conectivo para melhorar a coesão');
  
  // Check for cause-effect
  const hasCauseEffect = containsAny(text, CAUSE_EFFECT);
  items.push({
    id: 'dev-cause-effect',
    label: 'Relação causa-efeito',
    checked: hasCauseEffect,
    description: 'Explicação das causas ou consequências',
  });
  if (hasCauseEffect) score += 25;
  else suggestions.push('Explique as causas ou consequências do problema');
  
  // Check for examples
  const hasExample = containsAny(text, EXAMPLE_INDICATORS) || containsNumber(text);
  items.push({
    id: 'dev-example',
    label: 'Exemplo concreto ou dado',
    checked: hasExample,
    description: 'Dados, estatísticas ou exemplos específicos',
  });
  if (hasExample) score += 30;
  else suggestions.push('Inclua dados, estatísticas ou exemplos para fortalecer seu argumento');
  
  // Check for proper length
  const wordCount = countWords(text);
  const goodLength = wordCount >= 60 && wordCount <= 150;
  items.push({
    id: 'dev-length',
    label: 'Tamanho adequado (60-150 palavras)',
    checked: goodLength,
    description: `${wordCount} palavras`,
  });
  if (goodLength) score += 25;
  else if (wordCount < 60) suggestions.push('Desenvolva mais sua argumentação');
  else suggestions.push('Seu parágrafo está extenso, foque nos pontos principais');
  
  return { checklist: items, score, suggestions };
};

export const precheckConclusion = (text: string): PrecheckResult => {
  const items: ChecklistItem[] = [];
  let score = 0;
  const suggestions: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Check for agent
  const hasAgent = containsAny(text, PROPOSAL_ELEMENTS.agent);
  items.push({
    id: 'conc-agent',
    label: 'Agente da ação',
    checked: hasAgent,
    description: 'Quem vai realizar a ação (ex: Governo, Ministério)',
  });
  if (hasAgent) score += 25;
  else suggestions.push('Especifique quem será responsável pela ação (ex: Governo, Ministério)');
  
  // Check for action
  const hasAction = containsAny(text, PROPOSAL_ELEMENTS.action);
  items.push({
    id: 'conc-action',
    label: 'Ação proposta',
    checked: hasAction,
    description: 'O que deve ser feito',
  });
  if (hasAction) score += 25;
  else suggestions.push('Deixe claro qual ação deve ser tomada');
  
  // Check for means
  const hasMeans = containsAny(text, PROPOSAL_ELEMENTS.means);
  items.push({
    id: 'conc-means',
    label: 'Meio/modo da ação',
    checked: hasMeans,
    description: 'Como a ação será realizada',
  });
  if (hasMeans) score += 25;
  else suggestions.push('Explique como a ação será realizada (por meio de...)');
  
  // Check for purpose
  const hasPurpose = containsAny(text, PROPOSAL_ELEMENTS.purpose);
  items.push({
    id: 'conc-purpose',
    label: 'Finalidade',
    checked: hasPurpose,
    description: 'Para que/qual objetivo',
  });
  if (hasPurpose) score += 25;
  else suggestions.push('Indique a finalidade da proposta (para que/a fim de)');
  
  return { checklist: items, score, suggestions };
};

export const runPrecheck = (type: BlockType, text: string): PrecheckResult => {
  if (!text.trim()) {
    return {
      checklist: [],
      score: 0,
      suggestions: ['Comece a escrever para ver o checklist automático'],
    };
  }
  
  switch (type) {
    case 'introduction':
      return precheckIntroduction(text);
    case 'development':
      return precheckDevelopment(text);
    case 'conclusion':
      return precheckConclusion(text);
  }
};

// Estimate total score based on precheck results and competencies
export const estimateScore = (
  blocks: { type: BlockType; text: string; status: string }[],
  competencies?: { score: number }[]
): number => {
  const analyzed = blocks.filter(b => b.status === 'analyzed');
  
  // If we have competency scores from AI analysis, use them
  if (competencies && competencies.length > 0) {
    const totalFromCompetencies = competencies.reduce((sum, c) => sum + c.score, 0);
    if (totalFromCompetencies > 0) {
      return totalFromCompetencies;
    }
  }
  
  if (analyzed.length === 0) {
    // Only precheck scores
    let totalPrecheckScore = 0;
    let validBlocks = 0;
    
    blocks.forEach(block => {
      if (block.text.trim()) {
        const result = runPrecheck(block.type, block.text);
        totalPrecheckScore += result.score;
        validBlocks++;
      }
    });
    
    if (validBlocks === 0) return 0;
    
    // Conservative estimate: precheck score as 60% of potential
    const avgPrecheck = totalPrecheckScore / validBlocks;
    return Math.round((avgPrecheck / 100) * 600); // Max 600 without AI analysis
  }
  
  // Fallback for analyzed blocks without competency data
  // This shouldn't happen in normal flow, but provides a reasonable default
  const hasIntro = analyzed.some(b => b.type === 'introduction');
  const hasDev = analyzed.some(b => b.type === 'development');
  const hasConclusion = analyzed.some(b => b.type === 'conclusion');
  
  let baseScore = 400; // Base for having content
  if (hasIntro) baseScore += 150;
  if (hasDev) baseScore += 200;
  if (hasConclusion) baseScore += 150;
  
  return Math.min(900, baseScore); // Cap at 900 without full competency calc
};
