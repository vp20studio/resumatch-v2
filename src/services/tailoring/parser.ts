/**
 * Resume Parser - Deterministic extraction, NO LLM
 * Parses resume text into structured data
 */

import {
  ResumeData,
  Skill,
  Experience,
  Bullet,
  Metric,
  Education,
  ContactInfo,
} from './types';

// Common section headers
const SECTION_PATTERNS = {
  experience: /^(experience|work\s*experience|professional\s*experience|employment)/i,
  education: /^(education|academic|qualifications)/i,
  skills: /^(skills|technical\s*skills|core\s*competencies|technologies)/i,
  summary: /^(summary|profile|objective|about)/i,
  projects: /^(projects|personal\s*projects|portfolio)/i,
};

// Metric patterns (numbers with context)
const METRIC_PATTERNS = [
  /(\d+(?:\.\d+)?%)\s+(.+)/i,
  /\$(\d+(?:,\d{3})*(?:\.\d+)?[KMB]?)\s+(.+)/i,
  /(\d+(?:,\d{3})*)\s+(users?|customers?|clients?|employees?|team\s*members?)/i,
  /(\d+(?:\.\d+)?x)\s+(.+)/i,
];

// Skill categories keywords
const SKILL_CATEGORIES = {
  technical: ['programming', 'development', 'engineering', 'software', 'data', 'cloud', 'devops'],
  tool: ['excel', 'jira', 'git', 'docker', 'aws', 'figma', 'slack', 'notion'],
  language: ['javascript', 'python', 'java', 'typescript', 'sql', 'go', 'rust', 'c++'],
  soft: ['leadership', 'communication', 'teamwork', 'problem-solving', 'collaboration'],
};

/**
 * Main parser function - converts raw resume text to structured data
 */
export function parseResume(text: string): ResumeData {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections = identifySections(lines);

  return {
    rawText: text,
    skills: extractSkills(sections.skills || []),
    experiences: extractExperiences(sections.experience || []),
    education: extractEducation(sections.education || []),
    contact: extractContactInfo(lines.slice(0, 10)), // Contact usually at top
  };
}

/**
 * Identify sections in the resume
 */
function identifySections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  let currentSection = 'header';
  let currentLines: string[] = [];

  for (const line of lines) {
    const sectionName = detectSectionHeader(line);
    if (sectionName) {
      if (currentLines.length > 0) {
        sections[currentSection] = currentLines;
      }
      currentSection = sectionName;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections[currentSection] = currentLines;
  }

  return sections;
}

/**
 * Detect if a line is a section header
 */
function detectSectionHeader(line: string): string | null {
  const cleanLine = line.replace(/[:\-_]/g, '').trim();

  for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(cleanLine)) {
      return section;
    }
  }

  return null;
}

/**
 * Extract skills from skills section
 */
function extractSkills(lines: string[]): Skill[] {
  const skills: Skill[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    // Split by common delimiters
    const items = line.split(/[,;|•·●○◦▪▸►]/);

    for (const item of items) {
      const name = item.trim().replace(/^\s*[-–—]\s*/, '');
      if (name && name.length > 1 && name.length < 50 && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        skills.push({
          name,
          category: categorizeSkill(name),
          originalText: name,
        });
      }
    }
  }

  return skills;
}

/**
 * Categorize a skill based on keywords
 */
function categorizeSkill(skill: string): Skill['category'] {
  const lower = skill.toLowerCase();

  for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
    if (keywords.some((k) => lower.includes(k))) {
      return category as Skill['category'];
    }
  }

  return 'other';
}

/**
 * Extract experiences from experience section
 */
