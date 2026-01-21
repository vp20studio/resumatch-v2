/**
 * Pre-parsed job descriptions for testing
 * Allows tests to run without API calls
 */

import { JDRequirements, Requirement } from '../../services/tailoring/types';

/**
 * Deterministic JD parser - extracts requirements without API
 */
export function parseJobDescriptionDeterministic(jdText: string, jdId: string): JDRequirements {
  // Use pre-parsed data if available
  const preParsed = preParsedJDs[jdId];
  if (preParsed) {
    return preParsed;
  }

  // Fallback: extract from text deterministically
  return extractRequirementsFromText(jdText);
}

/**
 * Extract requirements from JD text using patterns
 */
function extractRequirementsFromText(text: string): JDRequirements {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const required: Requirement[] = [];
  const preferred: Requirement[] = [];
  const keywords: string[] = [];

  let inRequirements = false;
  let inPreferred = false;
  let title = 'Unknown Position';
  let company: string | undefined;

  // First line is usually title
  if (lines.length > 0) {
    title = lines[0];
  }

  // Second line often has company
  if (lines.length > 1 && lines[1].includes('|')) {
    company = lines[1].split('|')[0].trim();
  }

  for (const line of lines) {
    const lineLower = line.toLowerCase();

    // Detect section headers
    if (lineLower.includes('requirement') || lineLower.includes('minimum qualification') ||
        lineLower.includes('what you need') || lineLower === 'responsibilities') {
      inRequirements = true;
      inPreferred = false;
      continue;
    }
    if (lineLower.includes('nice to have') || lineLower.includes('preferred') ||
        lineLower.includes('bonus')) {
      inRequirements = false;
      inPreferred = true;
      continue;
    }
    if (lineLower.includes('about') || lineLower.includes('benefit') ||
        lineLower.includes('compensation') || lineLower === 'the role' ||
        lineLower === 'the opportunity') {
      inRequirements = false;
      inPreferred = false;
      continue;
    }

    // Extract bullet points
    if (line.startsWith('-') || line.startsWith('•')) {
      const text = line.replace(/^[-•]\s*/, '').trim();
      if (text.length > 10 && text.length < 200) {
        const req = classifyRequirement(text);
        if (inPreferred) {
          preferred.push(req);
        } else if (inRequirements) {
          required.push(req);
        }
      }
    }

    // Extract keywords
    extractKeywordsFromLine(line, keywords);
  }

  return {
    title,
    company,
    required,
    preferred,
    keywords: [...new Set(keywords)].slice(0, 15),
    context: inferContext(text),
  };
}

/**
 * Classify a requirement by type and importance
 */
function classifyRequirement(text: string): Requirement {
  const lower = text.toLowerCase();

  // Determine type
  let type: Requirement['type'] = 'other';
  if (lower.includes('year') && lower.includes('experience')) {
    type = 'experience';
  } else if (lower.includes('degree') || lower.includes('bachelor') ||
             lower.includes('master') || lower.includes('phd')) {
    type = 'education';
  } else if (lower.includes('certif')) {
    type = 'certification';
  } else if (containsTechnicalSkill(lower)) {
    type = 'skill';
  }

  // Determine importance
  let importance: Requirement['importance'] = 'medium';
  if (lower.includes('must') || lower.includes('required') ||
      (lower.includes('year') && lower.includes('experience'))) {
    importance = 'critical';
  } else if (lower.includes('strong') || lower.includes('excellent')) {
    importance = 'high';
  } else if (lower.includes('familiar') || lower.includes('knowledge of')) {
    importance = 'low';
  }

  return { text, type, importance };
}

/**
 * Check if text contains technical skills
 */
function containsTechnicalSkill(text: string): boolean {
  const technicalTerms = [
    'react', 'javascript', 'typescript', 'python', 'java', 'node', 'sql',
    'api', 'rest', 'css', 'html', 'testing', 'git', 'docker', 'aws',
    'figma', 'design', 'wireframe', 'prototype', 'ux', 'ui',
    'hubspot', 'marketo', 'salesforce', 'marketing', 'abm', 'pipeline',
    'crm', 'quota', 'enterprise', 'saas',
  ];
  return technicalTerms.some(term => text.includes(term));
}

/**
 * Extract keywords from a line
 */
