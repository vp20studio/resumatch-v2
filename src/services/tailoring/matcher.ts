/**
 * Resume Matcher - Deterministic matching, NO LLM
 * Matches resume items to job requirements
 */

import {
  ResumeData,
  JDRequirements,
  Requirement,
  MatchResult,
  Skill,
  Bullet,
  Education,
} from './types';

// Comprehensive skill synonyms for semantic matching
const SKILL_SYNONYMS: Record<string, string[]> = {
  // Programming Languages
  javascript: ['js', 'es6', 'es2015', 'ecmascript', 'vanilla js'],
  typescript: ['ts', 'typed javascript'],
  python: ['py', 'python3', 'python2'],
  java: ['jvm', 'j2ee', 'java ee', 'spring boot'],
  'c++': ['cpp', 'c plus plus'],
  csharp: ['c#', '.net', 'dotnet'],
  ruby: ['rails', 'ruby on rails', 'ror'],
  go: ['golang'],
  rust: ['rustlang'],
  php: ['laravel', 'symfony'],
  swift: ['ios development'],
  kotlin: ['android development'],

  // Frontend
  react: ['reactjs', 'react.js', 'react native', 'rn', 'next.js', 'nextjs', 'redux'],
  vue: ['vuejs', 'vue.js', 'nuxt', 'nuxtjs'],
  angular: ['angularjs', 'angular.js', 'ng'],
  frontend: ['front-end', 'front end', 'ui development', 'client-side'],
  html: ['html5', 'markup'],
  css: ['css3', 'scss', 'sass', 'less', 'styled-components', 'tailwind'],

  // Backend
  nodejs: ['node.js', 'node', 'express', 'expressjs', 'nestjs', 'koa'],
  backend: ['back-end', 'back end', 'server-side', 'api development'],
  api: ['rest', 'restful', 'graphql', 'grpc', 'soap', 'web services'],
  microservices: ['micro-services', 'service-oriented', 'soa'],

  // Cloud & DevOps
  aws: ['amazon web services', 'ec2', 's3', 'lambda', 'cloudformation', 'dynamodb', 'rds', 'eks', 'ecs'],
  gcp: ['google cloud', 'google cloud platform', 'bigquery', 'cloud run'],
  azure: ['microsoft azure', 'azure devops'],
  cloud: ['cloud computing', 'cloud infrastructure', 'cloud services', 'aws', 'gcp', 'azure'],
  docker: ['containerization', 'containers', 'dockerfile'],
  kubernetes: ['k8s', 'kubectl', 'helm', 'container orchestration'],
  devops: ['dev ops', 'infrastructure', 'sre', 'site reliability'],
  cicd: ['ci/cd', 'ci cd', 'continuous integration', 'continuous deployment', 'jenkins', 'github actions', 'gitlab ci', 'circleci'],
  terraform: ['infrastructure as code', 'iac', 'cloudformation'],

  // Databases
  sql: ['mysql', 'postgresql', 'postgres', 'mssql', 'sql server', 'oracle', 'relational database'],
  nosql: ['mongodb', 'dynamodb', 'cassandra', 'redis', 'couchdb', 'document database'],
  database: ['db', 'data storage', 'rdbms', 'sql', 'nosql'],
  postgresql: ['postgres', 'psql'],
  mongodb: ['mongo', 'document db'],

  // Data & ML
  'machine learning': ['ml', 'deep learning', 'ai', 'artificial intelligence', 'neural networks'],
  'data science': ['data analysis', 'data analytics', 'data engineering'],
  tensorflow: ['keras', 'pytorch', 'deep learning framework'],

  // Soft Skills
  leadership: ['lead', 'leading', 'led', 'managed', 'manager', 'management', 'supervised', 'oversaw', 'directed', 'headed'],
  mentoring: ['mentor', 'mentored', 'coaching', 'coached', 'trained', 'training', 'onboarded', 'guided'],
  communication: ['communicating', 'presenting', 'presentations', 'stakeholder', 'cross-functional', 'collaborated', 'collaboration', 'liaison'],
  'problem-solving': ['problem solving', 'troubleshooting', 'debugging', 'analytical', 'critical thinking', 'solutions'],
  teamwork: ['team player', 'collaborative', 'collaboration', 'worked with', 'partnered'],
  agile: ['scrum', 'kanban', 'sprint', 'jira', 'agile methodology', 'ceremonies', 'standups', 'retrospectives'],

  // Experience levels
  senior: ['sr', 'lead', 'principal', 'staff', 'experienced', '5+ years', '5 years', 'senior level'],
  experience: ['years', 'year', 'experienced', 'background'],
};

