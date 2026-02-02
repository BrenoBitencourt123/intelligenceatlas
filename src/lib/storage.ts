// Local storage management for Atlas
import { EssayState, createInitialBlocks, createInitialCompetencies } from '@/types/atlas';

const STORAGE_KEY = 'atlas-essay-state';

export const getInitialState = (): EssayState => ({
  blocks: createInitialBlocks(),
  theme: '',
  totalScore: 0,
  competencies: createInitialCompetencies(),
  improvedVersion: undefined,
  showOriginal: false,
  analysisProgress: 0,
  lastSaved: Date.now(),
});

export const loadState = (): EssayState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...getInitialState(),
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }
  return getInitialState();
};

export const saveState = (state: EssayState): void => {
  try {
    const toSave = {
      ...state,
      lastSaved: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
};

export const clearState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear state from localStorage:', e);
  }
};

// Hash function for caching
export const hashText = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
};
