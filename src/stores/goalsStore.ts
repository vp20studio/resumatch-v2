/**
 * Goals Store - Track job search goals and streaks
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GoalsState {
  // Goals
  targetDays: number; // 30, 60, or 90 days
  weeklyTarget: number; // Applications per week target
  startDate: string | null; // ISO date string

  // Streak tracking
  currentStreak: number;
  longestStreak: number;
  lastApplicationDate: string | null; // ISO date string
  totalApplications: number;

  // Weekly tracking
  weeklyApplications: number;
  weekStartDate: string | null;

  // Actions
  setGoals: (targetDays: number, weeklyTarget: number) => void;
  recordApplication: () => void;
  updateStreak: () => void;
  getWeeklyProgress: () => { current: number; target: number; percentage: number };
  getDaysRemaining: () => number;
  getMotivationalMessage: () => string;
  resetGoals: () => void;
}

const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      targetDays: 30,
      weeklyTarget: 10,
      startDate: null,
      currentStreak: 0,
      longestStreak: 0,
      lastApplicationDate: null,
      totalApplications: 0,
      weeklyApplications: 0,
      weekStartDate: null,

      setGoals: (targetDays, weeklyTarget) => {
        const now = new Date().toISOString();
        set({
          targetDays,
          weeklyTarget,
          startDate: now,
          weekStartDate: getStartOfWeek(new Date()).toISOString(),
          weeklyApplications: 0,
        });
      },

      recordApplication: () => {
        const state = get();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Check if we need to reset weekly counter
        const currentWeekStart = getStartOfWeek(now);
        const storedWeekStart = state.weekStartDate
          ? new Date(state.weekStartDate)
          : null;

        let weeklyApplications = state.weeklyApplications;
        let weekStartDate = state.weekStartDate;

        if (!storedWeekStart || currentWeekStart > storedWeekStart) {
          // New week, reset counter
          weeklyApplications = 0;
          weekStartDate = currentWeekStart.toISOString();
        }

        // Update streak
        let currentStreak = state.currentStreak;
        const lastAppDate = state.lastApplicationDate
          ? new Date(state.lastApplicationDate)
          : null;

        if (lastAppDate) {
          if (isSameDay(lastAppDate, now)) {
            // Already applied today, don't increment streak
          } else if (isYesterday(lastAppDate)) {
            // Applied yesterday, increment streak
            currentStreak += 1;
          } else {
            // Streak broken, start over
            currentStreak = 1;
          }
        } else {
          // First application
          currentStreak = 1;
        }

        const longestStreak = Math.max(state.longestStreak, currentStreak);

        set({
          lastApplicationDate: now.toISOString(),
          currentStreak,
          longestStreak,
          totalApplications: state.totalApplications + 1,
          weeklyApplications: weeklyApplications + 1,
          weekStartDate,
        });
      },

      updateStreak: () => {
        const state = get();
        if (!state.lastApplicationDate) return;

        const lastAppDate = new Date(state.lastApplicationDate);
        const now = new Date();

        // If last application wasn't today or yesterday, reset streak
        if (!isSameDay(lastAppDate, now) && !isYesterday(lastAppDate)) {
          set({ currentStreak: 0 });
        }
      },

      getWeeklyProgress: () => {
        const state = get();

        // Check if we need to reset for new week
        const now = new Date();
        const currentWeekStart = getStartOfWeek(now);
        const storedWeekStart = state.weekStartDate
          ? new Date(state.weekStartDate)
          : null;

        let current = state.weeklyApplications;
        if (!storedWeekStart || currentWeekStart > storedWeekStart) {
          current = 0;
        }

        return {
          current,
          target: state.weeklyTarget,
          percentage: Math.min(100, Math.round((current / state.weeklyTarget) * 100)),
        };
      },

      getDaysRemaining: () => {
        const state = get();
        if (!state.startDate) return state.targetDays;

        const start = new Date(state.startDate);
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );

        return Math.max(0, state.targetDays - elapsed);
      },

      getMotivationalMessage: () => {
        const state = get();
        const progress = state.getWeeklyProgress();
        const streak = state.currentStreak;
        const remaining = progress.target - progress.current;

        // Streak messages
        if (streak >= 7) {
          return "You're unstoppable! 🔥";
        }
        if (streak >= 5) {
          return "You're on fire! Keep it up! 🔥";
        }
        if (streak >= 3) {
          return "Nice streak! Keep the momentum! 💪";
        }

        // Progress messages
        if (progress.current >= progress.target) {
          return "Weekly goal crushed! You're amazing! 🎉";
        }
        if (progress.percentage >= 80) {
          return `Almost there! Just ${remaining} more to go! 🏁`;
        }
        if (progress.percentage >= 50) {
          return "Halfway there! You've got this! 💪";
        }
        if (progress.current === 0) {
          return "Your first application is the hardest. Let's go! 🚀";
        }

        return `${remaining} more this week to hit your goal! 📈`;
      },

      resetGoals: () => {
        set({
          targetDays: 30,
          weeklyTarget: 10,
          startDate: null,
          currentStreak: 0,
          longestStreak: 0,
          lastApplicationDate: null,
          totalApplications: 0,
          weeklyApplications: 0,
          weekStartDate: null,
        });
      },
    }),
    {
      name: 'goals-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors - NOTE: For computed values (getWeeklyProgress, getDaysRemaining, etc.)
// do NOT use these in Zustand selectors as they return new objects on every call.
// Instead, select raw state values and compute in the component using useMemo.
export const selectStreak = (state: GoalsState) => state.currentStreak;
export const selectHasSetGoals = (state: GoalsState) => state.startDate !== null;
export const selectWeeklyTarget = (state: GoalsState) => state.weeklyTarget;
export const selectWeeklyApplications = (state: GoalsState) => state.weeklyApplications;
export const selectTargetDays = (state: GoalsState) => state.targetDays;
export const selectStartDate = (state: GoalsState) => state.startDate;