// Experience level keywords that indicate years
const EXPERIENCE_PATTERNS = [
  { pattern: /(\d+)\+?\s*years?/i, extract: (match: RegExpMatchArray) => parseInt(match[1]) },
  { pattern: /senior|lead|principal|staff/i, years: 5 },
  { pattern: /mid-?level|intermediate/i, years: 3 },
  { pattern: /junior|entry/i, years: 1 },
];

/**
 * Match resume data to job requirements
 */
export function matchResume(
  resume: ResumeData,
  jd: JDRequirements
): { matched: MatchResult[]; missing: MatchResult[]; hasDomainMismatch: boolean } {
  const allRequirements = [
    ...jd.required.map((r) => ({ ...r, isRequired: true })),
    ...jd.preferred.map((r) => ({ ...r, isRequired: false })),
  ];

  const matched: MatchResult[] = [];
  const missing: MatchResult[] = [];

  // Track domain-level mismatch for the whole job
  const jdText = [jd.title, ...jd.required.map(r => r.text), ...jd.preferred.map(r => r.text)].join(' ');
  const jdDomains = detectDomain(jdText);
  const resumeDomains = getResumeDomains(resume);
  const hasDomainMismatch = jdDomains.length > 0 && !domainsOverlap(jdDomains, resumeDomains);

  for (const req of allRequirements) {
    const match = findBestMatch(req, resume, jd.keywords);

    // Require score >= 70 for a match - stricter threshold
    // Also require higher score (80) for technical requirements
    const isTechnical = isTechnicalRequirement(req.text);
    const threshold = isTechnical ? 80 : 70;

    if (match.score >= threshold) {
      matched.push(match);
    } else {
      missing.push(match);
    }
  }

  // Sort by score descending
  matched.sort((a, b) => b.score - a.score);
  missing.sort((a, b) => {
    // Required items first, then by importance
    const impOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return impOrder[a.requirement.importance] - impOrder[b.requirement.importance];
  });

  return { matched, missing, hasDomainMismatch };
}

/**
 * Get the primary domain of a resume based on skills and experience
 */
function getResumeDomains(resume: ResumeData): string[] {
  const allText = [
    ...resume.skills.map(s => s.name),
    ...resume.experiences.map(e => `${e.title} ${e.company}`),
    ...resume.experiences.flatMap(e => e.bullets.map(b => b.text)),
  ].join(' ');

  return detectDomain(allText);
}

/**
 * Find the best match for a requirement in the resume
 * Now with domain awareness to prevent cross-domain matching
 */
