// Main entry point
export {
  tailorResume,
  tailorResumeQuick,
  type TailoringProgress,
  type ProgressCallback,
} from './orchestrator';

// Types
export type {
  ResumeData,
  JDRequirements,
  MatchResult,
  TailoringResult,
  TailoringError,
  Skill,
  Experience,
  Bullet,
  Education,
} from './types';

// Individual modules (for advanced usage)
export { parseResume } from './parser';
export { analyzeJobDescription } from './jdAnalyzer';
export { matchResume, calculateMatchScore } from './matcher';
export { formatTailoredResume } from './formatter';
export { generateCoverLetter, generateQuickCoverLetter } from './coverLetter';