function extractExperiences(lines: string[]): Experience[] {
  const experiences: Experience[] = [];
  let current: Partial<Experience> | null = null;
  let bullets: Bullet[] = [];

  for (const line of lines) {
    // Check if this is a new job entry (usually has company/date)
    if (isJobHeader(line)) {
      if (current && current.title) {
        experiences.push({
          ...current,
          bullets,
          originalText: [current.title, current.company, ...bullets.map((b) => b.text)].join('\n'),
        } as Experience);
      }
      current = parseJobHeader(line);
      bullets = [];
    } else if (isBulletPoint(line)) {
      bullets.push(parseBullet(line));
    } else if (current && line.includes('|') || line.match(/\d{4}/)) {
      // Might be a date line
      const dateMatch = line.match(/\d{4}\s*[-–]\s*(\d{4}|present|current)/i);
      if (dateMatch) {
        current.dateRange = dateMatch[0];
      }
    }
  }

  // Don't forget the last experience
  if (current && current.title) {
    experiences.push({
      ...current,
      bullets,
      originalText: [current.title, current.company, ...bullets.map((b) => b.text)].join('\n'),
    } as Experience);
  }

  return experiences;
}

/**
 * Check if line looks like a job header
 */
function isJobHeader(line: string): boolean {
  // Contains job-title-like patterns
  const titlePatterns = /(engineer|developer|manager|analyst|designer|lead|director|specialist)/i;
  return titlePatterns.test(line) && !isBulletPoint(line);
}

/**
 * Check if line is a bullet point
 */
function isBulletPoint(line: string): boolean {
  return /^[\s]*[•·●○◦▪▸►\-–—*]\s/.test(line);
}

/**
 * Parse a job header line
 */
function parseJobHeader(line: string): Partial<Experience> {
  // Try to extract title and company
  const parts = line.split(/\s*[|@,]\s*/);

  return {
    title: parts[0]?.trim() || line.trim(),
    company: parts[1]?.trim() || '',
  };
}

/**
 * Parse a bullet point
 */
function parseBullet(line: string): Bullet {
  const text = line.replace(/^[\s]*[•·●○◦▪▸►\-–—*]\s*/, '').trim();

  return {
    text,
    metrics: extractMetrics(text),
    keywords: extractKeywords(text),
  };
}

/**
 * Extract metrics from text
 */
function extractMetrics(text: string): Metric[] {
  const metrics: Metric[] = [];

  for (const pattern of METRIC_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      metrics.push({
        value: match[1],
        context: match[2] || '',
        originalText: match[0],
      });
    }
  }

  return metrics;
}

/**
 * Extract keywords from text (action verbs, technologies, etc.)
 */
function extractKeywords(text: string): string[] {
  const actionVerbs = [
    'led', 'developed', 'implemented', 'designed', 'built', 'created',
    'managed', 'improved', 'increased', 'reduced', 'launched', 'delivered',
    'automated', 'optimized', 'architected', 'mentored', 'collaborated',
  ];

  const words = text.toLowerCase().split(/\s+/);
  return words.filter((w) => actionVerbs.includes(w) || w.length > 6);
}

/**
 * Extract education entries
 */
function extractEducation(lines: string[]): Education[] {
  const education: Education[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const degreeMatch = line.match(/(bachelor|master|phd|mba|bs|ba|ms|ma|associate)/i);

    if (degreeMatch) {
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      const gpaMatch = line.match(/gpa[:\s]*(\d+\.\d+)/i);

      education.push({
        degree: line,
        institution: lines[i + 1] || '',
        year: yearMatch?.[0],
        gpa: gpaMatch?.[1],
        originalText: line,
      });
    }
  }

  return education;
}

/**
 * Extract contact information
 */
function extractContactInfo(lines: string[]): ContactInfo {
  const contact: ContactInfo = {};
  const text = lines.join(' ');

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) contact.email = emailMatch[0];

  // Phone
  const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) contact.phone = phoneMatch[0];

  // LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) contact.linkedin = linkedinMatch[0];

  // Name is usually the first line
  if (lines[0] && !lines[0].includes('@') && !lines[0].match(/\d{3}/)) {
    contact.name = lines[0];
  }

  return contact;
}