function findBestMatch(
  requirement: Requirement,
  resume: ResumeData,
  keywords: string[]
): MatchResult {
  let bestMatch: MatchResult = {
    requirement,
    matchedItem: null,
    score: 0,
    matchType: 'missing',
    originalText: '',
  };

  const reqLower = requirement.text.toLowerCase();

  // Detect requirement domain and resume domains
  const reqDomains = detectDomain(requirement.text);
  const resumeDomains = getResumeDomains(resume);

  // If requirement is domain-specific and resume doesn't have that domain,
  // cap the maximum score that can be achieved
  const isDomainMismatch = reqDomains.length > 0 && !domainsOverlap(reqDomains, resumeDomains);
  const maxScoreForMismatch = 30; // Domain mismatches can't score above 30

  // Check if this is an experience years requirement
  if (reqLower.includes('year') || reqLower.includes('experience')) {
    let expScore = scoreExperienceYears(requirement.text, resume);
    if (isDomainMismatch) expScore = Math.min(expScore, maxScoreForMismatch);

    if (expScore > bestMatch.score) {
      bestMatch = {
        requirement,
        matchedItem: null,
        score: expScore,
        matchType: getMatchType(expScore),
        originalText: `${resume.experiences.length} positions spanning multiple years`,
      };
    }
  }

  // Check skills - only if domains overlap OR requirement isn't domain-specific
  for (const skill of resume.skills) {
    let score = scoreSkillMatch(requirement.text, skill.name);
    if (isDomainMismatch) score = Math.min(score, maxScoreForMismatch);

    if (score > bestMatch.score) {
      bestMatch = {
        requirement,
        matchedItem: skill,
        score,
        matchType: getMatchType(score),
        originalText: skill.originalText,
      };
    }
  }

  // Check experience bullets
  for (const exp of resume.experiences) {
    for (const bullet of exp.bullets) {
      let score = scoreBulletMatch(requirement.text, bullet, keywords);
      if (isDomainMismatch) score = Math.min(score, maxScoreForMismatch);

      if (score > bestMatch.score) {
        bestMatch = {
          requirement,
          matchedItem: bullet,
          score,
          matchType: getMatchType(score),
          originalText: bullet.text,
        };
      }
    }

    // Also check job titles for experience/seniority requirements
    let titleScore = scoreTitleMatch(requirement.text, exp.title);
    if (isDomainMismatch) titleScore = Math.min(titleScore, maxScoreForMismatch);

    if (titleScore > bestMatch.score) {
      bestMatch = {
        requirement,
        matchedItem: exp,
        score: titleScore,
        matchType: getMatchType(titleScore),
        originalText: `${exp.title} at ${exp.company}`,
      };
    }
  }

  // Check education
  for (const edu of resume.education) {
    let score = scoreEducationMatch(requirement.text, edu);
    // Education is often cross-domain applicable, so don't cap as heavily
    if (isDomainMismatch && !reqLower.includes('degree')) {
      score = Math.min(score, maxScoreForMismatch);
    }

    if (score > bestMatch.score) {
      bestMatch = {
        requirement,
        matchedItem: edu,
        score,
        matchType: getMatchType(score),
        originalText: edu.originalText,
      };
    }
  }

  // Also check against raw text for comprehensive matching
  let rawTextScore = scoreRawTextMatch(requirement.text, resume.rawText, keywords);
  if (isDomainMismatch) rawTextScore = Math.min(rawTextScore, maxScoreForMismatch);

  if (rawTextScore > bestMatch.score) {
    bestMatch = {
      requirement,
      matchedItem: null,
      score: rawTextScore,
      matchType: getMatchType(rawTextScore),
      originalText: 'Found in resume content',
    };
  }

  return bestMatch;
}

// Domain indicators to detect the type of experience required
// IMPORTANT: Use specific multi-word phrases that are unique to each domain
// Avoid single words that could appear in other contexts (e.g., "design" in "designed a system")
const DOMAIN_INDICATORS = {
  // Software/Engineering - use specific job titles and technical terms
  software: ['software engineer', 'software developer', 'software development experience', 'programming language', 'computer science degree', 'cs degree'],
  frontend: ['frontend developer', 'front-end developer', 'react developer', 'angular developer', 'vue developer', 'javascript developer', 'web developer'],
  backend: ['backend developer', 'back-end developer', 'api development', 'server-side', 'microservices architecture'],
  // Design - use UX/UI specific terms that wouldn't appear in software contexts
  // Removed 'figma' alone since many engineers use it for design review
  design: ['ux designer', 'ui designer', 'ux design experience', 'ui design experience', 'user experience designer', 'product designer', 'design experience', 'user research experience', 'usability testing', 'wireframes', 'prototypes', 'design portfolio', 'design skills', 'figma experience', 'sketch experience'],
  // Marketing - use marketing-specific terms
  marketing: ['marketing manager', 'marketing experience', 'marketing lead', 'demand generation', 'growth marketing', 'b2b marketing', 'marketing automation', 'hubspot', 'marketo', 'mql', 'marketing campaigns', 'content marketing'],
  // Sales - use sales-specific terms that wouldn't be in other domains
  sales: ['sales experience', 'sales manager', 'sales team', 'account executive', 'enterprise sales', 'quota attainment', 'sales pipeline', 'closed deals', 'revenue targets', 'b2b sales', 'saas sales'],
  // Data - use data-specific terms
  data: ['data scientist', 'data analyst', 'data engineer', 'machine learning engineer', 'data science experience', 'statistical analysis'],
};

/**
 * Detect the domain of a requirement or resume
 */
