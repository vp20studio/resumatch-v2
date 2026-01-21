/**
 * History Store - Past generation results with application tracking
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TailoringResult } from '../services/tailoring/types';

export type ApplicationStatus = 'generated' | 'applied' | 'replied' | 'interviewing' | 'offer' | 'rejected';

export interface HistoryItem {
  id: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  result: TailoringResult;
  jobDescription: string;
  createdAt: string;

  // Application tracking
  status: ApplicationStatus;
  appliedDate: string | null;
  jobUrl: string | null;
  notes: string | null;
  statusHistory: Array<{ status: ApplicationStatus; date: string }>;
}

interface HistoryState {
  items: HistoryItem[];

  // Actions
  addItem: (item: Omit<HistoryItem, 'id' | 'createdAt' | 'status' | 'appliedDate' | 'jobUrl' | 'notes' | 'statusHistory'>) => string;
  removeItem: (id: string) => void;
  updateStatus: (id: string, status: ApplicationStatus, notes?: string) => void;
  markAsApplied: (id: string, jobUrl?: string) => void;
  updateNotes: (id: string, notes: string) => void;
  updateJobUrl: (id: string, jobUrl: string) => void;
  clearHistory: () => void;

  // Getters
  getByStatus: (status: ApplicationStatus) => HistoryItem[];
  getStatusCounts: () => Record<ApplicationStatus, number>;
}

// Helper to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const id = generateId();
        set((state) => ({
          items: [
            {
              ...item,
              id,
              createdAt: new Date().toISOString(),
              status: 'generated',
              appliedDate: null,
              jobUrl: null,
              notes: null,
              statusHistory: [{ status: 'generated', date: new Date().toISOString() }],
            },
            ...state.items,
          ],
        }));
        return id;
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateStatus: (id, status, notes) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  notes: notes ?? item.notes,
                  appliedDate:
                    status === 'applied' && !item.appliedDate
                      ? new Date().toISOString()
                      : item.appliedDate,
                  statusHistory: [
                    ...item.statusHistory,
                    { status, date: new Date().toISOString() },
                  ],
                }
              : item
          ),
        })),

      markAsApplied: (id, jobUrl) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'applied' as ApplicationStatus,
                  appliedDate: new Date().toISOString(),
                  jobUrl: jobUrl ?? item.jobUrl,
                  statusHistory: [
                    ...item.statusHistory,
                    { status: 'applied' as ApplicationStatus, date: new Date().toISOString() },
                  ],
                }
              : item
          ),
        })),

      updateNotes: (id, notes) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, notes } : item
          ),
        })),

      updateJobUrl: (id, jobUrl) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, jobUrl } : item
          ),
        })),

      clearHistory: () => set({ items: [] }),

      getByStatus: (status) => {
        return get().items.filter((item) => item.status === status);
      },

      getStatusCounts: () => {
        const items = get().items;
        return {
          generated: items.filter((i) => i.status === 'generated').length,
          applied: items.filter((i) => i.status === 'applied').length,
          replied: items.filter((i) => i.status === 'replied').length,
          interviewing: items.filter((i) => i.status === 'interviewing').length,
          offer: items.filter((i) => i.status === 'offer').length,
          rejected: items.filter((i) => i.status === 'rejected').length,
        };
      },
    }),
    {
      name: 'history-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const selectHistoryItems = (state: HistoryState) => state.items;

export const selectHistoryCount = (state: HistoryState) => state.items.length;

export const selectRecentHistory = (state: HistoryState, count = 5) =>
  state.items.slice(0, count);

export const selectAppliedCount = (state: HistoryState) =>
  state.items.filter(
    (i) => i.status !== 'generated'
  ).length;

export const selectActiveApplications = (state: HistoryState) =>
  state.items.filter(
    (i) => i.status === 'applied' || i.status === 'replied' || i.status === 'interviewing'
  );

export const selectThisWeekApplications = (state: HistoryState) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return state.items.filter((item) => {
    if (!item.appliedDate) return false;
    const appliedDate = new Date(item.appliedDate);
    return appliedDate >= startOfWeek;
  }).length;
};
