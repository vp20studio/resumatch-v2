/**
 * Generation Store - Current tailoring job state
 */

import { create } from 'zustand';
import { TailoringResult, TailoringProgress } from '../services/tailoring';

type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

interface GenerationState {
  // Current job description
  jobDescription: string;
  // Generation status
  status: GenerationStatus;
  // Progress info
  progress: TailoringProgress | null;
  // Result
  result: TailoringResult | null;
  // Error message if failed
  error: string | null;

  // Actions
  setJobDescription: (jd: string) => void;
  startGeneration: () => void;
  setProgress: (progress: TailoringProgress) => void;
  setResult: (result: TailoringResult) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState = {
  jobDescription: '',
  status: 'idle' as GenerationStatus,
  progress: null,
  result: null,
  error: null,
};

export const useGenerationStore = create<GenerationState>((set) => ({
  ...initialState,

  setJobDescription: (jobDescription) => set({ jobDescription }),

  startGeneration: () =>
    set({
      status: 'generating',
      progress: null,
      result: null,
      error: null,
    }),

  setProgress: (progress) => set({ progress }),

  setResult: (result) =>
    set({
      status: 'success',
      result,
      progress: { step: 'complete', progress: 100, message: 'Complete!' },
    }),

  setError: (error) =>
    set({
      status: 'error',
      error,
    }),

  reset: () => set(initialState),
}));

// Selectors
export const selectIsGenerating = (state: GenerationState) =>
  state.status === 'generating';

export const selectHasResult = (state: GenerationState) =>
  state.status === 'success' && state.result !== null;

export const selectMatchScore = (state: GenerationState) =>
  state.result?.matchScore ?? 0;

export const selectProgress = (state: GenerationState) =>
  state.progress?.progress ?? 0;