function detectDomain(text: string): string[] {
  const textLower = text.toLowerCase();
  const detectedDomains: string[] = [];

  for (const [domain, indicators] of Object.entries(DOMAIN_INDICATORS)) {
    if (indicators.some(ind => textLower.includes(ind))) {
      detectedDomains.push(domain);
    }
  }

  return detectedDomains;
}

/**
 * Check if resume domain matches requirement domain
 */
function domainsOverlap(reqDomains: string[], resumeDomains: string[]): boolean {
  if (reqDomains.length === 0) return true; // Non-domain requirement matches all
  if (resumeDomains.length === 0) return false;

  // Check for any overlap
  return reqDomains.some(rd => resumeDomains.includes(rd));
}

/**
 * Score experience years match - now domain-aware
 */
function scoreExperienceYears(requirement: string, resume: ResumeData): number {
  const reqLower = requirement.toLowerCase();

  // Extract required years from requirement
  let requiredYears = 0;
  for (const { pattern, extract, years } of EXPERIENCE_PATTERNS) {
    const match = reqLower.match(pattern);
    if (match) {
      requiredYears = extract ? extract(match) : years || 0;
      break;
    }
  }

  if (requiredYears === 0) return 0;

  // Detect what domain the requirement is asking for
  const reqDomains = detectDomain(requirement);

  // Calculate actual years from resume experiences IN THE RIGHT DOMAIN
  let relevantYears = 0;
  let totalYears = 0;
  const currentYear = new Date().getFullYear();

  for (const exp of resume.experiences) {
    const expYears = exp.dateRange
      ? extractYearsFromDateRange(exp.dateRange, currentYear)
      : 1;

    totalYears += expYears;

    // Check if this experience is in a relevant domain
    const expText = `${exp.title} ${exp.company} ${exp.bullets.map(b => b.text).join(' ')}`;
    const expDomains = detectDomain(expText);

    if (reqDomains.length === 0 || domainsOverlap(reqDomains, expDomains)) {
      relevantYears += expYears;
    }
  }

  // If requirement has a specific domain but resume has no relevant experience, low score
  if (reqDomains.length > 0 && relevantYears === 0) {
    return 15; // Domain mismatch - very low score
  }

  // Also check for senior titles in relevant domain
  const hasSeniorRelevantTitle = resume.experiences.some(e => {
    const isRelevantDomain = reqDomains.length === 0 ||
      domainsOverlap(reqDomains, detectDomain(`${e.title} ${e.company}`));
    const isSenior = /senior|lead|principal|staff|manager|director/i.test(e.title);
    return isRelevantDomain && isSenior;
  });

  if (hasSeniorRelevantTitle && relevantYears < 5) {
    relevantYears = Math.max(relevantYears, 5);
  }

  // Score based on meeting the requirement WITH RELEVANT EXPERIENCE
  if (relevantYears >= requiredYears) {
    return 90; // Meets or exceeds requirement
  } else if (relevantYears >= requiredYears * 0.8) {
    return 70; // Close to requirement
  } else if (relevantYears >= requiredYears * 0.6) {
    return 50; // Partial match
  } else if (relevantYears > 0) {
    return 35; // Some relevant experience but not enough
  }

  return 15; // No relevant experience
}

/**
 * Extract years from date range string
 */
function extractYearsFromDateRange(dateRange: string, currentYear: number): number {
  const presentMatch = dateRange.match(/present|current|now/i);
  const yearsMatch = dateRange.match(/(\d{4})/g);

  if (yearsMatch && yearsMatch.length >= 1) {
    const startYear = parseInt(yearsMatch[0]);
    const endYear = presentMatch ? currentYear : (yearsMatch[1] ? parseInt(yearsMatch[1]) : startYear);
    return Math.max(1, endYear - startYear);
  }

  return 1;
}

/**
 * Score skill match with comprehensive synonym support
 */
