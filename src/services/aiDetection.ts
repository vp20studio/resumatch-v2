/**
 * AI Detection Service using ZeroGPT API
 * Detects AI-generated content in cover letters and resume sections
 */

const ZEROGPT_API_KEY = 'bb9e0a7d-7910-4ee2-a9ad-b97135be8db0';
const ZEROGPT_API_URL = 'https://api.zerogpt.com/api/detect/detectText';

export interface AIDetectionResult {
  score: number; // 0-100 (percentage AI-generated)
  isHumanPassing: boolean; // true if score < 50 (more human than AI)
  sentences: {
    text: string;
    isAI: boolean;
  }[];
  textWords: number;
  feedback: string;
}

/**
 * Detect AI-generated content in text
 * @param text The text to analyze
 * @returns AIDetectionResult with score and analysis
 */
export async function detectAIContent(text: string): Promise<AIDetectionResult> {
  // Skip detection for very short text
  if (text.trim().length < 100) {
    return {
      score: 0,
      isHumanPassing: true,
      sentences: [],
      textWords: text.split(/\s+/).length,
      feedback: 'Text too short to analyze',
    };
  }

  try {
    const response = await fetch(ZEROGPT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ApiKey': ZEROGPT_API_KEY,
      },
      body: JSON.stringify({
        input_text: text,
      }),
    });

    if (!response.ok) {
      console.error('ZeroGPT API error:', response.status, response.statusText);
      // Return a passing score on API failure to not block the flow
      return {
        score: 0,
        isHumanPassing: true,
        sentences: [],
        textWords: text.split(/\s+/).length,
        feedback: 'Detection unavailable',
      };
    }

    const data = await response.json();

    // ZeroGPT returns:
    // - fakePercentage: percentage of AI-generated content (0-100)
    // - isHuman: boolean
    // - sentences: array of { sentence, isAI }
    // - textWords: word count

    const aiScore = data.data?.fakePercentage ?? 0;
    const isHumanPassing = aiScore < 50;

    // Parse sentence-level analysis
    const sentences = (data.data?.sentences || []).map((s: any) => ({
      text: s.sentence || '',
      isAI: s.isAI === true,
    }));

    // Generate feedback based on score
    let feedback: string;
    if (aiScore < 20) {
      feedback = 'Excellent! Very human-like writing.';
    } else if (aiScore < 40) {
      feedback = 'Good. Mostly natural writing style.';
    } else if (aiScore < 60) {
      feedback = 'Moderate AI patterns detected.';
    } else if (aiScore < 80) {
      feedback = 'High AI content. Consider revising.';
    } else {
      feedback = 'Very high AI content. Rewrite recommended.';
    }

    return {
      score: Math.round(aiScore),
      isHumanPassing,
      sentences,
      textWords: data.data?.textWords || text.split(/\s+/).length,
      feedback,
    };
  } catch (error) {
    console.error('AI detection error:', error);
    // Return a passing score on error to not block the flow
    return {
      score: 0,
      isHumanPassing: true,
      sentences: [],
      textWords: text.split(/\s+/).length,
      feedback: 'Detection unavailable',
    };
  }
}

/**
 * Human-like writing style instructions for LLM prompts
 */
export const HUMAN_WRITING_INSTRUCTIONS = `
CRITICAL: Write in a natural, human voice. Follow these rules:
1. Vary sentence length - mix short punchy sentences with longer detailed ones
2. Use contractions naturally (I'm, I've, don't, can't)
3. Start sentences with "And" or "But" occasionally
4. Use specific numbers and details, not round numbers
5. Include minor imperfections - not everything needs to be perfect
6. Avoid overused AI phrases like "leverage", "spearhead", "synergy", "passionate about"
7. Use active voice, first person naturally
8. Include subtle personality - brief opinions or preferences where appropriate
9. Avoid excessive enthusiasm or superlatives
10. Write like you're explaining to a colleague, not writing a formal essay
`;

/**
 * Instructions specifically for cover letters to sound human
 */
export const COVER_LETTER_HUMAN_INSTRUCTIONS = `
Write this cover letter as a real person would - not as an AI:

VOICE & TONE:
- Conversational but professional
- Confident without being arrogant
- Genuine interest, not manufactured enthusiasm
- Specific and concrete, not vague platitudes

STRUCTURE:
- Don't follow a rigid template
- Vary paragraph lengths
- Get to the point quickly

LANGUAGE:
- Use contractions (I'm, I've, I'd)
- Avoid: "passionate about", "leverage", "synergy", "excited to", "unique opportunity"
- Prefer: specific examples, concrete achievements, genuine interest
- Mix sentence lengths naturally
- Use active voice

CONTENT:
- Reference specific things about the company (real details)
- Connect your experience to their needs naturally
- Be specific about what you'd bring
- End with a simple, direct close - not an overeager plea
`;
