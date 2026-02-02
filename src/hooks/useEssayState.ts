// Essay state management hook
import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Block, 
  BlockType, 
  EssayState, 
  createInitialBlocks,
  createInitialCompetencies,
  BlockAnalysis,
  Competency,
} from '@/types/atlas';
import { loadState, saveState, hashText, getInitialState } from '@/lib/storage';
import { runPrecheck, estimateScore } from '@/lib/precheck';

export const useEssayState = () => {
  const [state, setState] = useState<EssayState>(() => loadState());
  
  // Auto-save on state change
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveState(state);
    }, 500);
    return () => clearTimeout(timeout);
  }, [state]);
  
  // Update block text
  const updateBlockText = useCallback((blockId: string, text: string) => {
    setState(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => {
        if (block.id !== blockId) return block;
        
        const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        const hasChanged = hashText(text) !== block.analysis?.textHash;
        
        return {
          ...block,
          text,
          wordCount,
          status: !text.trim() ? 'empty' : 
                  hasChanged ? 'draft' : block.status,
          // Clear analysis if text changed significantly
          analysis: hasChanged ? undefined : block.analysis,
        };
      }),
    }));
  }, []);
  
  // Clear block
  const clearBlock = useCallback((blockId: string) => {
    setState(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === blockId
          ? { ...block, text: '', wordCount: 0, status: 'empty', analysis: undefined }
          : block
      ),
    }));
  }, []);
  
  // Add development block
  const addDevelopment = useCallback(() => {
    setState(prev => {
      const devBlocks = prev.blocks.filter(b => b.type === 'development');
      const newDevNumber = devBlocks.length + 1;
      const conclusionIndex = prev.blocks.findIndex(b => b.type === 'conclusion');
      
      const newBlock: Block = {
        id: `dev-${Date.now()}`,
        type: 'development',
        order: conclusionIndex,
        title: `Desenvolvimento ${newDevNumber}`,
        text: '',
        status: 'empty',
        wordCount: 0,
      };
      
      const newBlocks = [...prev.blocks];
      newBlocks.splice(conclusionIndex, 0, newBlock);
      
      // Update orders and titles
      return {
        ...prev,
        blocks: newBlocks.map((block, index) => {
          if (block.type === 'development') {
            const devIndex = newBlocks
              .slice(0, index + 1)
              .filter(b => b.type === 'development').length;
            return {
              ...block,
              order: index,
              title: `Desenvolvimento ${devIndex}`,
            };
          }
          return { ...block, order: index };
        }),
      };
    });
  }, []);
  
  // Remove development block
  const removeDevelopment = useCallback((blockId: string) => {
    setState(prev => {
      const block = prev.blocks.find(b => b.id === blockId);
      if (!block || block.type !== 'development') return prev;
      
      const devBlocks = prev.blocks.filter(b => b.type === 'development');
      if (devBlocks.length <= 1) return prev; // Keep at least one
      
      const newBlocks = prev.blocks
        .filter(b => b.id !== blockId)
        .map((block, index) => {
          if (block.type === 'development') {
            const remaining = prev.blocks
              .filter(b => b.id !== blockId && b.type === 'development');
            const devIndex = remaining.findIndex(b => b.id === block.id) + 1;
            return {
              ...block,
              order: index,
              title: `Desenvolvimento ${devIndex}`,
            };
          }
          return { ...block, order: index };
        });
      
      return { ...prev, blocks: newBlocks };
    });
  }, []);
  
  // Set block analysis
  const setBlockAnalysis = useCallback((blockId: string, analysis: BlockAnalysis | null, status: 'analyzed' | 'unavailable') => {
    setState(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId
          ? { 
              ...block, 
              status,
              analysis: analysis ?? undefined,
            }
          : block
      ),
    }));
  }, []);
  
  // Set competencies
  const setCompetencies = useCallback((competencies: Competency[]) => {
    setState(prev => ({ ...prev, competencies }));
  }, []);
  
  // Set total score
  const setTotalScore = useCallback((score: number) => {
    setState(prev => ({ ...prev, totalScore: score }));
  }, []);
  
  // Set improved version
  const setImprovedVersion = useCallback((text: string | undefined) => {
    setState(prev => ({ ...prev, improvedVersion: text }));
  }, []);
  
  // Toggle original view
  const toggleShowOriginal = useCallback(() => {
    setState(prev => ({ ...prev, showOriginal: !prev.showOriginal }));
  }, []);
  
  // Set theme
  const setTheme = useCallback((theme: string) => {
    setState(prev => ({ ...prev, theme }));
  }, []);
  
  // Apply pasted text divided into blocks
  const applyDividedText = useCallback((paragraphs: string[]) => {
    if (paragraphs.length === 0) return;
    
    setState(prev => {
      // Always: first = intro, last = conclusion, middle = developments
      const intro = paragraphs[0];
      const conclusion = paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : '';
      const developments = paragraphs.length > 2 
        ? paragraphs.slice(1, -1) 
        : paragraphs.length === 2 
          ? [] 
          : [];
      
      // Ensure at least 2 developments if there are enough paragraphs
      const devCount = Math.max(2, developments.length);
      
      const newBlocks: Block[] = [
        {
          id: 'intro-1',
          type: 'introduction',
          order: 0,
          title: 'Introdução',
          text: intro,
          wordCount: intro.trim().split(/\s+/).filter(w => w.length > 0).length,
          status: intro.trim() ? 'draft' : 'empty',
        },
      ];
      
      for (let i = 0; i < devCount; i++) {
        const text = developments[i] || '';
        newBlocks.push({
          id: `dev-${i + 1}`,
          type: 'development',
          order: i + 1,
          title: `Desenvolvimento ${i + 1}`,
          text,
          wordCount: text.trim().split(/\s+/).filter(w => w.length > 0).length,
          status: text.trim() ? 'draft' : 'empty',
        });
      }
      
      newBlocks.push({
        id: 'conclusion-1',
        type: 'conclusion',
        order: newBlocks.length,
        title: 'Conclusão',
        text: conclusion,
        wordCount: conclusion.trim().split(/\s+/).filter(w => w.length > 0).length,
        status: conclusion.trim() ? 'draft' : 'empty',
      });
      
      return {
        ...prev,
        blocks: newBlocks,
        improvedVersion: undefined,
        competencies: createInitialCompetencies(),
        totalScore: 0,
      };
    });
  }, []);
  
  // Reset all
  const resetAll = useCallback(() => {
    setState(getInitialState());
  }, []);
  
  // Computed values
  const analysisProgress = useMemo(() => {
    const analyzed = state.blocks.filter(b => b.status === 'analyzed').length;
    return Math.round((analyzed / state.blocks.length) * 100);
  }, [state.blocks]);
  
  const analyzedBlockCount = useMemo(() => {
    return state.blocks.filter(b => b.status === 'analyzed').length;
  }, [state.blocks]);
  
  const totalBlockCount = useMemo(() => {
    return state.blocks.length;
  }, [state.blocks]);
  
  const canGenerateImproved = useMemo(() => {
    // Need at least intro, one dev, and conclusion analyzed
    const hasIntro = state.blocks.some(b => b.type === 'introduction' && b.status === 'analyzed');
    const hasDev = state.blocks.some(b => b.type === 'development' && b.status === 'analyzed');
    const hasConclusion = state.blocks.some(b => b.type === 'conclusion' && b.status === 'analyzed');
    return hasIntro && hasDev && hasConclusion;
  }, [state.blocks]);
  
  const estimatedScore = useMemo(() => {
    return estimateScore(state.blocks, state.competencies);
  }, [state.blocks, state.competencies]);
  
  const fullText = useMemo(() => {
    return state.blocks.map(b => b.text).join('\n\n');
  }, [state.blocks]);
  
  return {
    state,
    updateBlockText,
    clearBlock,
    addDevelopment,
    removeDevelopment,
    setBlockAnalysis,
    setCompetencies,
    setTotalScore,
    setImprovedVersion,
    toggleShowOriginal,
    setTheme,
    applyDividedText,
    resetAll,
    analysisProgress,
    analyzedBlockCount,
    totalBlockCount,
    canGenerateImproved,
    estimatedScore,
    fullText,
  };
};
