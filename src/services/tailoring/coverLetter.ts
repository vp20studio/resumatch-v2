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

const HUMAN_WRITING_INSTRUCTIONS = `
CRITICAL - Write like a REAL PERSON, not AI:

VOICE & TONE:
- Conversational but professional - write like you're emailing a respected colleague
- Confident without being arrogant
- Genuine interest, not manufactured enthusiasm
- Specific and concrete, not vague platitudes

LANGUAGE RULES:
- Use contractions naturally (I'm, I've, I'd, don't, can't)
- AVOID these AI cliches: "passionate about", "leverage", "synergy", "excited to", "unique opportunity", "delighted", "thrilled", "cutting-edge", "spearhead"
- Mix sentence lengths - some short, some longer
- Start occasional sentences with "And" or "But"
- Use specific examples and numbers, not generalities
- Use active voice, first person

STRUCTURE:
- Don't follow a rigid template - vary your approach
- Get to the point quickly - no filler
- End with a simple, direct close - not an overeager plea

Remember: Sound like a confident professional, not a robot trying to impress.`;


/**
 * Generate cover letter based on matched items
 * @param humanize When true, adds extra instructions to sound more human-like
 */
export async function generateCoverLetter(
  matched: MatchResult[],
  jd: JDRequirements,
  resume: ResumeData,
  humanize: boolean = false
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

  let prompt = COVER_LETTER_PROMPT
    .replace('{JOB_TITLE}', jd.title)
    .replace('{COMPANY}', jd.company || 'the company')
    .replace('{INDUSTRY}', jd.context.industry || 'this industry')
    .replace('{MATCHED_ITEMS}', topMatches.join('\n'))
    .replace('{NAME}', resume.contact?.name || 'the candidate');

  // Add human writing instructions if humanize is true
  if (humanize) {
    prompt = HUMAN_WRITING_INSTRUCTIONS + '\n\n' + prompt;
  }

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
 * Generates 150-300 word cover letter
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
  const thirdMatch = matched[2];

  // Build paragraphs based on matched items
  const para1 = topMatch
    ? `My experience ${topMatch.originalText.toLowerCase().startsWith('led') ? '' : 'in '}${topMatch.originalText.slice(0, 120)} directly addresses your need for ${topMatch.requirement.text}. This hands-on experience has given me deep expertise in the areas that matter most for this role.`
    : 'My professional background has prepared me well for the challenges and opportunities this role presents. I have consistently delivered results in similar positions and am confident I can bring that same level of performance to your team.';

  const para2 = secondMatch
    ? `Beyond that, I bring ${secondMatch.originalText.slice(0, 100)}, which supports your requirement for ${secondMatch.requirement.text}. I've found that this combination of skills enables me to make meaningful contributions from day one while continuing to grow in the role.`
    : 'Throughout my career, I have developed strong skills in collaboration, problem-solving, and delivering high-quality work under tight deadlines. I pride myself on being both a self-starter and a team player who thrives in fast-paced environments.';

  const para3 = thirdMatch
    ? `I'm also proud of my track record with ${thirdMatch.originalText.slice(0, 80)}, demonstrating my ability to ${thirdMatch.requirement.text.toLowerCase().slice(0, 50)}.`
    : 'I am particularly drawn to this opportunity because of the chance to work with a talented team and contribute to meaningful projects.';

  return `Dear Hiring Manager,

I am writing to express my strong interest in the ${title} position at ${company}. After reviewing the job description, I believe my background and skills make me an excellent candidate for this opportunity.

${para1}

${para2}

${para3}

I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to ${company}'s continued success. I'm excited about the possibility of bringing my skills to your team and am confident that I would be a valuable addition.

Thank you for considering my application. I look forward to the opportunity to speak with you further about how I can contribute to your organization.

Sincerely,
${name}`;
}
