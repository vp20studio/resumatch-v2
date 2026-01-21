/**
 * Test Runner Script
 * Execute with: npx ts-node src/__tests__/runTests.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  runAllTests,
  runSingleTest,
  generateSummary,
  formatTestResult,
  formatSummary,
  TestResult,
  TestSummary,
  THRESHOLDS,
} from './algorithmTest';
import { testResumes } from './fixtures/testResumes';
import { testJobDescriptions } from './fixtures/testJobDescriptions';

// Results log file path
const RESULTS_LOG_PATH = path.join(__dirname, 'results.log');

/**
 * Log message to both console and file
 */
function log(message: string, logFile?: string) {
  console.log(message);
  if (logFile) {
    fs.appendFileSync(logFile, message + '\n');
  }
}

/**
 * Clear the log file
 */
function clearLog(logFile: string) {
  fs.writeFileSync(logFile, '');
}

/**
 * Main test runner
 */
async function main() {
  const startTime = new Date();

  // Clear log file
  clearLog(RESULTS_LOG_PATH);

  log(`
================================================================================
RESUMATCH ALGORITHM TEST SUITE
Started: ${startTime.toISOString()}
================================================================================
`, RESULTS_LOG_PATH);

  log(`\nTest Configuration:`, RESULTS_LOG_PATH);
  log(`- Total Resumes: ${testResumes.length}`, RESULTS_LOG_PATH);
  log(`- Total Job Descriptions: ${testJobDescriptions.length}`, RESULTS_LOG_PATH);
  log(`- Total Test Combinations: ${testResumes.length * testJobDescriptions.length}`, RESULTS_LOG_PATH);
  log(`\nThresholds:`, RESULTS_LOG_PATH);
  log(`- Match Score (matching pairs): ${THRESHOLDS.MATCH_SCORE_MIN_FOR_MATCH}-${THRESHOLDS.MATCH_SCORE_MAX_FOR_MATCH}%`, RESULTS_LOG_PATH);
  log(`- Match Score (mismatched pairs): ${THRESHOLDS.MATCH_SCORE_MIN_FOR_MISMATCH}-${THRESHOLDS.MATCH_SCORE_MAX_FOR_MISMATCH}%`, RESULTS_LOG_PATH);
  log(`- AI Detection Max: ${THRESHOLDS.AI_DETECTION_MAX_SCORE}%`, RESULTS_LOG_PATH);
  log(`- Cover Letter Words: ${THRESHOLDS.COVER_LETTER_MIN_WORDS}-${THRESHOLDS.COVER_LETTER_MAX_WORDS}`, RESULTS_LOG_PATH);
  log(`- Min Skills: ${THRESHOLDS.MIN_SKILLS_EXTRACTED}`, RESULTS_LOG_PATH);
  log(`- Min Experiences: ${THRESHOLDS.MIN_EXPERIENCES_EXTRACTED}`, RESULTS_LOG_PATH);
  log(`- Min Requirements: ${THRESHOLDS.MIN_JD_REQUIREMENTS}`, RESULTS_LOG_PATH);

  log(`\n${'='.repeat(80)}`, RESULTS_LOG_PATH);
  log(`RUNNING TESTS...`, RESULTS_LOG_PATH);
  log(`${'='.repeat(80)}\n`, RESULTS_LOG_PATH);

  // Skip AI detection for faster testing (can be enabled with flag)
  const skipAI = process.argv.includes('--skip-ai');
  const offlineMode = process.argv.includes('--offline');

  if (skipAI) {
    log(`[INFO] Skipping AI detection for faster testing`, RESULTS_LOG_PATH);
  }
  if (offlineMode) {
    log(`[INFO] Running in offline mode (no API calls)`, RESULTS_LOG_PATH);
  }
  log('', RESULTS_LOG_PATH);

  // Run all tests
  const results = await runAllTests(
    skipAI,
    (completed, total, currentTest) => {
      const progress = Math.round((completed / total) * 100);
      process.stdout.write(`\r[${progress}%] Testing: ${currentTest.padEnd(60)}`);
    },
    offlineMode ? 0 : 2000, // No delay in offline mode
    offlineMode
  );

  console.log('\n'); // New line after progress

  // Log individual results
  log(`\n${'='.repeat(80)}`, RESULTS_LOG_PATH);
  log(`INDIVIDUAL TEST RESULTS`, RESULTS_LOG_PATH);
  log(`${'='.repeat(80)}\n`, RESULTS_LOG_PATH);

  for (const result of results) {
    log(formatTestResult(result), RESULTS_LOG_PATH);
    log('', RESULTS_LOG_PATH);
  }

  // Generate and log summary
  const summary = generateSummary(results);
  log(formatSummary(summary), RESULTS_LOG_PATH);

  // Identify patterns in failures
  log(`\n${'='.repeat(80)}`, RESULTS_LOG_PATH);
  log(`FAILURE ANALYSIS`, RESULTS_LOG_PATH);
  log(`${'='.repeat(80)}\n`, RESULTS_LOG_PATH);

  analyzeFailures(results, RESULTS_LOG_PATH);

  // Final status
  const endTime = new Date();
  const duration = (endTime.getTime() - startTime.getTime()) / 1000;

  log(`\n${'='.repeat(80)}`, RESULTS_LOG_PATH);
  log(`TEST RUN COMPLETE`, RESULTS_LOG_PATH);
  log(`${'='.repeat(80)}`, RESULTS_LOG_PATH);
  log(`Finished: ${endTime.toISOString()}`, RESULTS_LOG_PATH);
  log(`Duration: ${duration.toFixed(1)} seconds`, RESULTS_LOG_PATH);
  log(`Results saved to: ${RESULTS_LOG_PATH}`, RESULTS_LOG_PATH);

  // Return exit code
  const passRate = summary.passRate;
  if (passRate >= 90) {
    log(`\n SUCCESS: ${passRate}% pass rate meets 90% target!`, RESULTS_LOG_PATH);
    process.exit(0);
  } else {
    log(`\n BELOW TARGET: ${passRate}% pass rate (target: 90%)`, RESULTS_LOG_PATH);
    process.exit(1);
  }
}

