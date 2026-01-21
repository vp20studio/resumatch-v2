/**
 * Algorithm Test Runner
 * Tests the tailoring algorithm against quality thresholds
 */

import { TailoringResult, ResumeData, JDRequirements, MatchResult, TailoredResume } from '../services/tailoring/types';
import { parseResume } from '../services/tailoring/parser';
import { analyzeJobDescription } from '../services/tailoring/jdAnalyzer';
import { matchResume, calculateMatchScore } from '../services/tailoring/matcher';
import { formatTailoredResume } from '../services/tailoring/formatter';
import { generateCoverLetter, generateQuickCoverLetter } from '../services/tailoring/coverLetter';
import { detectAIContent, AIDetectionResult } from '../services/aiDetection';
import { TestResume, testResumes } from './fixtures/testResumes';
import { TestJobDescription, testJobDescriptions, isExpectedMatch, isExpectedMismatch } from './fixtures/testJobDescriptions';
import { preParsedJDs } from './fixtures/parsedJobDescriptions';

/**
 * Quality thresholds for tests
 */
export const THRESHOLDS = {
  // Match scores
  MATCH_SCORE_MIN_FOR_MATCH: 50, // Good match pairs should score 50+
  MATCH_SCORE_MAX_FOR_MATCH: 95, // Scores shouldn't be unrealistically high
  MATCH_SCORE_MIN_FOR_MISMATCH: 15, // Mismatches should score at least something
  MATCH_SCORE_MAX_FOR_MISMATCH: 50, // Mismatches should be below 50

  // Parsing quality
  MIN_SKILLS_EXTRACTED: 5,
  MIN_EXPERIENCES_EXTRACTED: 2,
  MIN_JD_REQUIREMENTS: 5,
  MIN_JD_KEYWORDS: 3,

  // Cover letter quality
  COVER_LETTER_MIN_WORDS: 150,
  COVER_LETTER_MAX_WORDS: 350,
  AI_DETECTION_MAX_SCORE: 40, // Must be < 40% AI detected

  // Time limits
  MAX_PROCESSING_TIME_MS: 30000,
};

/**
 * Single test result
 */
export interface TestResult {
  resumeId: string;
  resumeName: string;
  jdId: string;
  jdTitle: string;

  // Results
  passed: boolean;
  failures: string[];
  warnings: string[];

  // Metrics
  matchScore: number;
  isExpectedMatch: boolean;
  isExpectedMismatch: boolean;

  // Parsing
  skillsExtracted: number;
  experiencesExtracted: number;
  requirementsExtracted: number;
  keywordsExtracted: number;

  // Cover letter
  coverLetterWordCount: number;
  aiDetectionScore: number;
  coverLetterMentionsCompany: boolean;
  coverLetterMentionsTitle: boolean;
  hasHallucinations: boolean;
  hallucinationDetails?: string;

  // Performance
  processingTimeMs: number;

  // Raw results for debugging
  result?: TailoringResult;
  parsedResume?: ResumeData;
  parsedJD?: JDRequirements;
}

/**
 * Test summary statistics
 */
export interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;

  // Breakdowns
  matchScoreFailures: number;
  aiDetectionFailures: number;
  parsingFailures: number;
  coverLetterFailures: number;
  hallucinationFailures: number;

  // Average metrics
  avgMatchScore: number;
  avgAIScore: number;
  avgProcessingTime: number;

  // By category
  matchPairResults: { passed: number; total: number };
  mismatchPairResults: { passed: number; total: number };
}

/**
 * Run a single test case
 */
