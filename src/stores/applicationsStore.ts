/**
 * Applications Store - Saved job applications
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  createdAt: string;
  matchScore: number;
  tailoredResume: string;
  coverLetter: string;
  jobDescription: string;
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
}

interface ApplicationsState {
  applications: Application[];

  // Actions
  addApplication: (app: Omit<Application, 'id' | 'createdAt' | 'status'>) => void;
  updateStatus: (id: string, status: Application['status']) => void;
  deleteApplication: (id: string) => void;
  clearAll: () => void;
}

export const useApplicationsStore = create<ApplicationsState>()(
  persist(
    (set) => ({
      applications: [],

      addApplication: (app) =>
        set((state) => ({
          applications: [
            {
              ...app,
              id: generateId(),
              createdAt: new Date().toISOString(),
              status: 'saved',
            },
            ...state.applications,
          ],
        })),

      updateStatus: (id, status) =>
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id ? { ...app, status } : app
          ),
        })),

      deleteApplication: (id) =>
        set((state) => ({
          applications: state.applications.filter((app) => app.id !== id),
        })),

      clearAll: () => set({ applications: [] }),
    }),
    {
      name: 'applications-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Selectors
export const selectApplications = (state: ApplicationsState) =>
  state.applications;

export const selectApplicationCount = (state: ApplicationsState) =>
  state.applications.length;

export const selectRecentApplications = (state: ApplicationsState, count = 5) =>
  state.applications.slice(0, count);

export const selectApplicationsByStatus = (
  state: ApplicationsState,
  status: Application['status']
) => state.applications.filter((app) => app.status === status);
