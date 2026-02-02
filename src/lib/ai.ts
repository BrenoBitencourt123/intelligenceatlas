// AI integration for Atlas - Real API calls to edge functions
import { BlockType, BlockAnalysis, TokenUsage } from '@/types/atlas';
import { hashText } from './storage';
import { supabase } from '@/integrations/supabase/client';

// Response type including token usage
export interface AnalyzeBlockResponse {
  analysis: BlockAnalysis;
  usage: TokenUsage | null;
}

export interface ImproveEssayResponse {
  improvedText: string;
  usage: TokenUsage | null;
}

// Analyze a single block using AI
export const analyzeBlock = async (
  blockType: BlockType,
  text: string,
  theme?: string
): Promise<AnalyzeBlockResponse> => {
  const { data, error } = await supabase.functions.invoke('analyze-block', {
    body: { blockType, text, theme },
  });

  if (error) {
    console.error('Analyze block error:', error);
    throw new Error(error.message || 'Erro ao analisar bloco');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  const analysis = data.analysis;
  
  // Add timestamp and hash for caching
  return {
    analysis: {
      ...analysis,
      timestamp: Date.now(),
      textHash: hashText(text),
    },
    usage: data.usage || null,
  };
};

// Generate improved version of the essay with analysis context
export const generateImprovedVersion = async (
  blocks: { type: BlockType; text: string; analysis?: BlockAnalysis }[],
  theme?: string
): Promise<ImproveEssayResponse> => {
  // Prepare blocks with analysis data for the API
  const blocksWithAnalysis = blocks.map(block => ({
    type: block.type,
    text: block.text,
    analysis: block.analysis ? {
      checklist: block.analysis.checklist,
      howToImprove: block.analysis.howToImprove,
      textEvidence: block.analysis.textEvidence,
    } : undefined,
  }));

  const { data, error } = await supabase.functions.invoke('improve-essay', {
    body: { blocks: blocksWithAnalysis, theme },
  });

  if (error) {
    console.error('Improve essay error:', error);
    throw new Error(error.message || 'Erro ao gerar versão melhorada');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    improvedText: data.improvedText,
    usage: data.usage || null,
  };
};

// Response type for competency evaluation
export interface EvaluateCompetenciesResponse {
  competencies: Array<{
    id: 'c1' | 'c2' | 'c3' | 'c4' | 'c5';
    score: number;
    explanation: string;
  }>;
  totalScore: number;
  overallFeedback: string;
  usage: TokenUsage | null;
}

// Evaluate competencies using AI - analyzes the full essay
export const evaluateCompetencies = async (
  blocks: { type: BlockType; text: string }[],
  theme?: string
): Promise<EvaluateCompetenciesResponse> => {
  const { data, error } = await supabase.functions.invoke('evaluate-competencies', {
    body: { blocks, theme },
  });

  if (error) {
    console.error('Evaluate competencies error:', error);
    throw new Error(error.message || 'Erro ao avaliar competências');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    competencies: data.competencies.map((c: { id: string; score: number; explanation: string }) => ({
      id: c.id as 'c1' | 'c2' | 'c3' | 'c4' | 'c5',
      score: c.score,
      explanation: c.explanation,
    })),
    totalScore: data.totalScore,
    overallFeedback: data.overallFeedback,
    usage: data.usage || null,
  };
};

// Legacy function - kept for backwards compatibility but now just returns placeholder
// Use evaluateCompetencies instead for AI-based evaluation
export const calculateCompetencies = (
  blocks: { type: BlockType; text: string; analysis?: BlockAnalysis }[]
) => {
  const hasContent = blocks.some(b => b.text.trim().length > 0);
  
  // Return placeholder competencies - actual scores come from evaluateCompetencies
  return [
    {
      id: 'c1' as const,
      name: 'Competência 1',
      description: 'Domínio da norma culta da língua escrita',
      score: 0,
      explanation: hasContent ? 'Clique em "Analisar todos" para avaliação por IA.' : 'Aguardando texto.',
    },
    {
      id: 'c2' as const,
      name: 'Competência 2',
      description: 'Compreensão da proposta e aplicação de conceitos',
      score: 0,
      explanation: hasContent ? 'Clique em "Analisar todos" para avaliação por IA.' : 'Aguardando texto.',
    },
    {
      id: 'c3' as const,
      name: 'Competência 3',
      description: 'Seleção e organização de argumentos',
      score: 0,
      explanation: hasContent ? 'Clique em "Analisar todos" para avaliação por IA.' : 'Aguardando texto.',
    },
    {
      id: 'c4' as const,
      name: 'Competência 4',
      description: 'Conhecimento dos mecanismos linguísticos',
      score: 0,
      explanation: hasContent ? 'Clique em "Analisar todos" para avaliação por IA.' : 'Aguardando texto.',
    },
    {
      id: 'c5' as const,
      name: 'Competência 5',
      description: 'Proposta de intervenção detalhada',
      score: 0,
      explanation: hasContent ? 'Clique em "Analisar todos" para avaliação por IA.' : 'Aguardando texto.',
    },
  ];
};