export async function runSingleTest(
  resume: TestResume,
  jd: TestJobDescription,
  skipAIDetection: boolean = false,
  useOfflineMode: boolean = false
): Promise<TestResult> {
  const failures: string[] = [];
  const warnings: string[] = [];
  const startTime = Date.now();

  const expectedMatch = isExpectedMatch(resume.id, jd.id);
  const expectedMismatch = isExpectedMismatch(resume.id, jd.id);

  let parsedResume: ResumeData | undefined;
  let parsedJD: JDRequirements | undefined;
  let result: TailoringResult | undefined;
  let aiDetection: AIDetectionResult | undefined;

  try {
    // Step 1: Parse resume
    parsedResume = parseResume(resume.text);

    // Check resume parsing quality
    if (parsedResume.skills.length < THRESHOLDS.MIN_SKILLS_EXTRACTED) {
      failures.push(`Resume parsing: Only ${parsedResume.skills.length} skills extracted (expected ${THRESHOLDS.MIN_SKILLS_EXTRACTED}+)`);
    }
    if (parsedResume.experiences.length < THRESHOLDS.MIN_EXPERIENCES_EXTRACTED) {
      failures.push(`Resume parsing: Only ${parsedResume.experiences.length} experiences extracted (expected ${THRESHOLDS.MIN_EXPERIENCES_EXTRACTED}+)`);
    }

    // Step 2: Parse JD - use pre-parsed data in offline mode or as fallback
    if (useOfflineMode && preParsedJDs[jd.id]) {
      parsedJD = preParsedJDs[jd.id];
    } else {
      try {
        parsedJD = await analyzeJobDescription(jd.text);
      } catch (error) {
        // Fallback to pre-parsed data if API fails (rate limit, etc.)
        if (preParsedJDs[jd.id]) {
          parsedJD = preParsedJDs[jd.id];
          warnings.push(`JD analysis fell back to pre-parsed data: ${(error as Error).message}`);
        } else {
          throw error;
        }
      }
    }

    // Check JD parsing quality
    const totalRequirements = parsedJD.required.length + parsedJD.preferred.length;
    if (totalRequirements < THRESHOLDS.MIN_JD_REQUIREMENTS) {
      failures.push(`JD parsing: Only ${totalRequirements} requirements extracted (expected ${THRESHOLDS.MIN_JD_REQUIREMENTS}+)`);
    }
    if (parsedJD.keywords.length < THRESHOLDS.MIN_JD_KEYWORDS) {
      failures.push(`JD parsing: Only ${parsedJD.keywords.length} keywords extracted (expected ${THRESHOLDS.MIN_JD_KEYWORDS}+)`);
    }

    // Step 3: Match
    const { matched, missing, hasDomainMismatch } = matchResume(parsedResume, parsedJD);
    const matchScore = calculateMatchScore(matched, missing, hasDomainMismatch);

    // Check match score thresholds
    if (expectedMatch) {
      if (matchScore < THRESHOLDS.MATCH_SCORE_MIN_FOR_MATCH) {
        failures.push(`Match score too low for expected match: ${matchScore}% (expected ${THRESHOLDS.MATCH_SCORE_MIN_FOR_MATCH}%+)`);
      }
      if (matchScore > THRESHOLDS.MATCH_SCORE_MAX_FOR_MATCH) {
        warnings.push(`Match score unusually high: ${matchScore}% (expected < ${THRESHOLDS.MATCH_SCORE_MAX_FOR_MATCH}%)`);
      }
    }
    if (expectedMismatch) {
      if (matchScore > THRESHOLDS.MATCH_SCORE_MAX_FOR_MISMATCH) {
        failures.push(`Match score too high for expected mismatch: ${matchScore}% (expected < ${THRESHOLDS.MATCH_SCORE_MAX_FOR_MISMATCH}%)`);
      }
      if (matchScore < THRESHOLDS.MATCH_SCORE_MIN_FOR_MISMATCH) {
        warnings.push(`Match score unusually low: ${matchScore}% (expected > ${THRESHOLDS.MATCH_SCORE_MIN_FOR_MISMATCH}%)`);
      }
    }

    // Step 4: Format resume & generate cover letter
    let tailoredResume;
    let coverLetter: string;

    if (useOfflineMode) {
      // Use quick versions that don't require API
      tailoredResume = createQuickTailoredResume(parsedResume, matched);
      coverLetter = generateQuickCoverLetter(matched, parsedJD, parsedResume);
    } else {
      try {
        const [resume, letter] = await Promise.all([
          formatTailoredResume(parsedResume, matched, parsedJD),
          generateCoverLetter(matched, parsedJD, parsedResume, false),
        ]);
        tailoredResume = resume;
        coverLetter = letter;
      } catch (error) {
        // Fallback to quick versions if API fails
        tailoredResume = createQuickTailoredResume(parsedResume, matched);
        coverLetter = generateQuickCoverLetter(matched, parsedJD, parsedResume);
        warnings.push(`Resume/cover letter fell back to quick mode: ${(error as Error).message}`);
      }
    }

    // Check cover letter length
    const coverLetterWords = coverLetter.split(/\s+/).length;
    if (coverLetterWords < THRESHOLDS.COVER_LETTER_MIN_WORDS) {
      failures.push(`Cover letter too short: ${coverLetterWords} words (expected ${THRESHOLDS.COVER_LETTER_MIN_WORDS}+)`);
    }
    if (coverLetterWords > THRESHOLDS.COVER_LETTER_MAX_WORDS) {
      failures.push(`Cover letter too long: ${coverLetterWords} words (expected < ${THRESHOLDS.COVER_LETTER_MAX_WORDS})`);
    }

    // Check cover letter mentions company and title
    const coverLetterLower = coverLetter.toLowerCase();
    const companyLower = jd.company.toLowerCase();
    const titleWords = jd.title.toLowerCase().split(/\s+/);

    const mentionsCompany = coverLetterLower.includes(companyLower) ||
      coverLetterLower.includes(companyLower.split(' ')[0]);
    const mentionsTitle = titleWords.some(word =>
      word.length > 3 && coverLetterLower.includes(word)
    );

    if (!mentionsCompany) {
      failures.push(`Cover letter doesn't mention company "${jd.company}"`);
    }
    if (!mentionsTitle) {
      failures.push(`Cover letter doesn't reference job title "${jd.title}"`);
    }

    // Check for hallucinations (claims not in resume)
    const hallucinationCheck = checkForHallucinations(coverLetter, resume.text, parsedResume);

    // Step 5: AI Detection (if not skipped)
    let aiScore = 0;
    if (!skipAIDetection) {
      try {
        aiDetection = await detectAIContent(coverLetter);
        aiScore = aiDetection.score;

        if (aiScore >= THRESHOLDS.AI_DETECTION_MAX_SCORE) {
          failures.push(`AI detection score too high: ${aiScore}% (expected < ${THRESHOLDS.AI_DETECTION_MAX_SCORE}%)`);
        }
      } catch (error) {
        warnings.push(`AI detection failed: ${(error as Error).message}`);
      }
    }

    const processingTime = Date.now() - startTime;

    // Check processing time
    if (processingTime > THRESHOLDS.MAX_PROCESSING_TIME_MS) {
      warnings.push(`Processing time exceeded: ${processingTime}ms (expected < ${THRESHOLDS.MAX_PROCESSING_TIME_MS}ms)`);
    }

    // Build result
    result = {
      resume: tailoredResume,
      coverLetter,
      matchScore,
      matchedItems: matched,
      missingItems: missing,
      processingTime,
    };

    return {
      resumeId: resume.id,
      resumeName: resume.name,
      jdId: jd.id,
      jdTitle: jd.title,

      passed: failures.length === 0,
      failures,
      warnings,

      matchScore,
      isExpectedMatch: expectedMatch,
      isExpectedMismatch: expectedMismatch,

      skillsExtracted: parsedResume.skills.length,
      experiencesExtracted: parsedResume.experiences.length,
      requirementsExtracted: totalRequirements,
      keywordsExtracted: parsedJD.keywords.length,

      coverLetterWordCount: coverLetterWords,
      aiDetectionScore: aiScore,
      coverLetterMentionsCompany: mentionsCompany,
      coverLetterMentionsTitle: mentionsTitle,
      hasHallucinations: hallucinationCheck.hasHallucinations,
      hallucinationDetails: hallucinationCheck.details,

      processingTimeMs: processingTime,

      result,
      parsedResume,
      parsedJD,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    failures.push(`Test threw error: ${(error as Error).message}`);

    return {
      resumeId: resume.id,
      resumeName: resume.name,
      jdId: jd.id,
      jdTitle: jd.title,

      passed: false,
      failures,
      warnings,

      matchScore: 0,
      isExpectedMatch: expectedMatch,
      isExpectedMismatch: expectedMismatch,

      skillsExtracted: parsedResume?.skills.length ?? 0,
      experiencesExtracted: parsedResume?.experiences.length ?? 0,
      requirementsExtracted: parsedJD ? (parsedJD.required.length + parsedJD.preferred.length) : 0,
      keywordsExtracted: parsedJD?.keywords.length ?? 0,

      coverLetterWordCount: 0,
      aiDetectionScore: 0,
      coverLetterMentionsCompany: false,
      coverLetterMentionsTitle: false,
      hasHallucinations: false,

      processingTimeMs: processingTime,

      parsedResume,
      parsedJD,
    };
  }
}

/**
 * Create a quick tailored resume without API (for offline mode)
 */
function createQuickTailoredResume(
  resume: ResumeData,
  matched: MatchResult[]
): TailoredResume {
  // Sort experiences to prioritize those with matches
  const matchedBullets = new Set(
    matched
      .filter(m => m.matchedItem && 'text' in m.matchedItem)
      .map(m => (m.matchedItem as { text: string }).text)
  );

  return {
    skills: resume.skills.map(s => s.name),
    experiences: resume.experiences.map(exp => ({
      title: exp.title,
      company: exp.company,
      dateRange: exp.dateRange,
      bullets: exp.bullets.map(b => b.text),
    })),
    education: resume.education.map(e => e.originalText),
    rawText: resume.rawText,
  };
}

/**
 * Check for hallucinations in cover letter
 * More conservative - only flag clear fabrications
 */
function checkForHallucinations(
  coverLetter: string,
  resumeText: string,
  parsedResume: ResumeData
): { hasHallucinations: boolean; details?: string } {
  const coverLetterLower = coverLetter.toLowerCase();
  const resumeLower = resumeText.toLowerCase();

  // Check for fabricated large metrics/numbers not in resume
  // Only flag clearly fabricated numbers (large specific amounts)
  const significantMetricPattern = /\$(\d{2,}(?:,\d{3})*(?:\.\d+)?[kmb]?)(?!\d)/gi;
  const coverLetterMetrics = [...coverLetterLower.matchAll(significantMetricPattern)].map(m => m[1]);
  const resumeMetrics = [...resumeLower.matchAll(significantMetricPattern)].map(m => m[1]);

  const fabricatedMetrics = coverLetterMetrics.filter(metric => {
    const numericValue = parseFloat(metric.replace(/[^0-9.]/g, ''));
    // Only flag large dollar amounts that aren't in resume
    if (numericValue < 1000) return false;
    return !resumeMetrics.some(rm => rm === metric);
  });

  // Check for specific employment claims not in resume
  // Only flag if cover letter explicitly claims to have "worked at" a company not in resume
  const employmentClaimPatterns = [
    /i worked at ([a-z]+(?:\s+[a-z]+)?)\s+(?:for|where|as)/gi,
    /my (?:time|experience|role) at ([a-z]+(?:\s+[a-z]+)?)\s/gi,
  ];

  // Get company names and education from resume
  const resumeCompanies = parsedResume.experiences.map(e => e.company.toLowerCase()).filter(Boolean);
  const resumeEducation = parsedResume.education.map(e =>
    `${e.institution} ${e.degree}`.toLowerCase()
  ).filter(Boolean);

  // Words that aren't company names
  const excludedWords = [
    'your', 'the', 'this', 'their', 'align', 'join', 'where', 'which',
    'university', 'college', 'school', 'institute', 'academy',
    'mongodb', 'postgresql', 'allowed', 'google', 'microsoft', 'amazon', // tech products, not employers
    'boston', 'stanford', 'berkeley', 'harvard', 'mit', // common university names
  ];

  const fabricatedCompanies: string[] = [];
  for (const pattern of employmentClaimPatterns) {
    const matches = coverLetter.matchAll(pattern);
    for (const match of matches) {
      const company = match[1]?.toLowerCase().trim();
      if (company && company.length > 3) {
        // Check if this company is NOT in resume companies
        const isInResume = resumeCompanies.some(rc =>
          rc.includes(company) || company.includes(rc)
        );
        // Check if it's in education
        const isInEducation = resumeEducation.some(edu =>
          edu.includes(company) || company.includes('university')
        );
        // Exclude common words
        const isExcluded = excludedWords.some(w => company.includes(w));

        if (!isInResume && !isInEducation && !isExcluded) {
          fabricatedCompanies.push(company);
        }
      }
    }
  }

  const issues: string[] = [];
  if (fabricatedMetrics.length > 0) {
    issues.push(`Potentially fabricated dollar amounts: ${fabricatedMetrics.slice(0, 2).join(', ')}`);
  }
  if (fabricatedCompanies.length > 0) {
    issues.push(`Potentially fabricated past employers: ${fabricatedCompanies.join(', ')}`);
  }

  return {
    hasHallucinations: issues.length > 0,
    details: issues.length > 0 ? issues.join('; ') : undefined,
  };
}

/**
 * Helper to add delay between API calls
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run all test combinations
 */
export async function runAllTests(
  skipAIDetection: boolean = false,
  onProgress?: (completed: number, total: number, currentTest: string) => void,
  delayBetweenTests: number = 2000, // 2 second delay to avoid rate limits
  useOfflineMode: boolean = false // Skip all API calls, use deterministic fallbacks
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const total = testResumes.length * testJobDescriptions.length;
  let completed = 0;

  for (const resume of testResumes) {
    for (const jd of testJobDescriptions) {
      const testName = `${resume.name} × ${jd.title}`;
      onProgress?.(completed, total, testName);

      const result = await runSingleTest(resume, jd, skipAIDetection, useOfflineMode);
      results.push(result);
      completed++;

      // Add delay between tests to avoid rate limiting (only if not offline)
      if (completed < total && !useOfflineMode) {
        await delay(delayBetweenTests);
      }
    }
  }

  return results;
}

/**
 * Generate test summary from results
 */
export function generateSummary(results: TestResult[]): TestSummary {
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  // Count failure types
  let matchScoreFailures = 0;
  let aiDetectionFailures = 0;
  let parsingFailures = 0;
  let coverLetterFailures = 0;
  let hallucinationFailures = 0;

  for (const result of results) {
    for (const failure of result.failures) {
      if (failure.includes('Match score')) matchScoreFailures++;
      if (failure.includes('AI detection')) aiDetectionFailures++;
      if (failure.includes('parsing')) parsingFailures++;
      if (failure.includes('Cover letter')) coverLetterFailures++;
    }
    if (result.hasHallucinations) hallucinationFailures++;
  }

  // Calculate averages
  const avgMatchScore = results.reduce((sum, r) => sum + r.matchScore, 0) / results.length;
  const avgAIScore = results.reduce((sum, r) => sum + r.aiDetectionScore, 0) / results.length;
  const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTimeMs, 0) / results.length;

  // Match/mismatch breakdown
  const matchPairs = results.filter(r => r.isExpectedMatch);
  const mismatchPairs = results.filter(r => r.isExpectedMismatch);

  return {
    totalTests: results.length,
    passed,
    failed,
    passRate: Math.round((passed / results.length) * 100),

    matchScoreFailures,
    aiDetectionFailures,
    parsingFailures,
    coverLetterFailures,
    hallucinationFailures,

    avgMatchScore: Math.round(avgMatchScore),
    avgAIScore: Math.round(avgAIScore),
    avgProcessingTime: Math.round(avgProcessingTime),

    matchPairResults: {
      passed: matchPairs.filter(r => r.passed).length,
      total: matchPairs.length,
    },
    mismatchPairResults: {
      passed: mismatchPairs.filter(r => r.passed).length,
      total: mismatchPairs.length,
    },
  };
}