function scoreSkillMatch(requirement: string, skillName: string): number {
  const reqLower = requirement.toLowerCase();
  const skillLower = skillName.toLowerCase();

  // Direct/exact match
  if (reqLower.includes(skillLower) || skillLower.includes(reqLower)) {
    return 100;
  }

  // Check all synonyms
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    const allTerms = [canonical, ...synonyms];

    // Check if requirement contains any term
    const reqHasTerm = allTerms.some((t) =>
      reqLower.includes(t.toLowerCase()) ||
      new RegExp(`\\b${escapeRegex(t)}\\b`, 'i').test(reqLower)
    );

    // Check if skill matches any term
    const skillHasTerm = allTerms.some((t) =>
      skillLower.includes(t.toLowerCase()) ||
      new RegExp(`\\b${escapeRegex(t)}\\b`, 'i').test(skillLower)
    );

    if (reqHasTerm && skillHasTerm) {
      return 90; // Synonym match
    }
  }

  // Word overlap match
  const reqWords = reqLower.split(/\s+/).filter(w => w.length > 2);
  const skillWords = skillLower.split(/\s+/).filter(w => w.length > 2);
  const overlap = reqWords.filter((w) => skillWords.some(sw => sw.includes(w) || w.includes(sw)));

  if (overlap.length > 0) {
    return 60 + Math.min(overlap.length * 15, 30);
  }

  return 0;
}

/**
 * Score bullet point match - more discriminating for domain-specific skills
 */
function scoreBulletMatch(
  requirement: string,
  bullet: Bullet,
  keywords: string[]
): number {
  const reqLower = requirement.toLowerCase();
  const bulletLower = bullet.text.toLowerCase();
  let score = 0;

  // Filter out common stopwords that appear in every resume
  const stopwords = ['the', 'and', 'with', 'for', 'that', 'this', 'from', 'have', 'been', 'were', 'was', 'are', 'team', 'work', 'working', 'using'];

  // Check for direct requirement text in bullet
  const reqWords = reqLower.split(/\s+/).filter((w) => w.length > 4 && !stopwords.includes(w));
  const matchedWords = reqWords.filter((w) => bulletLower.includes(w));
  const wordMatchRatio = matchedWords.length / Math.max(reqWords.length, 1);

  // Only count if we match at least 2 significant words
  if (matchedWords.length >= 2) {
    score += wordMatchRatio * 50;
  }

  // Check for keyword matches (from JD) - but only significant ones
  let keywordMatches = 0;
  for (const keyword of keywords) {
    if (keyword.length > 4 && bulletLower.includes(keyword.toLowerCase())) {
      keywordMatches++;
    }
  }
  score += Math.min(keywordMatches * 8, 24);

  // Check synonym matches - but be more selective
  // Only count technical/domain-specific synonyms, not generic soft skills
  const technicalSynonymGroups = ['react', 'javascript', 'typescript', 'python', 'sql', 'aws', 'cloud', 'docker', 'api', 'database', 'frontend', 'backend', 'nodejs', 'machine learning', 'data science'];

  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    // Only use this for technical skills, not soft skills like "leadership"
    if (!technicalSynonymGroups.includes(canonical)) continue;

    const allTerms = [canonical, ...synonyms];
    const reqHasTerm = allTerms.some((t) => reqLower.includes(t.toLowerCase()));
    const bulletHasTerm = allTerms.some((t) => bulletLower.includes(t.toLowerCase()));

    if (reqHasTerm && bulletHasTerm) {
      score += 30; // Technical synonym match
      break;
    }
  }

  // Bonus for metrics (shows impact) - reduced from 15
  if (bullet.metrics.length > 0) {
    score += 8;
  }

  return Math.min(score, 90); // Cap at 90, not 100
}

/**
 * Score job title match
 */
function scoreTitleMatch(requirement: string, title: string): number {
  const reqLower = requirement.toLowerCase();
  const titleLower = title.toLowerCase();

  // Check for seniority level matches
  if (reqLower.includes('senior') && titleLower.includes('senior')) {
    return 85;
  }
  if (reqLower.includes('lead') && (titleLower.includes('lead') || titleLower.includes('senior'))) {
    return 80;
  }
  if (reqLower.includes('experience') && (titleLower.includes('senior') || titleLower.includes('lead'))) {
    return 70;
  }

  // Check for role matches
  const roles = ['engineer', 'developer', 'manager', 'analyst', 'designer', 'architect'];
  for (const role of roles) {
    if (reqLower.includes(role) && titleLower.includes(role)) {
      return 75;
    }
  }

  return 0;
}

