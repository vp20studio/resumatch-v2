/**
 * Auth Store - User authentication state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name?: string;
  isPremium: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
  upgradeToPremium: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasCompletedOnboarding: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setOnboardingComplete: (hasCompletedOnboarding) =>
        set({ hasCompletedOnboarding }),

      login: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      upgradeToPremium: () =>
        set((state) => ({
          user: state.user
            ? { ...state.user, isPremium: true }
            : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsPremium = (state: AuthState) => state.user?.isPremium ?? false;