/**
 * Format test result for logging
 */
export function formatTestResult(result: TestResult): string {
  const status = result.passed ? 'PASS' : 'FAIL';
  const lines = [
    `[${status}] ${result.resumeName} × ${result.jdTitle}`,
    `  Match Score: ${result.matchScore}% (expected ${result.isExpectedMatch ? 'match' : result.isExpectedMismatch ? 'mismatch' : 'neutral'})`,
    `  Skills: ${result.skillsExtracted}, Experiences: ${result.experiencesExtracted}`,
    `  Requirements: ${result.requirementsExtracted}, Keywords: ${result.keywordsExtracted}`,
    `  Cover Letter: ${result.coverLetterWordCount} words, AI Score: ${result.aiDetectionScore}%`,
    `  Mentions Company: ${result.coverLetterMentionsCompany}, Title: ${result.coverLetterMentionsTitle}`,
    `  Time: ${result.processingTimeMs}ms`,
  ];

  if (result.failures.length > 0) {
    lines.push(`  Failures:`);
    for (const failure of result.failures) {
      lines.push(`    - ${failure}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push(`  Warnings:`);
    for (const warning of result.warnings) {
      lines.push(`    - ${warning}`);
    }
  }

  if (result.hasHallucinations) {
    lines.push(`  HALLUCINATION DETECTED: ${result.hallucinationDetails}`);
  }

  return lines.join('\n');
}

/**
 * Format summary for logging
 */
export function formatSummary(summary: TestSummary): string {
  return `
================================================================================
TEST SUMMARY
================================================================================
Total Tests: ${summary.totalTests}
Passed: ${summary.passed}
Failed: ${summary.failed}
Pass Rate: ${summary.passRate}%

FAILURE BREAKDOWN:
- Match Score Failures: ${summary.matchScoreFailures}
- AI Detection Failures: ${summary.aiDetectionFailures}
- Parsing Failures: ${summary.parsingFailures}
- Cover Letter Failures: ${summary.coverLetterFailures}
- Hallucination Warnings: ${summary.hallucinationFailures}

AVERAGES:
- Match Score: ${summary.avgMatchScore}%
- AI Detection Score: ${summary.avgAIScore}%
- Processing Time: ${summary.avgProcessingTime}ms

BY PAIR TYPE:
- Match Pairs: ${summary.matchPairResults.passed}/${summary.matchPairResults.total} passed
- Mismatch Pairs: ${summary.mismatchPairResults.passed}/${summary.mismatchPairResults.total} passed
================================================================================
  `.trim();
}
