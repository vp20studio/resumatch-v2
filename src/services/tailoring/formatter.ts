/**
 * Resume Formatter - 1 LLM call
 * Light reformatting: reorder and emphasize, NOT rewrite
 */

import {
  ResumeData,
  MatchResult,
  JDRequirements,
  TailoredResume,
  TailoredExperience,
} from './types';
import { callOpenAI } from '../ai/client';

const FORMAT_PROMPT = `You are reformatting a resume to better match a job description.

CRITICAL RULES:
1. Keep 90%+ of the original text VERBATIM
2. NEVER add metrics or claims not in the original
3. NEVER change the meaning of any bullet
4. Only reorder bullets to front-load matches
5. Only add keywords where they fit naturally
6. Keep all original experiences and dates

Job Title: {JOB_TITLE}
Key Keywords: {KEYWORDS}

Original Resume Bullets (in priority order based on relevance):
{BULLETS}

Return a JSON object with this structure:
{
  "summary": "2-3 sentence professional summary (optional)",
  "skills": ["skill1", "skill2"],
  "experiences": [
    {
      "title": "Job Title",
      "company": "Company",
      "dateRange": "Date Range",
      "bullets": ["bullet1", "bullet2"]
    }
  ]
}

Remember:
- Bullets should be 90%+ identical to originals
- Only minor keyword insertions where natural
- Reorder to highlight matches first
- Do NOT hallucinate new achievements`;

/**
 * Format resume with light reformatting
 */
export async function formatTailoredResume(
  resume: ResumeData,
  matched: MatchResult[],
  jd: JDRequirements
): Promise<TailoredResume> {
  // Sort bullets by match score
  const prioritizedBullets = getPrioritizedBullets(resume, matched);

  const prompt = FORMAT_PROMPT
    .replace('{JOB_TITLE}', jd.title)
    .replace('{KEYWORDS}', jd.keywords.slice(0, 10).join(', '))
    .replace('{BULLETS}', formatBulletsForPrompt(prioritizedBullets));

  const response = await callOpenAI({
    prompt,
    jsonMode: true,
    maxTokens: 2000,
  });

  const parsed = parseFormatResponse(response, resume);
  return validateTailoredResume(parsed, resume);
}

/**
 * Get bullets sorted by match relevance
 */
function getPrioritizedBullets(
  resume: ResumeData,
  matched: MatchResult[]
): Array<{ experience: string; bullet: string; score: number }> {
  const scoredBullets: Array<{ experience: string; bullet: string; score: number }> = [];

  for (const exp of resume.experiences) {
    for (const bullet of exp.bullets) {
      // Find matching score if any
      const match = matched.find(
        (m) => m.matchedItem && 'text' in m.matchedItem && m.matchedItem.text === bullet.text
      );

      scoredBullets.push({
        experience: `${exp.title} at ${exp.company}`,
        bullet: bullet.text,
        score: match?.score || 0,
      });
    }
  }

  return scoredBullets.sort((a, b) => b.score - a.score);
}

/**
 * Format bullets for prompt
 */
function formatBulletsForPrompt(
  bullets: Array<{ experience: string; bullet: string; score: number }>
): string {
  return bullets
    .slice(0, 20) // Limit to top 20
    .map((b, i) => `${i + 1}. [${b.experience}] ${b.bullet}`)
    .join('\n');
}

/**
 * Parse formatter response
 */
function parseFormatResponse(response: string, original: ResumeData): TailoredResume {
  try {
    const data = JSON.parse(response);

    return {
      summary: data.summary,
      skills: data.skills || original.skills.map((s) => s.name),
      experiences: (data.experiences || []).map(normalizeExperience),
      education: original.education.map((e) => e.originalText),
      rawText: '',
    };
  } catch {
    // Fallback to original structure
    return createFallbackResume(original);
  }
}

/**
 * Normalize experience object
 */
function normalizeExperience(exp: Partial<TailoredExperience>): TailoredExperience {
  return {
    title: exp.title || '',
    company: exp.company || '',
    dateRange: exp.dateRange,
    bullets: exp.bullets || [],
  };
}

/**
 * Create fallback resume from original
 */
function createFallbackResume(original: ResumeData): TailoredResume {
  return {
    skills: original.skills.map((s) => s.name),
    experiences: original.experiences.map((e) => ({
      title: e.title,
      company: e.company,
      dateRange: e.dateRange,
      bullets: e.bullets.map((b) => b.text),
    })),
    education: original.education.map((e) => e.originalText),
    rawText: original.rawText,
  };
}

/**
 * Validate tailored resume against original
 * Ensures no hallucinations occurred
 */
function validateTailoredResume(
  tailored: TailoredResume,
  original: ResumeData
): TailoredResume {
  // Check that bullets are similar to originals
  const originalBullets = original.experiences.flatMap((e) =>
    e.bullets.map((b) => b.text.toLowerCase())
  );

  for (const exp of tailored.experiences) {
    exp.bullets = exp.bullets.filter((bullet) => {
      // Allow if 70%+ similar to any original
      const similarity = originalBullets.some(
        (orig) => calculateSimilarity(bullet.toLowerCase(), orig) >= 0.7
      );
      return similarity;
    });
  }

  // Generate raw text from structured data
  tailored.rawText = generateRawText(tailored);

  return tailored;
}

/**
 * Calculate text similarity (simple Jaccard-like)
 */
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));

  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;

  return intersection / union;
}

/**
 * Generate raw text from structured resume
 */
function generateRawText(resume: TailoredResume): string {
  const lines: string[] = [];

  if (resume.summary) {
    lines.push('SUMMARY', resume.summary, '');
  }

  if (resume.skills.length > 0) {
    lines.push('SKILLS', resume.skills.join(' • '), '');
  }

  lines.push('EXPERIENCE');
  for (const exp of resume.experiences) {
    lines.push(`${exp.title} | ${exp.company}`);
    if (exp.dateRange) lines.push(exp.dateRange);
    for (const bullet of exp.bullets) {
      lines.push(`• ${bullet}`);
    }
    lines.push('');
  }

  if (resume.education.length > 0) {
    lines.push('EDUCATION');
    lines.push(...resume.education);
  }

  return lines.join('\n');
}
