/**
 * Resume Matcher - Deterministic matching, NO LLM
 * Matches resume items to job requirements
 */

import {
  ResumeData,
  JDRequirements,
  Requirement,
  MatchResult,
  Skill,
  Bullet,
  Education,
} from './types';

// Skill synonyms for semantic matching
const SKILL_SYNONYMS: Record<string, string[]> = {
  javascript: ['js', 'es6', 'ecmascript', 'node', 'nodejs'],
  typescript: ['ts'],
  react: ['reactjs', 'react.js', 'react native', 'rn'],
  python: ['py', 'django', 'flask', 'fastapi'],
  aws: ['amazon web services', 'ec2', 's3', 'lambda', 'cloudformation'],
  docker: ['containerization', 'containers', 'kubernetes', 'k8s'],
  sql: ['mysql', 'postgresql', 'postgres', 'database', 'nosql', 'mongodb'],
  agile: ['scrum', 'kanban', 'sprint', 'jira'],
  leadership: ['lead', 'managed', 'mentored', 'team lead'],
  communication: ['presenting', 'stakeholder', 'cross-functional'],
};

/**
 * Match resume data to job requirements
 */
export function matchResume(
  resume: ResumeData,
  jd: JDRequirements
): { matched: MatchResult[]; missing: MatchResult[] } {
  const allRequirements = [
    ...jd.required.map((r) => ({ ...r, isRequired: true })),
    ...jd.preferred.map((r) => ({ ...r, isRequired: false })),
  ];

  const matched: MatchResult[] = [];
  const missing: MatchResult[] = [];

  for (const req of allRequirements) {
    const match = findBestMatch(req, resume, jd.keywords);

    if (match.score >= 50) {
      matched.push(match);
    } else {
      missing.push(match);
    }
  }

  // Sort by score descending
  matched.sort((a, b) => b.score - a.score);
  missing.sort((a, b) => {
    // Required items first, then by importance
    const impOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return impOrder[a.requirement.importance] - impOrder[b.requirement.importance];
  });

  return { matched, missing };
}

/**
 * Find the best match for a requirement in the resume
 */
function findBestMatch(
  requirement: Requirement,
  resume: ResumeData,
  keywords: string[]
): MatchResult {
  let bestMatch: MatchResult = {
    requirement,
    matchedItem: null,
    score: 0,
    matchType: 'missing',
    originalText: '',
  };

  // Check skills
  for (const skill of resume.skills) {
    const score = scoreSkillMatch(requirement.text, skill.name);
    if (score > bestMatch.score) {
      bestMatch = {
        requirement,
        matchedItem: skill,
        score,
        matchType: getMatchType(score),
        originalText: skill.originalText,
      };
    }
  }

  // Check experience bullets
  for (const exp of resume.experiences) {
    for (const bullet of exp.bullets) {
      const score = scoreBulletMatch(requirement.text, bullet, keywords);
      if (score > bestMatch.score) {
        bestMatch = {
          requirement,
          matchedItem: bullet,
          score,
          matchType: getMatchType(score),
          originalText: bullet.text,
        };
      }
    }
  }

  // Check education
  for (const edu of resume.education) {
    const score = scoreEducationMatch(requirement.text, edu);
    if (score > bestMatch.score) {
      bestMatch = {
        requirement,
        matchedItem: edu,
        score,
        matchType: getMatchType(score),
        originalText: edu.originalText,
      };
    }
  }

  return bestMatch;
}

/**
 * Score skill match
 */
function scoreSkillMatch(requirement: string, skillName: string): number {
  const reqLower = requirement.toLowerCase();
  const skillLower = skillName.toLowerCase();

  // Exact match
  if (reqLower.includes(skillLower) || skillLower.includes(reqLower)) {
    return 100;
  }

  // Check synonyms
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    const allTerms = [canonical, ...synonyms];
    const reqHas = allTerms.some((t) => reqLower.includes(t));
    const skillHas = allTerms.some((t) => skillLower.includes(t));

    if (reqHas && skillHas) {
      return 85;
    }
  }

  // Partial match (any word overlap)
  const reqWords = reqLower.split(/\s+/);
  const skillWords = skillLower.split(/\s+/);
  const overlap = reqWords.filter((w) => skillWords.includes(w) && w.length > 2);

  if (overlap.length > 0) {
    return 60 + Math.min(overlap.length * 10, 20);
  }

  return 0;
}

/**
 * Score bullet point match
 */
function scoreBulletMatch(
  requirement: string,
  bullet: Bullet,
  keywords: string[]
): number {
  const reqLower = requirement.toLowerCase();
  const bulletLower = bullet.text.toLowerCase();
  let score = 0;

  // Check for keyword matches
  for (const keyword of keywords) {
    if (bulletLower.includes(keyword.toLowerCase())) {
      score += 15;
    }
  }

  // Check for direct requirement text overlap
  const reqWords = reqLower.split(/\s+/).filter((w) => w.length > 3);
  const matchedWords = reqWords.filter((w) => bulletLower.includes(w));
  const wordMatchRatio = matchedWords.length / Math.max(reqWords.length, 1);

  score += wordMatchRatio * 50;

  // Bonus for metrics
  if (bullet.metrics.length > 0) {
    score += 10;
  }

  // Bonus for action verbs
  const actionVerbs = ['led', 'developed', 'implemented', 'built', 'created', 'managed'];
  if (actionVerbs.some((v) => bulletLower.startsWith(v))) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Score education match
 */
function scoreEducationMatch(requirement: string, education: Education): number {
  const reqLower = requirement.toLowerCase();
  const eduText = `${education.degree} ${education.institution}`.toLowerCase();

  // Degree type match
  const degreeTypes = ['bachelor', 'master', 'phd', 'mba', 'associate'];
  for (const degree of degreeTypes) {
    if (reqLower.includes(degree) && eduText.includes(degree)) {
      return 90;
    }
  }

  // Field of study match
  const fields = ['computer science', 'engineering', 'business', 'marketing', 'design'];
  for (const field of fields) {
    if (reqLower.includes(field) && eduText.includes(field)) {
      return 85;
    }
  }

  // Generic degree requirement match
  if (reqLower.includes('degree') && education.degree) {
    return 70;
  }

  return 0;
}

/**
 * Get match type based on score
 */
function getMatchType(score: number): MatchResult['matchType'] {
  if (score >= 90) return 'exact';
  if (score >= 70) return 'semantic';
  if (score >= 50) return 'partial';
  return 'missing';
}

/**
 * Calculate overall match score
 */
export function calculateMatchScore(
  matched: MatchResult[],
  missing: MatchResult[]
): number {
  const total = matched.length + missing.length;
  if (total === 0) return 0;

  // Weight by importance
  const importanceWeight = { critical: 3, high: 2, medium: 1, low: 0.5 };

  let weightedMatched = 0;
  let totalWeight = 0;

  for (const m of matched) {
    const weight = importanceWeight[m.requirement.importance];
    weightedMatched += (m.score / 100) * weight;
    totalWeight += weight;
  }

  for (const m of missing) {
    const weight = importanceWeight[m.requirement.importance];
    totalWeight += weight;
  }

  return Math.round((weightedMatched / totalWeight) * 100);
}
