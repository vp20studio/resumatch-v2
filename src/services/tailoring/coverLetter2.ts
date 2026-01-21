/**
 * Cover Letter Generator
 * Generates human-sounding cover letters that pass AI detection
 */

import { MatchResult, JDRequirements, ResumeData } from './types';
import { callOpenAI } from '../ai/client';

/**
 * Generate cover letter based on matched items
 * @param humanize When true, uses aggressive anti-AI instructions (for retry after detection)
 */
export async function generateCoverLetter(
  matched: MatchResult[],
  jd: JDRequirements,
  resume: ResumeData,
  humanize: boolean = false
): Promise<string> {
  const name = resume.contact?.name || '[Your Name]';
  const jobTitle = jd.title;
  const company = jd.company || 'your company';

  // Get top matches with actual content
  const topMatches = matched
    .filter(m => m.score >= 50 && m.originalText && m.originalText.length > 20)
    .slice(0, 4)
    .map(m => ({
      requirement: m.requirement.text,
      evidence: m.originalText,
    }));

  // Fallback to experience bullets if no good matches
  if (topMatches.length < 2) {
    for (const exp of resume.experiences.slice(0, 2)) {
      for (const bullet of exp.bullets.slice(0, 2)) {
        if (bullet.text.length > 30) {
          topMatches.push({
            requirement: 'relevant experience',
            evidence: bullet.text,
          });
        }
      }
    }
  }

  const matchesText = topMatches
    .map(m => `• For "${m.requirement}": ${m.evidence}`)
    .join('\n');

  const prompt = humanize 
    ? buildAggressiveHumanPrompt(name, jobTitle, company, matchesText)
    : buildNaturalPrompt(name, jobTitle, company, matchesText);

  const response = await callOpenAI({
    prompt,
    jsonMode: false,
    maxTokens: 600,
    temperature: humanize ? 0.95 : 0.8,
  });

  return cleanCoverLetter(response, name);
}

/**
 * Natural prompt - should sound human by default
 */
function buildNaturalPrompt(
  name: string,
  jobTitle: string,
  company: string,
  matches: string
): string {
  return `Write a brief cover letter for ${name} applying to ${jobTitle} at ${company}.

THEIR RELEVANT EXPERIENCE:
${matches}

RULES - READ CAREFULLY:
1. MAX 200 words. Shorter is better.
2. Use contractions: I'm, I've, I'd, don't, can't, won't
3. Mix sentence lengths - some very short (3-5 words), some longer
4. Start ONE sentence with "And" or "But"
5. Be specific about what you did, not vague claims
6. NO buzzwords: passionate, leverage, synergy, excited, thrilled, utilize, spearhead
7. Sound like a confident professional emailing about a job, not a formal letter
8. End simply - "Thanks for reading" or "Happy to chat more" - NOT "I look forward to the opportunity to discuss"

STRUCTURE:
- 1 sentence: Why this role caught your attention (be specific to ${company})
- 2-3 sentences: Your most relevant experience (use the facts above)
- 1-2 sentences: Another relevant point
- 1 sentence: Simple close

Start with "Hi," or "Hello," - NOT "Dear Hiring Manager" 
Sign off with just "${name}" - no "Sincerely" or "Best regards"

Write the letter now. No preamble:`;
}

/**
 * Aggressive human prompt - for when first attempt failed AI detection
 */
function buildAggressiveHumanPrompt(
  name: string,
  jobTitle: string,
  company: string,
  matches: string
): string {
  return `You must write a cover letter that sounds 100% human-written, not AI.

For: ${name} applying to ${jobTitle} at ${company}

Their experience:
${matches}

CRITICAL ANTI-AI RULES:
1. Use contractions in EVERY paragraph: I'm, I've, I'd, don't, can't, won't, didn't, wasn't
2. Include ONE minor imperfection - a slightly informal phrase like "honestly" or "I have to say" or "pretty excited"
3. Vary sentence length DRAMATICALLY:
   - At least one very short sentence (under 6 words). Like this.
   - At least one longer, more detailed sentence that explains something specific
4. Start at least ONE sentence with "And" or "But"
5. Use specific details and numbers from the experience - NOT vague claims
6. ABSOLUTELY BANNED PHRASES (never use these):
   - "passionate about" / "passion for"
   - "excited to" / "thrilled to" 
   - "leverage" / "utilize"
   - "synergy" / "dynamic"
   - "I believe I would be a great fit"
   - "unique opportunity"
   - "I am writing to express my interest"
   - "Thank you for considering my application"
7. Keep it under 180 words
8. Sound like you're writing a quick email to someone you respect, not a formal document

FORMAT:
- Start with "Hi," (not Dear Hiring Manager)
- 2-3 short paragraphs
- End with just your name (no "Sincerely" or "Best regards")

Remember: Write like a real person. Imperfect but genuine beats polished but robotic.

Write now:`;
}

/**
 * Clean up the cover letter
 */
function cleanCoverLetter(text: string, name: string): string {
  let cleaned = text.trim();

  // Remove markdown
  cleaned = cleaned
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#+\s/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();

  // Remove any preamble before greeting
  const greetingMatch = cleaned.match(/^(Hi|Hello|Hey|Dear)/im);
  if (greetingMatch && greetingMatch.index && greetingMatch.index > 0) {
    cleaned = cleaned.substring(greetingMatch.index);
  }

  // Remove explanatory text after the letter
  const signaturePatterns = [
    new RegExp(`${name}\\s*$`, 'i'),
    /Best,?\s*$/i,
    /Thanks,?\s*$/i,
    /Cheers,?\s*$/i,
  ];
  
  // Find where the signature might be and trim anything after the name
  const lines = cleaned.split('\n');
  let cutoffIndex = lines.length;
  
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.toLowerCase().includes(name.toLowerCase()) || 
        /^(best|thanks|cheers|sincerely|regards),?\s*$/i.test(line)) {
      cutoffIndex = i + 1;
      // Include the name line if it exists right after
      if (i < lines.length - 1 && lines[i + 1].trim().toLowerCase().includes(name.toLowerCase())) {
        cutoffIndex = i + 2;
      }
      break;
    }
  }
  
  cleaned = lines.slice(0, cutoffIndex).join('\n').trim();

  // Ensure it has the name at the end
  if (!cleaned.toLowerCase().includes(name.toLowerCase())) {
    cleaned += `\n\n${name}`;
  }

  return cleaned;
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
  const company = jd.company || 'your company';
  const title = jd.title;

  const topMatch = matched[0];
  const secondMatch = matched[1];

  let para1 = `I saw the ${title} role and wanted to reach out.`;
  if (topMatch && topMatch.originalText) {
    para1 += ` My experience with ${topMatch.originalText.slice(0, 80).toLowerCase()} maps pretty directly to what you're looking for.`;
  }

  let para2 = '';
  if (secondMatch && secondMatch.originalText) {
    para2 = `I've also done work around ${secondMatch.originalText.slice(0, 60).toLowerCase()}. Happy to share more specifics if helpful.`;
  } else {
    para2 = `I'd be glad to walk through my background in more detail if you're interested.`;
  }

  return `Hi,

${para1}

${para2}

Thanks for reading.

${name}`;
}
