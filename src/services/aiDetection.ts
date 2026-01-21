/**
 * AI Detection Service using ZeroGPT API
 * Detects AI-generated content in cover letters
 */

const ZEROGPT_API_URL = 'https://api.zerogpt.com/api/detect/detectText';

// NOTE: Move this to env.ts in production
const ZEROGPT_API_KEY = 'bb9e0a7d-7910-4ee2-a9ad-b97135be8db0';

export interface AIDetectionResult {
  score: number; // 0-100 (percentage AI-generated, lower is better)
  isHumanPassing: boolean; // true if score < 50
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
  if (!text || text.trim().length < 100) {
    return {
      score: 0,
      isHumanPassing: true,
      sentences: [],
      textWords: text ? text.split(/\s+/).length : 0,
      feedback: 'Text too short to analyze',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(ZEROGPT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ApiKey': ZEROGPT_API_KEY,
      },
      body: JSON.stringify({
        input_text: text,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('ZeroGPT API error:', response.status, response.statusText);
      return createFallbackResult(text, 'Detection service unavailable');
    }

    const data = await response.json();

    // Check for API errors in response
    if (data.success === false || data.error) {
      console.error('ZeroGPT API returned error:', data.error);
      return createFallbackResult(text, 'Detection service error');
    }

    // ZeroGPT returns:
    // - fakePercentage: percentage of AI-generated content (0-100)
    // - isHuman: boolean (but we calculate our own threshold)
    // - sentences: array of { sentence, isAI }
    // - textWords: word count

    const aiScore = data.data?.fakePercentage ?? 0;
    const isHumanPassing = aiScore < 50;

    // Parse sentence-level analysis
    const sentences = (data.data?.sentences || []).map((s: any) => ({
      text: s.sentence || '',
      isAI: s.isAI === true,
    }));

    // Generate helpful, encouraging feedback based on score
    const feedback = generateFeedback(aiScore);

    return {
      score: Math.round(aiScore),
      isHumanPassing,
      sentences,
      textWords: data.data?.textWords || text.split(/\s+/).length,
      feedback,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('AI detection timeout');
      return createFallbackResult(text, 'Detection timed out');
    }
    
    console.error('AI detection error:', error);
    return createFallbackResult(text, 'Detection unavailable');
  }
}

/**
 * Generate user-friendly feedback based on AI score
 */
function generateFeedback(aiScore: number): string {
  if (aiScore < 20) {
    return 'Excellent! Your writing sounds very natural and human.';
  }
  if (aiScore < 35) {
    return 'Great job! Reads like it was written by a person.';
  }
  if (aiScore < 50) {
    return 'Good. Mostly natural with minor AI-like patterns.';
  }
  if (aiScore < 65) {
    return 'Some AI patterns detected. A few personal edits would help.';
  }
  if (aiScore < 80) {
    return 'Noticeable AI patterns. Consider adding personal touches.';
  }
  return 'High AI content detected. We recommend editing before sending.';
}

/**
 * Create a fallback result when API fails
 */
function createFallbackResult(text: string, reason: string): AIDetectionResult {
  return {
    score: 0,
    isHumanPassing: true,
    sentences: [],
    textWords: text.split(/\s+/).length,
    feedback: reason,
  };
}

/**
 * Quick check without full analysis (for validation only)
 * Returns just the score, faster when you don't need details
 */
export async function quickAICheck(text: string): Promise<number> {
  const result = await detectAIContent(text);
  return result.score;
}

/**
 * Human-like writing style instructions for LLM prompts
 * Use these when generating content that needs to pass AI detection
 */
export const HUMAN_WRITING_INSTRUCTIONS = `
Write like a REAL PERSON, not AI. Follow these rules strictly:

MUST DO:
- Use contractions: I'm, I've, I'd, don't, can't, won't
- Vary sentence length dramatically (some short, some longer)
- Start 1-2 sentences with "And" or "But"
- Use specific details and numbers (not round numbers)
- Include one slightly informal phrase

MUST AVOID:
- "Passionate about" or "excited to"
- "Leverage", "synergy", "spearhead", "dynamic"
- "Thrilled", "delighted", "cutting-edge"
- Perfect parallel structure in every list
- Overly enthusiastic tone
- Starting every sentence the same way

TONE:
- Confident but not arrogant
- Professional but human
- Specific but concise
`;

/**
 * Cover letter specific instructions to avoid AI detection
 */
export const COVER_LETTER_HUMAN_INSTRUCTIONS = `
Write this cover letter as a REAL PERSON would:

CRITICAL RULES:
1. Use contractions throughout (I'm, I've, I'd, don't)
2. Start at least one sentence with "And" or "But"  
3. Mix very short sentences with longer ones
4. Include one slightly casual phrase (like "honestly" or "I have to say")
5. Be matter-of-fact about achievements, don't oversell

BANNED PHRASES (never use these):
- "passionate about"
- "excited to" / "thrilled to"
- "leverage" / "synergy"
- "unique opportunity"
- "cutting-edge" / "spearhead"
- "I believe I would be a great fit"

Keep it under 250 words. Sound like a confident professional, not a robot.
`;
