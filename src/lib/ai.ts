// AI integration for Atlas - Real API calls to edge functions
import { BlockType, BlockAnalysis, TokenUsage } from '@/types/atlas';
import { hashText } from './storage';
import { supabase } from '@/integrations/supabase/client';

// Response type for unified essay analysis
export interface AnalyzeEssayResponse {
  blockAnalyses: Record<string, BlockAnalysis>;
  competencies: Array<{
    id: 'c1' | 'c2' | 'c3' | 'c4' | 'c5';
    score: number;
    explanation: string;
  }>;
  totalScore: number;
  overallFeedback: string;
  usage: TokenUsage | null;
}

export interface ImproveEssayResponse {
  improvedText: string;
  usage: TokenUsage | null;
}

// Unified analysis: analyzes all blocks + evaluates competencies in a single AI call
export const analyzeEssay = async (
  blocks: { id: string; type: BlockType; text: string }[],
  theme?: string
): Promise<AnalyzeEssayResponse> => {
  const { data, error } = await supabase.functions.invoke('analyze-essay', {
    body: { blocks, theme },
  });

  if (error) {
    console.error('Analyze essay error:', error);
    throw new Error(error.message || 'Erro ao analisar redação');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  // Add timestamp and hash to each block analysis for caching
  const blockAnalysesWithMeta: Record<string, BlockAnalysis> = {};
  for (const block of blocks) {
    const analysis = data.blockAnalyses[block.id];
    if (analysis) {
      blockAnalysesWithMeta[block.id] = {
        ...analysis,
        timestamp: Date.now(),
        textHash: hashText(block.text),
      };
    }
  }

  return {
    blockAnalyses: blockAnalysesWithMeta,
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

// Legacy function - kept for backwards compatibility but now just returns placeholder
// Use analyzeEssay instead for unified AI-based analysis
export const calculateCompetencies = (
  blocks: { type: BlockType; text: string; analysis?: BlockAnalysis }[]
) => {
  const hasContent = blocks.some(b => b.text.trim().length > 0);
  
  // Return placeholder competencies - actual scores come from analyzeEssay
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