/**
 * Analyze failure patterns and provide recommendations
 */
function analyzeFailures(results: TestResult[], logFile: string) {
  const failures = results.filter(r => !r.passed);

  if (failures.length === 0) {
    log('No failures to analyze!', logFile);
    return;
  }

  // Group failures by type
  const matchScoreIssues = failures.filter(r =>
    r.failures.some(f => f.includes('Match score'))
  );
  const aiDetectionIssues = failures.filter(r =>
    r.failures.some(f => f.includes('AI detection'))
  );
  const parsingIssues = failures.filter(r =>
    r.failures.some(f => f.includes('parsing'))
  );
  const coverLetterIssues = failures.filter(r =>
    r.failures.some(f => f.includes('Cover letter'))
  );

  // Match score analysis
  if (matchScoreIssues.length > 0) {
    log(`\n--- MATCH SCORE ISSUES (${matchScoreIssues.length}) ---`, logFile);

    const tooLow = matchScoreIssues.filter(r =>
      r.failures.some(f => f.includes('too low'))
    );
    const tooHigh = matchScoreIssues.filter(r =>
      r.failures.some(f => f.includes('too high'))
    );

    if (tooLow.length > 0) {
      log(`\nScores too low for expected matches: ${tooLow.length}`, logFile);
      log(`Recommendations:`, logFile);
      log(`  1. Check matcher.ts synonym lists - add missing synonyms`, logFile);
      log(`  2. Check scoring weights - may be too harsh`, logFile);
      log(`  3. Check parser.ts - may be missing skills extraction`, logFile);

      // Show specific examples
      log(`\nExamples of low-scoring matches:`, logFile);
      for (const result of tooLow.slice(0, 3)) {
        log(`  - ${result.resumeName} vs ${result.jdTitle}: ${result.matchScore}%`, logFile);
      }
    }

    if (tooHigh.length > 0) {
      log(`\nScores too high for expected mismatches: ${tooHigh.length}`, logFile);
      log(`Recommendations:`, logFile);
      log(`  1. Scoring may be too generous`, logFile);
      log(`  2. Check if requirements are being properly weighted`, logFile);
      log(`  3. Review partial match scoring`, logFile);

      // Show specific examples
      log(`\nExamples of high-scoring mismatches:`, logFile);
      for (const result of tooHigh.slice(0, 3)) {
        log(`  - ${result.resumeName} vs ${result.jdTitle}: ${result.matchScore}%`, logFile);
      }
    }
  }

  // AI detection analysis
  if (aiDetectionIssues.length > 0) {
    log(`\n--- AI DETECTION ISSUES (${aiDetectionIssues.length}) ---`, logFile);
    log(`Recommendations:`, logFile);
    log(`  1. Update coverLetter.ts prompt to be more human`, logFile);
    log(`  2. Add instructions: vary sentence length, use contractions`, logFile);
    log(`  3. Reduce corporate buzzwords`, logFile);
    log(`  4. Add slight imperfections to seem more natural`, logFile);

    const avgAIScore = aiDetectionIssues.reduce((sum, r) => sum + r.aiDetectionScore, 0) / aiDetectionIssues.length;
    log(`\nAverage AI score for failures: ${avgAIScore.toFixed(1)}%`, logFile);
  }

  // Parsing analysis
  if (parsingIssues.length > 0) {
    log(`\n--- PARSING ISSUES (${parsingIssues.length}) ---`, logFile);

    const resumeIssues = parsingIssues.filter(r =>
      r.failures.some(f => f.includes('Resume parsing'))
    );
    const jdIssues = parsingIssues.filter(r =>
      r.failures.some(f => f.includes('JD parsing'))
    );

    if (resumeIssues.length > 0) {
      log(`\nResume parsing issues: ${resumeIssues.length}`, logFile);
      log(`Recommendations:`, logFile);
      log(`  1. Improve skill extraction regex in parser.ts`, logFile);
      log(`  2. Add more skill patterns to recognize`, logFile);
      log(`  3. Check experience section detection`, logFile);
    }

    if (jdIssues.length > 0) {
      log(`\nJD parsing issues: ${jdIssues.length}`, logFile);
      log(`Recommendations:`, logFile);
      log(`  1. Improve requirement extraction in jdAnalyzer.ts`, logFile);
      log(`  2. Add more keyword patterns`, logFile);
      log(`  3. Check LLM prompt for JD analysis`, logFile);
    }
  }

  // Cover letter analysis
  if (coverLetterIssues.length > 0) {
    log(`\n--- COVER LETTER ISSUES (${coverLetterIssues.length}) ---`, logFile);

    const tooShort = coverLetterIssues.filter(r =>
      r.failures.some(f => f.includes('too short'))
    );
    const tooLong = coverLetterIssues.filter(r =>
      r.failures.some(f => f.includes('too long'))
    );
    const noCompany = coverLetterIssues.filter(r =>
      r.failures.some(f => f.includes("doesn't mention company"))
    );
    const noTitle = coverLetterIssues.filter(r =>
      r.failures.some(f => f.includes("doesn't reference job title"))
    );

    if (tooShort.length > 0) {
      log(`\nCover letters too short: ${tooShort.length}`, logFile);
      log(`  - Adjust maxTokens in prompt`, logFile);
      log(`  - Update length instructions`, logFile);
    }

    if (tooLong.length > 0) {
      log(`\nCover letters too long: ${tooLong.length}`, logFile);
      log(`  - Reduce maxTokens in prompt`, logFile);
      log(`  - Update length instructions`, logFile);
    }

    if (noCompany.length > 0) {
      log(`\nCover letters missing company name: ${noCompany.length}`, logFile);
      log(`  - Ensure company name is passed to prompt`, logFile);
      log(`  - Add explicit instruction to mention company`, logFile);
    }

    if (noTitle.length > 0) {
      log(`\nCover letters missing job title: ${noTitle.length}`, logFile);
      log(`  - Ensure job title is passed to prompt`, logFile);
      log(`  - Add explicit instruction to mention role`, logFile);
    }
  }

  // Hallucination analysis
  const hallucinationResults = results.filter(r => r.hasHallucinations);
  if (hallucinationResults.length > 0) {
    log(`\n--- HALLUCINATION ISSUES (${hallucinationResults.length}) ---`, logFile);
    log(`Recommendations:`, logFile);
    log(`  1. Strengthen 'ONLY use facts from resume' instruction`, logFile);
    log(`  2. Add validation step to check claims against source`, logFile);
    log(`  3. Reduce creativity in prompt`, logFile);

    log(`\nExamples:`, logFile);
    for (const result of hallucinationResults.slice(0, 3)) {
      log(`  - ${result.resumeName}: ${result.hallucinationDetails}`, logFile);
    }
  }
}

// Run the test suite
main().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