/**
 * Score education match
 */
function scoreEducationMatch(requirement: string, education: Education): number {
  const reqLower = requirement.toLowerCase();
  const eduText = `${education.degree} ${education.institution}`.toLowerCase();

  // Degree type match
  const degreeTypes = [
    { names: ['bachelor', 'bs', 'ba', 'b.s.', 'b.a.'], level: 1 },
    { names: ['master', 'ms', 'ma', 'm.s.', 'm.a.', 'mba'], level: 2 },
    { names: ['phd', 'ph.d.', 'doctorate', 'doctoral'], level: 3 },
  ];

  for (const { names, level } of degreeTypes) {
    const reqHas = names.some((n) => reqLower.includes(n));
    const eduHas = names.some((n) => eduText.includes(n));

    if (reqHas && eduHas) {
      return 95;
    }

    // Higher degree satisfies lower requirement
    if (reqHas && degreeTypes.slice(level).some(higher =>
      higher.names.some(n => eduText.includes(n))
    )) {
      return 90;
    }
  }

  // Field of study match
  const fields = ['computer science', 'engineering', 'business', 'marketing', 'design', 'mathematics', 'physics', 'information technology'];
  for (const field of fields) {
    if (reqLower.includes(field) && eduText.includes(field)) {
      return 85;
    }
  }

  // Generic degree requirement match
  if (reqLower.includes('degree') && education.degree) {
    return 70;
  }

  return 0;
}

/**
 * Score against raw resume text for fallback matching
 * More conservative - only use for specific technical skills, not generic words
 */
function scoreRawTextMatch(requirement: string, rawText: string, keywords: string[]): number {
  const reqLower = requirement.toLowerCase();
  const textLower = rawText.toLowerCase();

  // Only use raw text matching for specific technical terms, not generic words
  // This prevents marketing resumes from matching software requirements via shared words like "led", "team", etc.
  const technicalTerms = [
    'react', 'angular', 'vue', 'javascript', 'typescript', 'python', 'java', 'node',
    'sql', 'database', 'api', 'aws', 'cloud', 'docker', 'kubernetes', 'git',
    'html', 'css', 'frontend', 'backend', 'fullstack', 'machine learning', 'data science',
    'figma', 'sketch', 'user research', 'wireframe', 'prototype', 'accessibility',
    'salesforce', 'hubspot', 'marketo', 'seo', 'sem', 'ppc', 'analytics',
    'saas', 'b2b', 'enterprise', 'revenue', 'pipeline', 'quota'
  ];

  // Check if requirement contains a technical term
  const reqHasTechnical = technicalTerms.some(term => reqLower.includes(term));
  if (!reqHasTechnical) {
    return 0; // Don't use raw text for non-technical requirements
  }

  // Check for technical term match in resume
  for (const term of technicalTerms) {
    if (reqLower.includes(term) && textLower.includes(term)) {
      return 45; // Conservative score for raw text technical match
    }
  }

  return 0;
}

/**
 * Get match type based on score
 */
function getMatchType(score: number): MatchResult['matchType'] {
  if (score >= 90) return 'exact';
  if (score >= 70) return 'semantic';
  if (score >= 40) return 'partial';
  return 'missing';
}

/**
 * Identify technical/domain-specific requirements vs generic soft skills
 */
function isTechnicalRequirement(reqText: string): boolean {
  const technicalIndicators = [
    // Software Development (general)
    'software', 'development', 'engineering', 'programming', 'coding', 'developer', 'engineer',
    'technical', 'computer science', 'software development',
    // Programming & tech
    'react', 'angular', 'vue', 'javascript', 'typescript', 'python', 'java', 'node', 'go', 'rust',
    'sql', 'database', 'postgresql', 'mysql', 'mongodb', 'redis', 'api', 'rest', 'graphql',
    'aws', 'cloud', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'ci/cd',
    'html', 'css', 'frontend', 'backend', 'fullstack', 'microservices', 'architecture',
    'machine learning', 'data science', 'tensorflow', 'pytorch',
    'data structures', 'algorithms', 'testing', 'jest', 'state management', 'redux',
    // Design
    'figma', 'sketch', 'adobe', 'user research', 'wireframe', 'prototype', 'accessibility', 'wcag',
    'ux', 'ui design', 'design system', 'usability testing', 'information architecture',
    'user-centered design', 'design process', 'design tools', 'portfolio',
    // Marketing
    'seo', 'sem', 'ppc', 'google ads', 'facebook ads', 'hubspot', 'marketo', 'salesforce marketing',
    'content marketing', 'demand generation', 'abm', 'marketing automation', 'google analytics',
    'b2b marketing', 'growth marketing', 'mql', 'marketing budget', 'marketing experience',
    // Sales
    'salesforce', 'crm', 'enterprise sales', 'quota', 'pipeline', 'revenue', 'b2b sales', 'saas sales',
    'sales operations', 'account management', 'strategic accounts', 'channel partner',
    'sales experience', 'sales team', 'enterprise software sales', 'fortune 500', 'arr',
  ];
  const reqLower = reqText.toLowerCase();
  return technicalIndicators.some(term => reqLower.includes(term));
}

