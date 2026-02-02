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

// Calculate competencies based on block analyses
export const calculateCompetencies = (
  blocks: { type: BlockType; text: string; analysis?: BlockAnalysis }[]
) => {
  const analyzedBlocks = blocks.filter(b => b.analysis);
  const hasIntro = analyzedBlocks.some(b => b.type === 'introduction');
  const hasDev = analyzedBlocks.some(b => b.type === 'development');
  const hasConclusion = analyzedBlocks.some(b => b.type === 'conclusion');
  
  // Aggregate checklist data from analyses
  let introChecks = 0, devChecks = 0, conclusionChecks = 0;
  let introTotal = 0, devTotal = 0, conclusionTotal = 0;
  
  for (const block of analyzedBlocks) {
    if (!block.analysis?.checklist) continue;
    
    const checked = block.analysis.checklist.filter(c => c.checked).length;
    const total = block.analysis.checklist.length;
    
    if (block.type === 'introduction') {
      introChecks += checked;
      introTotal += total;
    } else if (block.type === 'development') {
      devChecks += checked;
      devTotal += total;
    } else if (block.type === 'conclusion') {
      conclusionChecks += checked;
      conclusionTotal += total;
    }
  }
  
  // Calculate scores based on analysis completeness
  // Minimum score of 0.6 for analyzed blocks (AI may undermark checklist items)
  const introScore = introTotal > 0 
    ? Math.max(0.6, introChecks / introTotal) 
    : 0.5;
  const devScore = devTotal > 0 
    ? Math.max(0.6, devChecks / devTotal) 
    : 0.5;
  const conclusionScore = conclusionTotal > 0 
    ? Math.max(0.6, conclusionChecks / conclusionTotal) 
    : 0.5;
  
  // Combined score from all blocks for general competencies
  const avgScore = (introScore + devScore + conclusionScore) / 3;
  
  // Fairer formulas: structured essays deserve higher base scores
  // C1: Language mastery - evaluated across all blocks
  const c1 = Math.min(200, Math.round(
    100 + (hasIntro ? 25 : 0) + (hasDev ? 25 : 0) + (hasConclusion ? 25 : 0) + (avgScore * 25)
  ));
  
  // C2: Theme comprehension - mainly from introduction
  const c2 = Math.min(200, Math.round(
    80 + (hasIntro ? 60 : 0) + (introScore * 60)
  ));
  
  // C3: Argument organization - mainly from development
  const c3 = Math.min(200, Math.round(
    80 + (hasDev ? 60 : 0) + (devScore * 60)
  ));
  
  // C4: Cohesion mechanisms - evaluated across all blocks
  const c4 = Math.min(200, Math.round(
    80 + (hasDev ? 40 : 0) + (hasIntro ? 20 : 0) + (avgScore * 60)
  ));
  
  // C5: Intervention proposal - mainly from conclusion
  const c5 = Math.min(200, Math.round(
    60 + (hasConclusion ? 80 : 0) + (conclusionScore * 60)
  ));
  
  return [
    {
      id: 'c1' as const,
      name: 'Competência 1',
      description: 'Domínio da norma culta da língua escrita',
      score: c1,
      explanation: hasIntro && hasDev 
        ? 'Análise baseada na estrutura e uso da língua identificados nos blocos.'
        : 'Analise mais blocos para uma avaliação mais precisa.',
    },
    {
      id: 'c2' as const,
      name: 'Competência 2',
      description: 'Compreensão da proposta e aplicação de conceitos',
      score: c2,
      explanation: hasIntro 
        ? 'Avaliada pela contextualização e repertório na introdução.'
        : 'Analise a introdução para avaliação mais precisa.',
    },
    {
      id: 'c3' as const,
      name: 'Competência 3',
      description: 'Seleção e organização de argumentos',
      score: c3,
      explanation: hasDev 
        ? 'Avaliada pela estrutura argumentativa dos desenvolvimentos.'
        : 'Analise os desenvolvimentos para avaliação mais precisa.',
    },
    {
      id: 'c4' as const,
      name: 'Competência 4',
      description: 'Conhecimento dos mecanismos linguísticos',
      score: c4,
      explanation: hasDev 
        ? 'Avaliada pelo uso de conectivos e coesão textual.'
        : 'Analise os desenvolvimentos para avaliação mais precisa.',
    },
    {
      id: 'c5' as const,
      name: 'Competência 5',
      description: 'Proposta de intervenção detalhada',
      score: c5,
      explanation: hasConclusion 
        ? 'Avaliada pela presença dos 5 elementos na proposta de intervenção.'
        : 'Analise a conclusão para avaliação da proposta.',
    },
  ];
};
