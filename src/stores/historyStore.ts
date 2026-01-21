/**
 * History Store - Past generation results with application tracking
 * Syncs with Supabase for cloud persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TailoringResult } from '../services/tailoring/types';
import {
  getApplications,
  saveApplication,
  updateApplicationStatus,
  deleteApplication,
  Application,
} from '../services/database';
import { useAuthStore } from './authStore';

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

  // Sync status
  syncedToCloud: boolean;
}

interface HistoryState {
  items: HistoryItem[];
  isLoading: boolean;
  isSyncing: boolean;

  // Actions
  addItem: (item: Omit<HistoryItem, 'id' | 'createdAt' | 'status' | 'appliedDate' | 'jobUrl' | 'notes' | 'statusHistory' | 'syncedToCloud'>) => Promise<string>;
  removeItem: (id: string) => Promise<void>;
  updateStatus: (id: string, status: ApplicationStatus, notes?: string) => Promise<void>;
  markAsApplied: (id: string, jobUrl?: string) => Promise<void>;
  updateNotes: (id: string, notes: string) => void;
  updateJobUrl: (id: string, jobUrl: string) => void;
  clearHistory: () => void;

  // Cloud sync
  loadFromCloud: () => Promise<void>;
  syncToCloud: () => Promise<void>;

  // Getters
  getByStatus: (status: ApplicationStatus) => HistoryItem[];
  getStatusCounts: () => Record<ApplicationStatus, number>;
}

// Helper to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Convert database Application to HistoryItem
function dbToHistoryItem(app: Application): HistoryItem {
  return {
    id: app.id,
    jobTitle: app.job_title || 'Unknown Position',
    company: app.company || 'Unknown Company',
    matchScore: app.match_score || 0,
    result: {
      resume: app.tailored_resume || { skills: [], experiences: [], education: [], rawText: '' },
      coverLetter: app.cover_letter || '',
      matchScore: app.match_score || 0,
      matchedItems: [],
      missingItems: [],
      processingTime: 0,
    },
    jobDescription: app.job_description || '',
    createdAt: app.created_at,
    status: app.status as ApplicationStatus,
    appliedDate: app.applied_at,
    jobUrl: null,
    notes: null,
    statusHistory: [{ status: app.status as ApplicationStatus, date: app.created_at }],
    syncedToCloud: true,
  };
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isSyncing: false,

      addItem: async (item) => {
        const id = generateId();
        const now = new Date().toISOString();

        const newItem: HistoryItem = {
          ...item,
          id,
          createdAt: now,
          status: 'generated',
          appliedDate: null,
          jobUrl: null,
          notes: null,
          statusHistory: [{ status: 'generated', date: now }],
          syncedToCloud: false,
        };

        // Add locally first
        set((state) => ({
          items: [newItem, ...state.items],
        }));

        // Sync to cloud if authenticated
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          try {
            const cloudApp = await saveApplication(userId, {
              jobTitle: item.jobTitle,
              company: item.company,
              jobDescription: item.jobDescription,
              matchScore: item.matchScore,
              tailoredResume: item.result.resume,
              coverLetter: item.result.coverLetter,
              status: 'generated',
            });

            if (cloudApp) {
              // Update with cloud ID
              set((state) => ({
                items: state.items.map((i) =>
                  i.id === id
                    ? { ...i, id: cloudApp.id, syncedToCloud: true }
                    : i
                ),
              }));
              return cloudApp.id;
            }
          } catch (err) {
            console.error('Failed to sync to cloud:', err);
          }
        }

        return id;
      },

      removeItem: async (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));

        // Delete from cloud
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          try {
            await deleteApplication(id);
          } catch (err) {
            console.error('Failed to delete from cloud:', err);
          }
        }
      },

      updateStatus: async (id, status, notes) => {
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
        }));

        // Update in cloud
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          try {
            await updateApplicationStatus(id, status);
          } catch (err) {
            console.error('Failed to update status in cloud:', err);
          }
        }
      },

      markAsApplied: async (id, jobUrl) => {
        const now = new Date().toISOString();

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'applied' as ApplicationStatus,
                  appliedDate: now,
                  jobUrl: jobUrl ?? item.jobUrl,
                  statusHistory: [
                    ...item.statusHistory,
                    { status: 'applied' as ApplicationStatus, date: now },
                  ],
                }
              : item
          ),
        }));

        // Update in cloud
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          try {
            await updateApplicationStatus(id, 'applied');
          } catch (err) {
            console.error('Failed to mark as applied in cloud:', err);
          }
        }
      },

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

      loadFromCloud: async () => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;

        set({ isLoading: true });

        try {
          const applications = await getApplications(userId);
          const items = applications.map(dbToHistoryItem);

          set({
            items,
            isLoading: false,
          });
        } catch (err) {
          console.error('Failed to load from cloud:', err);
          set({ isLoading: false });
        }
      },

      syncToCloud: async () => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;

        const { items } = get();
        const unsyncedItems = items.filter((item) => !item.syncedToCloud);

        if (unsyncedItems.length === 0) return;

        set({ isSyncing: true });

        for (const item of unsyncedItems) {
          try {
            const cloudApp = await saveApplication(userId, {
              jobTitle: item.jobTitle,
              company: item.company,
              jobDescription: item.jobDescription,
              matchScore: item.matchScore,
              tailoredResume: item.result.resume,
              coverLetter: item.result.coverLetter,
              status: item.status,
            });

            if (cloudApp) {
              set((state) => ({
                items: state.items.map((i) =>
                  i.id === item.id
                    ? { ...i, id: cloudApp.id, syncedToCloud: true }
                    : i
                ),
              }));
            }
          } catch (err) {
            console.error('Failed to sync item:', err);
          }
        }

        set({ isSyncing: false });
      },

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