/**
 * Calculate overall match score
 * More discriminating scoring to differentiate good matches from mismatches
 */
export function calculateMatchScore(
  matched: MatchResult[],
  missing: MatchResult[],
  hasDomainMismatch: boolean = false
): number {
  const total = matched.length + missing.length;
  if (total === 0) return 0;

  // Weight by importance - but also consider if it's a technical requirement
  const importanceWeight = { critical: 4, high: 2.5, medium: 1.5, low: 0.5 };

  let weightedMatched = 0;
  let totalWeight = 0;

  // Count domain-critical matches and misses
  let technicalMatches = 0;
  let technicalMisses = 0;
  let totalTechnicalReqs = 0;

  // Track critical requirement misses separately
  let criticalMatches = 0;
  let criticalMisses = 0;

  for (const m of matched) {
    const isTechnical = isTechnicalRequirement(m.requirement.text);
    let weight = importanceWeight[m.requirement.importance];

    // Technical requirements get extra weight
    if (isTechnical) {
      weight *= 1.5;
      technicalMatches++;
      totalTechnicalReqs++;
    }

    if (m.requirement.importance === 'critical') {
      criticalMatches++;
    }

    const scoreContribution = (m.score / 100) * weight;
    weightedMatched += scoreContribution;
    totalWeight += weight;
  }

  for (const m of missing) {
    const isTechnical = isTechnicalRequirement(m.requirement.text);
    let weight = importanceWeight[m.requirement.importance];

    // Technical requirements get extra weight (penalized more when missing)
    if (isTechnical) {
      weight *= 2.0; // Double penalty for missing technical skills
      technicalMisses++;
      totalTechnicalReqs++;
    }

    if (m.requirement.importance === 'critical') {
      criticalMisses++;
    }

    totalWeight += weight;
  }

  // Calculate base score
  let score = Math.round((weightedMatched / totalWeight) * 100);

  // Heavy penalty for missing technical requirements
  // This is the key to differentiating SWE from Marketing
  if (totalTechnicalReqs > 0) {
    const technicalMatchRate = technicalMatches / totalTechnicalReqs;
    if (technicalMatchRate < 0.15) {
      // Almost no technical matches - severe penalty (domain mismatch)
      score = Math.round(score * 0.25);
    } else if (technicalMatchRate < 0.3) {
      // Very few technical matches - major penalty
      score = Math.round(score * 0.4);
    } else if (technicalMatchRate < 0.5) {
      // Missing most technical skills - significant penalty
      score = Math.round(score * 0.55);
    } else if (technicalMatchRate < 0.7) {
      // Missing many technical skills - moderate penalty
      score = Math.round(score * 0.75);
    }
  }

  // Additional severe penalty if missing critical requirements
  const totalCritical = criticalMatches + criticalMisses;
  if (totalCritical > 0 && criticalMisses > criticalMatches) {
    // Missing more critical requirements than matching - severe penalty
    score = Math.round(score * 0.6);
  }

  // Domain mismatch penalty - if the resume and JD are in completely different fields
  if (hasDomainMismatch) {
    // Even if some generic requirements match, cap the score for domain mismatches
    score = Math.min(score, 45);
  }

  // Cap score at 95% (perfect scores are unrealistic)
  // Minimum of 15% to give some feedback
  return Math.min(Math.max(score, 15), 95);
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
