/**
 * OpenAI Client Wrapper
 * Centralized API calls with timeout, retry, and error handling
 */

import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../../config/env';

// Types
export interface OpenAICallOptions {
  prompt: string;
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export type AIErrorType =
  | 'timeout'
  | 'rate_limit'
  | 'invalid_response'
  | 'api_error'
  | 'network_error';

export class AIError extends Error {
  type: AIErrorType;
  retryable: boolean;

  constructor(type: AIErrorType, message: string, retryable = false) {
    super(message);
    this.type = type;
    this.retryable = retryable;
    this.name = 'AIError';
  }
}

// Configuration
const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 1;

let openaiClient: OpenAI | null = null;

/**
 * Initialize OpenAI client
 */
export function initializeOpenAI(apiKey: string): void {
  openaiClient = new OpenAI({
    apiKey,
    timeout: DEFAULT_TIMEOUT,
    maxRetries: 0, // We handle retries ourselves
  });
}

/**
 * Ensure the client is initialized (auto-initialize with embedded key)
 */
function ensureInitialized(): void {
  if (!openaiClient) {
    initializeOpenAI(OPENAI_API_KEY);
  }
}

/**
 * Main function to call OpenAI
 */
export async function callOpenAI(options: OpenAICallOptions): Promise<string> {
  // Auto-initialize if not already initialized
  ensureInitialized();

  const {
    prompt,
    jsonMode = false,
    maxTokens = 1000,
    temperature = 0.7,
    model = DEFAULT_MODEL,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await callWithTimeout(
        openaiClient!.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature,
          response_format: jsonMode ? { type: 'json_object' } : undefined,
        }),
        DEFAULT_TIMEOUT
      );

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new AIError('invalid_response', 'Empty response from OpenAI');
      }

      return content;
    } catch (error) {
      lastError = error as Error;

      // Don't retry non-retryable errors
      if (error instanceof AIError && !error.retryable) {
        throw error;
      }

      // Convert OpenAI errors to our error types
      const aiError = convertToAIError(error as Error);

      if (!aiError.retryable || attempt === MAX_RETRIES) {
        throw aiError;
      }

      // Wait before retry (exponential backoff)
      await sleep(1000 * (attempt + 1));
    }
  }

  throw lastError || new AIError('api_error', 'Unknown error');
}

/**
 * Call with timeout wrapper
 */
async function callWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AIError('timeout', `Request timed out after ${timeoutMs}ms`, true));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Convert OpenAI/network errors to AIError
 */
function convertToAIError(error: Error): AIError {
  if (error instanceof AIError) {
    return error;
  }

  const message = error.message.toLowerCase();

  if (message.includes('rate limit') || message.includes('429')) {
    return new AIError('rate_limit', 'Rate limit exceeded', true);
  }

  if (message.includes('timeout')) {
    return new AIError('timeout', 'Request timed out', true);
  }

  if (message.includes('network') || message.includes('econnrefused')) {
    return new AIError('network_error', 'Network error', true);
  }

  if (message.includes('invalid') || message.includes('json')) {
    return new AIError('invalid_response', error.message, false);
  }

  return new AIError('api_error', error.message, false);
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if client is initialized
 */
export function isOpenAIInitialized(): boolean {
  return openaiClient !== null;
}
