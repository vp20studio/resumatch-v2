/**
 * Tailoring Orchestrator
 * Coordinates the 2-pass tailoring process
 * Target: 5-8 seconds total
 */

import { TailoringResult, TailoringError, ResumeData, JDRequirements, AIDetectionInfo } from './types';
import { parseResume } from './parser';
import { analyzeJobDescription } from './jdAnalyzer';
import { matchResume, calculateMatchScore } from './matcher';
import { formatTailoredResume } from './formatter';
import { generateCoverLetter, generateQuickCoverLetter } from './coverLetter';
import { logResumeData, logJDRequirements, logMatchResults, logScoreCalculation } from './debug';
import { detectAIContent } from '../aiDetection';

// Set to true to enable debug logging
const DEBUG = __DEV__ || false;

export interface TailoringProgress {
  step: 'parsing' | 'analyzing' | 'matching' | 'formatting' | 'cover_letter' | 'ai_check' | 'complete';
  progress: number; // 0-100
  message: string;
}

export type ProgressCallback = (progress: TailoringProgress) => void;

/**
 * Main tailoring function
 * Orchestrates the 2-pass algorithm
 */
export async function tailorResume(
  resumeText: string,
  jdText: string,
  onProgress?: ProgressCallback
): Promise<TailoringResult> {
  const startTime = Date.now();

  try {
    // PASS 1: Extraction & Matching (mostly deterministic)

    // Step 1A: Parse resume (no LLM)
    onProgress?.({ step: 'parsing', progress: 10, message: 'Parsing resume...' });
    const resumeData = parseResume(resumeText);
    if (DEBUG) logResumeData(resumeData);

    // Step 1B: Analyze JD (1 LLM call)
    onProgress?.({ step: 'analyzing', progress: 30, message: 'Analyzing job description...' });
    const jdRequirements = await analyzeJobDescription(jdText);
    if (DEBUG) logJDRequirements(jdRequirements);

    // Step 1C: Match resume to JD (no LLM)
    onProgress?.({ step: 'matching', progress: 50, message: 'Matching qualifications...' });
    const { matched, missing, hasDomainMismatch } = matchResume(resumeData, jdRequirements);
    const matchScore = calculateMatchScore(matched, missing, hasDomainMismatch);
    if (DEBUG) {
      logMatchResults(matched, missing);
      logScoreCalculation(matched, missing, matchScore);
    }

    // PASS 2: Formatting & Cover Letter (can run in parallel)

    onProgress?.({ step: 'formatting', progress: 60, message: 'Tailoring resume...' });

    // Run formatting and cover letter generation in parallel
    const [tailoredResume, initialCoverLetter] = await Promise.all([
      formatTailoredResume(resumeData, matched, jdRequirements),
      generateCoverLetter(matched, jdRequirements, resumeData, false),
    ]);

    // PASS 3: AI Detection & Humanization
    onProgress?.({ step: 'ai_check', progress: 80, message: 'Checking content quality...' });

    // Detect AI content in cover letter
    let coverLetter = initialCoverLetter;
    let aiDetection: AIDetectionInfo;

    try {
      const detectionResult = await detectAIContent(initialCoverLetter);

      // If AI score is too high (>50%), regenerate with human-like instructions
      if (detectionResult.score > 50) {
        if (DEBUG) console.log(`AI score ${detectionResult.score}% too high, regenerating with human instructions`);
        onProgress?.({ step: 'cover_letter', progress: 90, message: 'Humanizing content...' });

        coverLetter = await generateCoverLetter(matched, jdRequirements, resumeData, true);

        // Re-check AI detection on the humanized version
        const recheck = await detectAIContent(coverLetter);
        aiDetection = {
          score: recheck.score,
          isHumanPassing: recheck.isHumanPassing,
          feedback: recheck.feedback,
        };
      } else {
        aiDetection = {
          score: detectionResult.score,
          isHumanPassing: detectionResult.isHumanPassing,
          feedback: detectionResult.feedback,
        };
      }
    } catch (error) {
      // If AI detection fails, continue without it
      if (DEBUG) console.log('AI detection failed:', error);
      aiDetection = {
        score: 0,
        isHumanPassing: true,
        feedback: 'Detection unavailable',
      };
    }

    onProgress?.({ step: 'complete', progress: 100, message: 'Complete!' });

    const processingTime = Date.now() - startTime;

    return {
      resume: tailoredResume,
      coverLetter,
      matchScore,
      matchedItems: matched,
      missingItems: missing,
      processingTime,
      aiDetection,
    };
  } catch (error) {
    throw createTailoringError(error as Error);
  }
}