function extractKeywordsFromLine(line: string, keywords: string[]): void {
  const technicalKeywords = [
    'React', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Node.js', 'SQL',
    'REST', 'API', 'CSS', 'Redux', 'Jest', 'Next.js', 'Git', 'Docker', 'AWS',
    'Figma', 'Sketch', 'wireframe', 'prototype', 'UX', 'UI', 'user research',
    'accessibility', 'WCAG', 'usability testing',
    'HubSpot', 'Marketo', 'Salesforce', 'ABM', 'demand generation',
    'MQL', 'pipeline', 'marketing automation', 'B2B', 'SaaS',
    'enterprise', 'quota', 'ACV', 'ARR', 'revenue', 'Fortune 500',
  ];

  for (const keyword of technicalKeywords) {
    if (line.includes(keyword) && !keywords.includes(keyword)) {
      keywords.push(keyword);
    }
  }
}

/**
 * Infer context from JD text
 */
function inferContext(text: string): JDRequirements['context'] {
  const lower = text.toLowerCase();

  let seniorityLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | undefined;
  if (lower.includes('vp') || lower.includes('vice president') ||
      lower.includes('director') || lower.includes('head of')) {
    seniorityLevel = 'executive';
  } else if (lower.includes('senior') || lower.includes('lead')) {
    seniorityLevel = 'senior';
  } else if (lower.includes('junior') || lower.includes('entry') ||
             lower.includes('graduate') || lower.includes('intern')) {
    seniorityLevel = 'entry';
  } else {
    seniorityLevel = 'mid';
  }

  return {
    seniorityLevel,
    workStyle: lower.includes('remote') ? 'remote' :
               lower.includes('hybrid') ? 'hybrid' : 'onsite',
  };
}

/**
 * Pre-parsed JD requirements for test fixtures
 */
