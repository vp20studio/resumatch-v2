/**
 * Auth Store - Supabase authentication state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { getProfile, upsertProfile, Profile } from '../services/database';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  hasCompletedOnboarding: boolean;
  error: string | null;

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOnboardingComplete: (complete: boolean) => void;

  // Auth methods
  loadSession: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isInitialized: false,
      hasCompletedOnboarding: false,
      error: null,

      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
        }),

      setProfile: (profile) => set({ profile }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setOnboardingComplete: (hasCompletedOnboarding) =>
        set({ hasCompletedOnboarding }),

      loadSession: async () => {
        try {
          set({ isLoading: true, error: null });

          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Error loading session:', error);
            set({ error: error.message });
          }

          set({
            session,
            user: session?.user ?? null,
            isInitialized: true,
            isLoading: false,
          });

          // Fetch profile if session exists
          if (session?.user) {
            await get().fetchProfile();
          }
        } catch (err) {
          console.error('Error in loadSession:', err);
          set({
            isLoading: false,
            isInitialized: true,
            error: 'Failed to load session',
          });
        }
      },

      signInWithEmail: async (email, password) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ error: error.message, isLoading: false });
            return false;
          }

          set({
            session: data.session,
            user: data.user,
            isLoading: false,
          });

          // Fetch profile after login
          if (data.user) {
            await get().fetchProfile();
          }

          return true;
        } catch (err) {
          console.error('Error in signInWithEmail:', err);
          set({ error: 'Failed to sign in', isLoading: false });
          return false;
        }
      },

      signUpWithEmail: async (email, password, name) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name,
              },
            },
          });

          if (error) {
            set({ error: error.message, isLoading: false });
            return false;
          }

          if (data.user) {
            // Create/update profile with name
            await upsertProfile(data.user.id, {
              full_name: name,
              email: email,
            });
          }

          set({
            session: data.session,
            user: data.user,
            isLoading: false,
            hasCompletedOnboarding: false, // New users need onboarding
          });

          // Fetch profile after signup
          if (data.user) {
            await get().fetchProfile();
          }

          return true;
        } catch (err) {
          console.error('Error in signUpWithEmail:', err);
          set({ error: 'Failed to sign up', isLoading: false });
          return false;
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true, error: null });

          const { error } = await supabase.auth.signOut();

          if (error) {
            console.error('Error signing out:', error);
          }

          set({
            session: null,
            user: null,
            profile: null,
            isLoading: false,
            hasCompletedOnboarding: false,
          });
        } catch (err) {
          console.error('Error in signOut:', err);
          set({ isLoading: false });
        }
      },

      fetchProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const profile = await getProfile(user.id);
          set({ profile });
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectSession = (state: AuthState) => state.session;
export const selectProfile = (state: AuthState) => state.profile;
export const selectIsAuthenticated = (state: AuthState) => state.session !== null;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectError = (state: AuthState) => state.error;
export const selectHasCompletedOnboarding = (state: AuthState) => state.hasCompletedOnboarding;
