/**
 * Database Service
 * Supabase database operations for profiles, resumes, and applications
 */

import { supabase } from '../config/supabase';
import { TailoringResult } from './tailoring/types';

// ============================================
// Types
// ============================================

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  target_days: number;
  weekly_target: number;
  current_streak: number;
  longest_streak: number;
  total_applications: number;
  weekly_applications: number;
  week_start_date: string | null;
  last_application_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  raw_text: string;
  name: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_title: string | null;
  company: string | null;
  job_description: string | null;
  match_score: number | null;
  ai_detection_score: number | null;
  tailored_resume: TailoringResult['resume'] | null;
  cover_letter: string | null;
  status: 'generated' | 'applied' | 'replied' | 'interviewing' | 'offer' | 'rejected';
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = Application['status'];

// ============================================
// Profile Operations
// ============================================

/**
 * Get user profile by ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Create or update user profile
 */
export async function upsertProfile(
  userId: string,
  data: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...data,
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting profile:', error);
    return null;
  }

  return profile;
}

/**
 * Update profile goals
 */
export async function updateGoals(
  userId: string,
  targetDays: number,
  weeklyTarget: number
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({
      target_days: targetDays,
      weekly_target: weeklyTarget,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating goals:', error);
    return false;
  }

  return true;
}

/**
 * Update streak and application counts
 */
export async function updateStreak(
  userId: string,
  currentStreak: number,
  longestStreak: number,
  totalApplications: number,
  weeklyApplications: number,
  weekStartDate: string | null,
  lastApplicationDate: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_applications: totalApplications,
      weekly_applications: weeklyApplications,
      week_start_date: weekStartDate,
      last_application_date: lastApplicationDate,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating streak:', error);
    return false;
  }

  return true;
}

// ============================================
// Resume Operations
// ============================================

/**
 * Get user's primary resume
 */
export async function getPrimaryResume(userId: string): Promise<Resume | null> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching resume:', error);
  }

  return data;
}

/**
 * Get all user resumes
 */
export async function getResumes(userId: string): Promise<Resume[]> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching resumes:', error);
    return [];
  }

  return data || [];
}

/**
 * Save or update resume
 */
export async function saveResume(
  userId: string,
  rawText: string,
  name: string = 'Main Resume',
  isPrimary: boolean = true
): Promise<Resume | null> {
  // If setting as primary, unset other primary resumes first
  if (isPrimary) {
    await supabase
      .from('resumes')
      .update({ is_primary: false })
      .eq('user_id', userId)
      .eq('is_primary', true);
  }

  const { data, error } = await supabase
    .from('resumes')
    .upsert({
      user_id: userId,
      raw_text: rawText,
      name,
      is_primary: isPrimary,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving resume:', error);
    return null;
  }

  return data;
}

/**
 * Update existing resume
 */
export async function updateResume(
  resumeId: string,
  rawText: string
): Promise<boolean> {
  const { error } = await supabase
    .from('resumes')
    .update({ raw_text: rawText })
    .eq('id', resumeId);

  if (error) {
    console.error('Error updating resume:', error);
    return false;
  }

  return true;
}

// ============================================
// Application Operations
// ============================================

/**
 * Get all user applications
 */
export async function getApplications(userId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }

  return data || [];
}

/**
 * Get applications by status
 */
export async function getApplicationsByStatus(
  userId: string,
  status: ApplicationStatus
): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications by status:', error);
    return [];
  }

  return data || [];
}

/**
 * Save new application
 */
export async function saveApplication(
  userId: string,
  data: {
    jobTitle: string;
    company: string;
    jobDescription: string;
    matchScore: number;
    aiDetectionScore?: number;
    tailoredResume: TailoringResult['resume'];
    coverLetter: string;
    status?: ApplicationStatus;
  }
): Promise<Application | null> {
  const { data: application, error } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      job_title: data.jobTitle,
      company: data.company,
      job_description: data.jobDescription,
      match_score: data.matchScore,
      ai_detection_score: data.aiDetectionScore || null,
      tailored_resume: data.tailoredResume,
      cover_letter: data.coverLetter,
      status: data.status || 'generated',
      applied_at: data.status === 'applied' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving application:', error);
    return null;
  }

  return application;
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<boolean> {
  const updateData: Partial<Application> = { status };

  // Set applied_at when marking as applied
  if (status === 'applied') {
    updateData.applied_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', applicationId);

  if (error) {
    console.error('Error updating application status:', error);
    return false;
  }

  return true;
}

/**
 * Delete application
 */
export async function deleteApplication(applicationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId);

  if (error) {
    console.error('Error deleting application:', error);
    return false;
  }

  return true;
}

/**
 * Get application counts by status
 */
export async function getApplicationCounts(
  userId: string
): Promise<Record<ApplicationStatus, number>> {
  const { data, error } = await supabase
    .from('applications')
    .select('status')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching application counts:', error);
    return {
      generated: 0,
      applied: 0,
      replied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
    };
  }

  const counts: Record<ApplicationStatus, number> = {
    generated: 0,
    applied: 0,
    replied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
  };

  data?.forEach((app) => {
    counts[app.status as ApplicationStatus]++;
  });

  return counts;
}