export const preParsedJDs: Record<string, JDRequirements> = {
  'senior-react': {
    title: 'Senior React Developer',
    company: 'FinTech Startup',
    required: [
      { text: '4+ years of professional software development experience', type: 'experience', importance: 'critical' },
      { text: '3+ years of experience with React and modern JavaScript/TypeScript', type: 'skill', importance: 'critical' },
      { text: 'Strong understanding of frontend architecture and state management (Redux, Context)', type: 'skill', importance: 'high' },
      { text: 'Experience with REST APIs and data fetching patterns', type: 'skill', importance: 'high' },
      { text: 'Proficiency in CSS, responsive design, and modern styling approaches', type: 'skill', importance: 'medium' },
      { text: 'Experience with testing frameworks (Jest, React Testing Library)', type: 'skill', importance: 'medium' },
      { text: 'Excellent communication and collaboration skills', type: 'other', importance: 'medium' },
    ],
    preferred: [
      { text: 'Experience in fintech or financial services', type: 'experience', importance: 'low' },
      { text: 'Knowledge of Node.js and backend development', type: 'skill', importance: 'low' },
      { text: 'Experience with Next.js or similar frameworks', type: 'skill', importance: 'low' },
      { text: 'Familiarity with CI/CD and DevOps practices', type: 'skill', importance: 'low' },
    ],
    keywords: ['React', 'TypeScript', 'JavaScript', 'Redux', 'REST', 'API', 'CSS', 'Jest', 'Next.js', 'Node.js'],
    context: { seniorityLevel: 'senior', workStyle: 'hybrid' },
  },

  'growth-marketing': {
    title: 'Growth Marketing Lead',
    company: 'TechGrowth Inc',
    required: [
      { text: '5+ years of B2B marketing experience, preferably in SaaS', type: 'experience', importance: 'critical' },
      { text: 'Proven track record of driving measurable pipeline growth', type: 'experience', importance: 'critical' },
      { text: 'Experience with marketing automation platforms (HubSpot, Marketo)', type: 'skill', importance: 'critical' },
      { text: 'Strong understanding of ABM strategies and tools', type: 'skill', importance: 'high' },
      { text: 'Proficiency in marketing analytics and attribution', type: 'skill', importance: 'high' },
      { text: 'Experience managing marketing budgets of $500K+', type: 'experience', importance: 'high' },
      { text: 'Excellent project management and cross-functional skills', type: 'other', importance: 'medium' },
    ],
    preferred: [
      { text: 'MBA or equivalent experience', type: 'education', importance: 'low' },
      { text: 'Experience in enterprise SaaS or technology', type: 'experience', importance: 'low' },
      { text: 'Knowledge of Salesforce and marketing integrations', type: 'skill', importance: 'low' },
      { text: 'Track record building and managing marketing teams', type: 'experience', importance: 'medium' },
    ],
    keywords: ['B2B', 'SaaS', 'HubSpot', 'Marketo', 'ABM', 'demand generation', 'pipeline', 'MQL', 'Salesforce', 'marketing automation'],
    context: { seniorityLevel: 'lead', workStyle: 'onsite' },
  },

  'junior-swe-google': {
    title: 'Software Engineer, University Graduate',
    company: 'Google',
    required: [
      { text: "Bachelor's degree in Computer Science or equivalent practical experience", type: 'education', importance: 'critical' },
      { text: 'Experience with one or more programming languages (Python, Java, C++, JavaScript)', type: 'skill', importance: 'critical' },
      { text: 'Understanding of data structures and algorithms', type: 'skill', importance: 'critical' },
      { text: 'Strong problem-solving skills', type: 'other', importance: 'high' },
    ],
    preferred: [
      { text: 'Experience with web development (React, Angular, or similar)', type: 'skill', importance: 'medium' },
      { text: 'Knowledge of database systems (SQL and NoSQL)', type: 'skill', importance: 'medium' },
      { text: 'Internship experience in software development', type: 'experience', importance: 'medium' },
      { text: 'Contributions to open source projects', type: 'experience', importance: 'low' },
      { text: 'Experience with distributed systems or cloud platforms', type: 'skill', importance: 'low' },
    ],
    keywords: ['Python', 'Java', 'JavaScript', 'React', 'SQL', 'data structures', 'algorithms'],
    context: { seniorityLevel: 'entry', workStyle: 'onsite' },
  },

  'ux-designer-health': {
    title: 'UX Designer',
    company: 'HealthTech Innovations',
    required: [
      { text: '2+ years of UX design experience (bootcamp or career change welcome)', type: 'experience', importance: 'critical' },
      { text: 'Strong portfolio demonstrating user-centered design process', type: 'other', importance: 'critical' },
      { text: 'Proficiency in Figma or similar design tools', type: 'skill', importance: 'critical' },
      { text: 'Experience conducting user research and usability testing', type: 'skill', importance: 'high' },
      { text: 'Understanding of accessibility standards and inclusive design', type: 'skill', importance: 'high' },
      { text: 'Excellent communication and presentation skills', type: 'other', importance: 'medium' },
    ],
    preferred: [
      { text: 'Experience in healthcare or regulated industries', type: 'experience', importance: 'medium' },
      { text: 'Knowledge of HTML/CSS', type: 'skill', importance: 'low' },
      { text: 'Experience with design systems', type: 'skill', importance: 'low' },
      { text: 'Background in education or training', type: 'experience', importance: 'low' },
    ],
    keywords: ['Figma', 'UX', 'UI', 'user research', 'usability testing', 'wireframe', 'prototype', 'accessibility', 'WCAG'],
    context: { seniorityLevel: 'mid', workStyle: 'hybrid' },
  },

  'vp-sales-enterprise': {
    title: 'Vice President of Sales',
    company: 'Enterprise SaaS Co',
    required: [
      { text: '12+ years of enterprise software sales experience', type: 'experience', importance: 'critical' },
      { text: '5+ years leading sales teams of 30+ people', type: 'experience', importance: 'critical' },
      { text: 'Track record scaling organizations from $50M to $150M+ ARR', type: 'experience', importance: 'critical' },
      { text: 'Experience selling to Fortune 500 and large enterprises', type: 'experience', importance: 'critical' },
      { text: 'Deep understanding of enterprise sales cycles and procurement', type: 'skill', importance: 'high' },
      { text: 'Strong executive presence and communication skills', type: 'other', importance: 'high' },
    ],
    preferred: [
      { text: 'MBA from top program', type: 'education', importance: 'medium' },
    ],
    keywords: ['enterprise', 'sales', 'ARR', 'ACV', 'Fortune 500', 'quota', 'revenue', 'SaaS', 'pipeline'],
    context: { seniorityLevel: 'executive', workStyle: 'onsite' },
  },
};
