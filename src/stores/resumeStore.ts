/**
 * Resume Store - User's resume data
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResumeData } from '../services/tailoring/types';

interface ResumeState {
  // Raw resume text (from upload or paste)
  rawText: string;
  // Parsed resume data
  parsedData: ResumeData | null;
  // Last updated timestamp
  lastUpdated: string | null;
  // Upload source
  uploadSource: 'file' | 'paste' | 'linkedin' | null;

  // Actions
  setRawText: (text: string) => void;
  setParsedData: (data: ResumeData) => void;
  setUploadSource: (source: ResumeState['uploadSource']) => void;
  clearResume: () => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      rawText: '',
      parsedData: null,
      lastUpdated: null,
      uploadSource: null,

      setRawText: (rawText) =>
        set({
          rawText,
          lastUpdated: new Date().toISOString(),
        }),

      setParsedData: (parsedData) =>
        set({
          parsedData,
          lastUpdated: new Date().toISOString(),
        }),

      setUploadSource: (uploadSource) => set({ uploadSource }),

      clearResume: () =>
        set({
          rawText: '',
          parsedData: null,
          lastUpdated: null,
          uploadSource: null,
        }),
    }),
    {
      name: 'resume-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const selectHasResume = (state: ResumeState) =>
  state.rawText.length > 0 || state.parsedData !== null;

export const selectResumeText = (state: ResumeState) => state.rawText;

export const selectParsedResume = (state: ResumeState) => state.parsedData;
