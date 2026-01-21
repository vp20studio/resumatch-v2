/**
 * Type definitions for the 2-pass tailoring algorithm
 * Key principle: Extract and Match, don't Rewrite
 */

// Resume structured data (extracted from raw text)
export interface ResumeData {
  rawText: string;
  skills: Skill[];
  experiences: Experience[];
  education: Education[];
  contact?: ContactInfo;
}

export interface Skill {
  name: string;
  category?: 'technical' | 'soft' | 'tool' | 'language' | 'other';
  originalText: string; // Exact text as it appears in resume
}

export interface Experience {
  title: string;
  company: string;
  dateRange?: string;
  bullets: Bullet[];
  originalText: string;
}

export interface Bullet {
  text: string;
  metrics: Metric[];
  keywords: string[];
}

export interface Metric {
  value: string;
  context: string;
  originalText: string;
}

export interface Education {
  degree: string;
  institution: string;
  year?: string;
  gpa?: string;
  originalText: string;
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
}

// Job description requirements (extracted via LLM)
export interface JDRequirements {
  title: string;
  company?: string;
  required: Requirement[];
  preferred: Requirement[];
  keywords: string[];
  context: JDContext;
}

export interface Requirement {
  text: string;
  type: 'skill' | 'experience' | 'education' | 'certification' | 'other';
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface JDContext {
  industry?: string;
  teamSize?: string;
  workStyle?: 'remote' | 'hybrid' | 'onsite';
  seniorityLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  companyType?: 'startup' | 'mid-size' | 'enterprise' | 'agency';
}

// Matching results
export interface MatchResult {
  requirement: Requirement;
  matchedItem: Bullet | Skill | Education | null;
  score: number; // 0-100
  matchType: 'exact' | 'semantic' | 'partial' | 'missing';
  originalText: string;
}

// Final tailoring output
export interface TailoringResult {
  resume: TailoredResume;
  coverLetter: string;
  matchScore: number;
  matchedItems: MatchResult[];
  missingItems: MatchResult[];
  processingTime: number;
}

export interface TailoredResume {
  summary?: string;
  skills: string[];
  experiences: TailoredExperience[];
  education: string[];
  rawText: string;
}

export interface TailoredExperience {
  title: string;
  company: string;
  dateRange?: string;
  bullets: string[];
}

// Error types
export type TailoringErrorType =
  | 'parse_error'
  | 'jd_analysis_error'
  | 'matching_error'
  | 'formatting_error'
  | 'cover_letter_error'
  | 'timeout'
  | 'api_error';

export interface TailoringError {
  type: TailoringErrorType;
  message: string;
  details?: unknown;
}
