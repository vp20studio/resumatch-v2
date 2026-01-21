/**
 * Tailoring Orchestrator
 * Coordinates the 2-pass tailoring process
 * Target: 5-8 seconds total (without AI detection)
 * Target: 8-15 seconds (with AI detection)
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

// AI Detection settings
const AI_DETECTION_ENABLED = true;
const AI_SCORE_THRESHOLD = 60; // Regenerate if above this
const MAX_HUMANIZE_ATTEMPTS = 1; // Only try once to avoid long waits

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
    // ============================================
    // PASS 1: Extraction & Matching (fast, mostly deterministic)
    // ============================================

    // Step 1A: Parse resume (no LLM) - ~10ms
    onProgress?.({ step: 'parsing', progress: 10, message: 'Parsing resume...' });
    const resumeData = parseResume(resumeText);
    if (DEBUG) logResumeData(resumeData);

    // Step 1B: Analyze JD (1 LLM call) - ~3-5s
    onProgress?.({ step: 'analyzing', progress: 25, message: 'Analyzing job description...' });
    const jdRequirements = await analyzeJobDescription(jdText);
    if (DEBUG) logJDRequirements(jdRequirements);

    // Step 1C: Match resume to JD (no LLM) - ~10ms
    onProgress?.({ step: 'matching', progress: 40, message: 'Matching qualifications...' });
    const { matched, missing, hasDomainMismatch } = matchResume(resumeData, jdRequirements);
    const matchScore = calculateMatchScore(matched, missing, hasDomainMismatch);
    if (DEBUG) {
      logMatchResults(matched, missing);
      logScoreCalculation(matched, missing, matchScore);
    }

    // ============================================
    // PASS 2: Generation (parallel LLM calls) - ~5-8s total
    // ============================================

    onProgress?.({ step: 'formatting', progress: 55, message: 'Generating content...' });

    // Run formatting and cover letter generation in parallel
    const [tailoredResume, coverLetter] = await Promise.all([
      formatTailoredResume(resumeData, matched, jdRequirements),
      generateCoverLetter(matched, jdRequirements, resumeData, false),
    ]);

    // ============================================
    // PASS 3: AI Detection (optional, adds ~5-10s if triggered)
    // ============================================
    
    let finalCoverLetter = coverLetter;
    let aiDetection: AIDetectionInfo = {
      score: 0,
      isHumanPassing: true,
      feedback: 'Detection skipped',
    };

    if (AI_DETECTION_ENABLED) {
      onProgress?.({ step: 'ai_check', progress: 75, message: 'Checking content quality...' });

      try {
        const detectionResult = await detectAIContent(coverLetter);
        
        if (DEBUG) {
          console.log(`Initial AI score: ${detectionResult.score}%`);
        }

        // If score is too high, try ONE humanized regeneration
        if (detectionResult.score > AI_SCORE_THRESHOLD) {
          onProgress?.({ step: 'cover_letter', progress: 85, message: 'Improving cover letter...' });
          
          if (DEBUG) {
            console.log(`AI score ${detectionResult.score}% > ${AI_SCORE_THRESHOLD}%, regenerating...`);
          }

          // Regenerate with humanize=true
          finalCoverLetter = await generateCoverLetter(matched, jdRequirements, resumeData, true);

          // Check again (but don't loop)
          const recheck = await detectAIContent(finalCoverLetter);
          
          if (DEBUG) {
            console.log(`After humanization: ${recheck.score}%`);
          }

          aiDetection = {
            score: recheck.score,
            isHumanPassing: recheck.score < 50,
            feedback: recheck.feedback,
          };

          // If still failing, keep the humanized version anyway (it's usually better)
          // but update the feedback
          if (recheck.score > AI_SCORE_THRESHOLD) {
            aiDetection.feedback = 'Some AI patterns detected. Consider minor edits.';
          }
        } else {
          // First attempt passed
          aiDetection = {
            score: detectionResult.score,
            isHumanPassing: detectionResult.score < 50,
            feedback: detectionResult.feedback,
          };
        }
      } catch (error) {
        // AI detection failed - continue without it
        if (DEBUG) console.log('AI detection error:', error);
        aiDetection = {
          score: 0,
          isHumanPassing: true,
          feedback: 'Detection unavailable',
        };
      }
    }

    onProgress?.({ step: 'complete', progress: 100, message: 'Complete!' });

    const processingTime = Date.now() - startTime;
    
    if (DEBUG) {
      console.log(`Total processing time: ${processingTime}ms`);
    }

    return {
      resume: tailoredResume,
      coverLetter: finalCoverLetter,
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
 * Uses only 1 LLM call for JD analysis, no AI detection
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
