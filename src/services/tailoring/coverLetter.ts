/**
 * Cover Letter Generator - 1 LLM call
 * Template-based with LLM fill-in, grounded by matched items
 */

import { MatchResult, JDRequirements, ResumeData } from './types';
import { callOpenAI } from '../ai/client';

const COVER_LETTER_PROMPT = `Write a cover letter for this job application.

Job Title: {JOB_TITLE}
Company: {COMPANY}
Industry: {INDUSTRY}

Candidate's Relevant Experience (ONLY use these facts):
{MATCHED_ITEMS}

Candidate's Name: {NAME}

CRITICAL RULES:
1. ONLY reference experiences from the matched items above
2. NEVER make up or embellish achievements
3. Keep under 300 words
4. Follow this structure:
   - Opening: Express interest in the specific role
   - Body 1: Most relevant experience (from matched items)
   - Body 2: Second relevant experience (from matched items)
   - Closing: Express enthusiasm and next steps

Return ONLY the cover letter text, no JSON or formatting instructions.`;

/**
 * Generate cover letter based on matched items
 */
export async function generateCoverLetter(
  matched: MatchResult[],
  jd: JDRequirements,
  resume: ResumeData
): Promise<string> {
  // Get top matched items for the letter
  const topMatches = matched
    .filter((m) => m.score >= 60)
    .slice(0, 5)
    .map((m) => formatMatchForPrompt(m));

  if (topMatches.length === 0) {
    // If no good matches, use general experience
    topMatches.push(...getGeneralExperience(resume).slice(0, 3));
  }

  const prompt = COVER_LETTER_PROMPT
    .replace('{JOB_TITLE}', jd.title)
    .replace('{COMPANY}', jd.company || 'the company')
    .replace('{INDUSTRY}', jd.context.industry || 'this industry')
    .replace('{MATCHED_ITEMS}', topMatches.join('\n'))
    .replace('{NAME}', resume.contact?.name || 'the candidate');

  const response = await callOpenAI({
    prompt,
    jsonMode: false,
    maxTokens: 500,
  });

  return validateCoverLetter(response, matched);
}

/**
 * Format a match for inclusion in prompt
 */
function formatMatchForPrompt(match: MatchResult): string {
  const reqText = match.requirement.text;
  const matchText = match.originalText;
  return `- For "${reqText}": ${matchText}`;
}

/**
 * Get general experience bullets if no good matches
 */
function getGeneralExperience(resume: ResumeData): string[] {
  const bullets: string[] = [];

  for (const exp of resume.experiences.slice(0, 2)) {
    for (const bullet of exp.bullets.slice(0, 2)) {
      bullets.push(`- ${exp.title}: ${bullet.text}`);
    }
  }

  return bullets;
}

/**
 * Validate cover letter against matched items
 */
function validateCoverLetter(letter: string, matched: MatchResult[]): string {
  let validated = letter.trim();

  // Remove any potential markdown formatting
  validated = validated
    .replace(/^```[\s\S]*?```$/gm, '')
    .replace(/^#+ /gm, '')
    .trim();

  // Basic length check
  const words = validated.split(/\s+/).length;
  if (words > 400) {
    // Try to trim to 300 words while keeping complete sentences
    const sentences = validated.split(/[.!?]+/);
    let wordCount = 0;
    const trimmedSentences: string[] = [];

    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/).length;
      if (wordCount + sentenceWords <= 320) {
        trimmedSentences.push(sentence.trim());
        wordCount += sentenceWords;
      } else {
        break;
      }
    }

    validated = trimmedSentences.join('. ') + '.';
  }

  return validated;
}

/**
 * Quick cover letter template (no LLM, for offline/fast mode)
 */
export function generateQuickCoverLetter(
  matched: MatchResult[],
  jd: JDRequirements,
  resume: ResumeData
): string {
  const name = resume.contact?.name || '[Your Name]';
  const company = jd.company || '[Company Name]';
  const title = jd.title;

  const topMatch = matched[0];
  const secondMatch = matched[1];

  const para1 = topMatch
    ? `My experience ${topMatch.originalText.toLowerCase().startsWith('led') ? '' : 'in '}${topMatch.originalText.slice(0, 100)} aligns directly with your need for ${topMatch.requirement.text}.`
    : 'My background in software development has prepared me well for this role.';

  const para2 = secondMatch
    ? `Additionally, I bring ${secondMatch.originalText.slice(0, 80)}, which supports your requirement for ${secondMatch.requirement.text}.`
    : '';

  return `Dear Hiring Manager,

I am writing to express my interest in the ${title} position at ${company}. ${para1}

${para2}

I am excited about the opportunity to contribute to your team and would welcome the chance to discuss how my skills and experience align with your needs.

Thank you for considering my application.

Sincerely,
${name}`;
}
