/**
 * Job Description Analyzer - 1 LLM call
 * Extracts structured requirements from job descriptions
 */

import { JDRequirements, Requirement, JDContext } from './types';
import { callOpenAI } from '../ai/client';

const JD_ANALYSIS_PROMPT = `Analyze this job description and extract structured requirements.

Job Description:
{JD_TEXT}

Return a JSON object with this exact structure:
{
  "title": "Job title",
  "company": "Company name if mentioned",
  "required": [
    {"text": "requirement", "type": "skill|experience|education|certification|other", "importance": "critical|high|medium|low"}
  ],
  "preferred": [
    {"text": "requirement", "type": "skill|experience|education|certification|other", "importance": "critical|high|medium|low"}
  ],
  "keywords": ["keyword1", "keyword2"],
  "context": {
    "industry": "industry if identifiable",
    "seniorityLevel": "entry|mid|senior|lead|executive",
    "companyType": "startup|mid-size|enterprise|agency",
    "workStyle": "remote|hybrid|onsite"
  }
}

Rules:
- "required" = explicitly stated as required/must-have
- "preferred" = nice-to-have or preferred qualifications
- "keywords" = important terms that should appear in a resume
- importance: critical = dealbreaker, high = strongly preferred, medium = good to have, low = minor bonus
- Extract ALL requirements, not just technical ones
- Include years of experience requirements
- Be comprehensive but don't duplicate`;

/**
 * Analyze job description using LLM
 */
export async function analyzeJobDescription(jdText: string): Promise<JDRequirements> {
  const prompt = JD_ANALYSIS_PROMPT.replace('{JD_TEXT}', jdText);

  const response = await callOpenAI({
    prompt,
    jsonMode: true,
    maxTokens: 1500,
  });

  const parsed = parseJDResponse(response);
  return validateJDRequirements(parsed);
}

/**
 * Parse LLM response into JDRequirements
 */
function parseJDResponse(response: string): JDRequirements {
  try {
    const data = JSON.parse(response);

    return {
      title: data.title || 'Unknown Position',
      company: data.company,
      required: (data.required || []).map(normalizeRequirement),
      preferred: (data.preferred || []).map(normalizeRequirement),
      keywords: data.keywords || [],
      context: normalizeContext(data.context || {}),
    };
  } catch (error) {
    // If JSON parsing fails, try to extract what we can
    return extractFallbackRequirements(response);
  }
}

/**
 * Normalize a requirement object
 */
function normalizeRequirement(req: Partial<Requirement>): Requirement {
  return {
    text: req.text || '',
    type: validateType(req.type),
    importance: validateImportance(req.importance),
  };
}

/**
 * Validate requirement type
 */
function validateType(type: string | undefined): Requirement['type'] {
  const validTypes = ['skill', 'experience', 'education', 'certification', 'other'];
  if (type && validTypes.includes(type)) {
    return type as Requirement['type'];
  }
  return 'other';
}

/**
 * Validate importance level
 */
function validateImportance(importance: string | undefined): Requirement['importance'] {
  const validLevels = ['critical', 'high', 'medium', 'low'];
  if (importance && validLevels.includes(importance)) {
    return importance as Requirement['importance'];
  }
  return 'medium';
}

/**
 * Normalize context object
 */
function normalizeContext(context: Partial<JDContext>): JDContext {
  return {
    industry: context.industry,
    seniorityLevel: context.seniorityLevel,
    companyType: context.companyType,
    workStyle: context.workStyle,
  };
}

/**
 * Fallback extraction if JSON parsing fails
 */
function extractFallbackRequirements(text: string): JDRequirements {
  const lines = text.split('\n').filter((l) => l.trim());
  const requirements: Requirement[] = [];

  for (const line of lines) {
    if (line.length > 10 && line.length < 200) {
      requirements.push({
        text: line.trim(),
        type: 'other',
        importance: 'medium',
      });
    }
  }

  return {
    title: 'Position',
    required: requirements.slice(0, Math.ceil(requirements.length / 2)),
    preferred: requirements.slice(Math.ceil(requirements.length / 2)),
    keywords: [],
    context: {},
  };
}

/**
 * Validate and clean JDRequirements
 */
function validateJDRequirements(jd: JDRequirements): JDRequirements {
  return {
    ...jd,
    required: jd.required.filter((r) => r.text.length > 3),
    preferred: jd.preferred.filter((r) => r.text.length > 3),
    keywords: [...new Set(jd.keywords.filter((k) => k.length > 2))],
  };
}
