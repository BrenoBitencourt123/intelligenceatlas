// Atlas Types - Single source of truth for blocks and analysis

export type BlockType = 'introduction' | 'development' | 'conclusion';

// Token usage tracking for cost analysis
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

export type BlockStatus = 'empty' | 'draft' | 'analyzed' | 'unavailable';

export interface BlockAnalysis {
  summary: string; // 2-3 sentences didactic evaluation
  whyItMatters: string;
  checklist: ChecklistItem[];
  textEvidence: TextEvidence[];
  howToImprove: string[];
  strengths: string[];
  cohesionTip?: CohesionTip;
  tags: string[];
  timestamp: number;
  textHash: string; // For caching
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  description?: string;
}

export interface TextEvidence {
  quote: string;
  issue: string;
  suggestion: string;
}

export interface CohesionTip {
  current: string;
  suggested: string;
  explanation: string;
}

export interface Block {
  id: string;
  type: BlockType;
  order: number;
  title: string;
  text: string;
  status: BlockStatus;
  analysis?: BlockAnalysis;
  wordCount: number;
}

export interface Competency {
  id: 'c1' | 'c2' | 'c3' | 'c4' | 'c5';
  name: string;
  description: string;
  score: number; // 0-200
  explanation: string;
}

export interface EssayState {
  blocks: Block[];
  theme: string;
  totalScore: number;
  competencies: Competency[];
  improvedVersion?: string;
  showOriginal: boolean;
  analysisProgress: number; // 0-100
  lastSaved: number;
}

// Block title mapping
export const BLOCK_TITLES: Record<BlockType, string> = {
  introduction: 'Introdução',
  development: 'Desenvolvimento',
  conclusion: 'Conclusão',
};

// Competency definitions
export const COMPETENCY_DEFINITIONS: Omit<Competency, 'score' | 'explanation'>[] = [
  {
    id: 'c1',
    name: 'Competência 1',
    description: 'Domínio da norma culta da língua escrita',
  },
  {
    id: 'c2',
    name: 'Competência 2',
    description: 'Compreensão da proposta e aplicação de conceitos',
  },
  {
    id: 'c3',
    name: 'Competência 3',
    description: 'Seleção e organização de argumentos',
  },
  {
    id: 'c4',
    name: 'Competência 4',
    description: 'Conhecimento dos mecanismos linguísticos',
  },
  {
    id: 'c5',
    name: 'Competência 5',
    description: 'Proposta de intervenção detalhada',
  },
];

// Initial blocks for a new essay
export const createInitialBlocks = (): Block[] => [
  {
    id: 'intro-1',
    type: 'introduction',
    order: 0,
    title: 'Introdução',
    text: '',
    status: 'empty',
    wordCount: 0,
  },
  {
    id: 'dev-1',
    type: 'development',
    order: 1,
    title: 'Desenvolvimento 1',
    text: '',
    status: 'empty',
    wordCount: 0,
  },
  {
    id: 'dev-2',
    type: 'development',
    order: 2,
    title: 'Desenvolvimento 2',
    text: '',
    status: 'empty',
    wordCount: 0,
  },
  {
    id: 'conclusion-1',
    type: 'conclusion',
    order: 3,
    title: 'Conclusão',
    text: '',
    status: 'empty',
    wordCount: 0,
  },
];

// Initial competencies
export const createInitialCompetencies = (): Competency[] =>
  COMPETENCY_DEFINITIONS.map((def) => ({
    ...def,
    score: 0,
    explanation: 'Aguardando análise dos blocos.',
  }));