/**
 * Quick tailoring (minimal LLM, for offline/fast mode)
 * Uses only 1 LLM call for JD analysis
 */
export async function tailorResumeQuick(
  resumeText: string,
  jdText: string,
  onProgress?: ProgressCallback
): Promise<TailoringResult> {
  const startTime = Date.now();

  try {
    onProgress?.({ step: 'parsing', progress: 20, message: 'Parsing...' });
    const resumeData = parseResume(resumeText);

    onProgress?.({ step: 'analyzing', progress: 50, message: 'Analyzing...' });
    const jdRequirements = await analyzeJobDescription(jdText);

    onProgress?.({ step: 'matching', progress: 70, message: 'Matching...' });
    const { matched, missing, hasDomainMismatch } = matchResume(resumeData, jdRequirements);
    const matchScore = calculateMatchScore(matched, missing, hasDomainMismatch);

    onProgress?.({ step: 'complete', progress: 100, message: 'Complete!' });

    // Use quick templates instead of LLM
    const tailoredResume = createQuickTailoredResume(resumeData, matched);
    const coverLetter = generateQuickCoverLetter(matched, jdRequirements, resumeData);

    return {
      resume: tailoredResume,
      coverLetter,
      matchScore,
      matchedItems: matched,
      missingItems: missing,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    throw createTailoringError(error as Error);
  }
}

/**
 * Create quick tailored resume without LLM formatting
 */
function createQuickTailoredResume(
  resume: ResumeData,
  matched: ReturnType<typeof matchResume>['matched']
) {
  // Just reorder experiences to prioritize matched ones
  const matchedExps = new Set(
    matched
      .filter((m) => m.matchedItem && 'title' in m.matchedItem)
      .map((m) => (m.matchedItem as any).title)
  );

  const sortedExperiences = [...resume.experiences].sort((a, b) => {
    const aMatched = matchedExps.has(a.title) ? 1 : 0;
    const bMatched = matchedExps.has(b.title) ? 1 : 0;
    return bMatched - aMatched;
  });

  return {
    skills: resume.skills.map((s) => s.name),
    experiences: sortedExperiences.map((e) => ({
      title: e.title,
      company: e.company,
      dateRange: e.dateRange,
      bullets: e.bullets.map((b) => b.text),
    })),
    education: resume.education.map((e) => e.originalText),
    rawText: resume.rawText,
  };
}

/**
 * Convert error to TailoringError
 */
function createTailoringError(error: Error): TailoringError {
  const message = error.message.toLowerCase();

  if (message.includes('parse')) {
    return { type: 'parse_error', message: error.message, details: error };
  }
  if (message.includes('jd') || message.includes('job')) {
    return { type: 'jd_analysis_error', message: error.message, details: error };
  }
  if (message.includes('match')) {
    return { type: 'matching_error', message: error.message, details: error };
  }
  if (message.includes('format')) {
    return { type: 'formatting_error', message: error.message, details: error };
  }
  if (message.includes('cover')) {
    return { type: 'cover_letter_error', message: error.message, details: error };
  }
  if (message.includes('timeout')) {
    return { type: 'timeout', message: error.message, details: error };
  }

  return { type: 'api_error', message: error.message, details: error };
}

/**
 * Re-export types for convenience
 */
export type { TailoringResult, TailoringError } from './types';
