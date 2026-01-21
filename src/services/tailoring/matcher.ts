/**
 * Resume Matcher - Deterministic matching, NO LLM
 * Matches resume items to job requirements
 * 
 * COMPREHENSIVE support for: Software, Marketing, Sales, Design, Data, Finance, Operations
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

// =============================================================================
// COMPREHENSIVE SKILL SYNONYMS
// =============================================================================

const SKILL_SYNONYMS: Record<string, string[]> = {
  // -------------------------------------------------------------------------
  // MARKETING - Paid Media & Advertising
  // -------------------------------------------------------------------------
  'paid media': ['paid advertising', 'paid ads', 'media buying', 'ad spend', 'advertising spend', 'paid social', 'paid search', 'performance marketing', 'digital advertising'],
  'google ads': ['google adwords', 'adwords', 'google ppc', 'sem', 'search engine marketing', 'google search ads', 'search ads', 'ppc'],
  'linkedin ads': ['linkedin advertising', 'linkedin campaigns', 'linkedin sponsored', 'b2b advertising'],
  'facebook ads': ['meta ads', 'fb ads', 'instagram ads', 'social ads', 'facebook advertising', 'meta advertising'],
  'youtube ads': ['video ads', 'youtube advertising', 'video advertising'],
  'display ads': ['banner ads', 'programmatic', 'gdn', 'google display network', 'display advertising'],
  ppc: ['pay per click', 'pay-per-click', 'cpc', 'cost per click', 'paid search'],
  roas: ['return on ad spend', 'ad roi', 'advertising roi', 'blended roas'],
  cpa: ['cost per acquisition', 'cost per action', 'acquisition cost'],
  ctr: ['click through rate', 'click-through rate', 'clickthrough'],

  // -------------------------------------------------------------------------
  // MARKETING - Demand Gen & ABM
  // -------------------------------------------------------------------------
  'demand generation': ['demand gen', 'demandgen', 'lead generation', 'lead gen', 'leadgen', 'pipeline generation', 'pipeline gen'],
  abm: ['account-based marketing', 'account based marketing', 'abm campaigns', 'abm strategy', 'abm strategies', 'target account', 'account-based'],
  'lead scoring': ['lead qualification', 'mql scoring', 'lead grading', 'lead prioritization'],
  mql: ['marketing qualified lead', 'marketing qualified leads', 'marketing-qualified'],
  'sql lead': ['sales qualified lead', 'sales qualified leads', 'sales-qualified', 'sales ready'],
  'lead nurturing': ['nurture campaigns', 'drip campaigns', 'email nurturing', 'lead nurture'],
  pipeline: ['sales pipeline', 'pipeline growth', 'pipeline generation', 'qualified pipeline', 'pipeline value'],

  // -------------------------------------------------------------------------
  // MARKETING - Tools & Platforms
  // -------------------------------------------------------------------------
  hubspot: ['hs', 'hubspot crm', 'hubspot marketing', 'hubspot sales'],
  marketo: ['adobe marketo', 'marketo engage'],
  salesforce: ['sfdc', 'salesforce crm', 'sf', 'sales cloud', 'salesforce marketing cloud'],
  pardot: ['salesforce pardot', 'pardot b2b'],
  'marketing automation': ['ma platform', 'automation platform', 'email automation', 'marketing ops'],
  'google analytics': ['ga', 'ga4', 'google analytics 4', 'analytics'],
  semrush: ['sem rush', 'semrush tools'],
  ahrefs: ['ahrefs seo', 'backlink analysis'],

  // -------------------------------------------------------------------------
  // MARKETING - SEO & Content
  // -------------------------------------------------------------------------
  seo: ['search engine optimization', 'organic search', 'search optimization', 'organic traffic'],
  'content marketing': ['content strategy', 'content creation', 'content development', 'blog strategy'],
  'aeo': ['answer engine optimization', 'ai search optimization', 'generative search', 'geo', 'generative engine optimization'],
  copywriting: ['copy writing', 'ad copy', 'marketing copy', 'sales copy'],

  // -------------------------------------------------------------------------
  // MARKETING - Strategy & Analytics
  // -------------------------------------------------------------------------
  'b2b marketing': ['b2b', 'business to business', 'enterprise marketing'],
  'b2c marketing': ['b2c', 'consumer marketing', 'dtc', 'direct to consumer'],
  'growth marketing': ['growth hacking', 'growth', 'user acquisition'],
  'brand marketing': ['brand strategy', 'brand awareness', 'branding'],
  'product marketing': ['pmm', 'product positioning', 'go-to-market', 'gtm'],
  'marketing analytics': ['marketing data', 'campaign analytics', 'performance analytics', 'marketing metrics'],
  'a/b testing': ['ab testing', 'split testing', 'multivariate testing', 'experimentation'],
  cro: ['conversion rate optimization', 'conversion optimization', 'landing page optimization'],

  // -------------------------------------------------------------------------
  // SALES
  // -------------------------------------------------------------------------
  'enterprise sales': ['enterprise selling', 'large account sales', 'strategic sales', 'complex sales'],
  'saas sales': ['software sales', 'subscription sales', 'recurring revenue sales'],
  'sales operations': ['sales ops', 'revenue operations', 'rev ops', 'revops'],
  quota: ['quota attainment', 'sales quota', 'revenue target', 'sales target'],
  'account management': ['account executive', 'ae', 'customer success', 'client management'],
  'business development': ['biz dev', 'bd', 'partnerships', 'strategic partnerships'],
  crm: ['customer relationship management', 'salesforce', 'hubspot crm', 'pipedrive'],

  // -------------------------------------------------------------------------
  // LEADERSHIP & MANAGEMENT
  // -------------------------------------------------------------------------
  leadership: ['lead', 'leading', 'led', 'managed', 'manager', 'management', 'supervised', 'oversaw', 'directed', 'headed', 'spearheaded'],
  'team management': ['team lead', 'team leadership', 'people management', 'direct reports', 'managing team'],
  'team leadership': ['leading team', 'led team', 'managed team', 'supervising', 'overseeing'],
  mentoring: ['mentor', 'mentored', 'coaching', 'coached', 'trained', 'training', 'onboarded', 'guided', 'developed team'],
  'cross-functional': ['cross functional', 'cross-team', 'stakeholder management', 'collaboration'],

  // -------------------------------------------------------------------------
  // GENERAL BUSINESS
  // -------------------------------------------------------------------------
  revenue: ['revenue growth', 'top line', 'sales revenue', 'arr', 'mrr', 'annual recurring revenue'],
  budget: ['budget management', 'p&l', 'financial planning', 'cost management', 'spend management'],
  roi: ['return on investment', 'investment return', 'payback'],
  kpi: ['key performance indicator', 'kpis', 'metrics', 'okr', 'okrs'],
  strategy: ['strategic planning', 'strategic thinking', 'business strategy'],
  analytics: ['data analysis', 'reporting', 'insights', 'dashboards', 'business intelligence'],

  // -------------------------------------------------------------------------
  // PROGRAMMING LANGUAGES
  // -------------------------------------------------------------------------
  javascript: ['js', 'es6', 'es2015', 'ecmascript', 'vanilla js'],
  typescript: ['ts', 'typed javascript'],
  python: ['py', 'python3', 'python2'],
  java: ['jvm', 'j2ee', 'java ee', 'spring boot', 'spring'],
  'c++': ['cpp', 'c plus plus'],
  csharp: ['c#', '.net', 'dotnet'],
  ruby: ['rails', 'ruby on rails', 'ror'],
  go: ['golang'],
  rust: ['rustlang'],
  php: ['laravel', 'symfony'],
  swift: ['ios development', 'ios'],
  kotlin: ['android development', 'android'],

  // -------------------------------------------------------------------------
  // FRONTEND
  // -------------------------------------------------------------------------
  react: ['reactjs', 'react.js', 'react native', 'rn', 'next.js', 'nextjs', 'redux'],
  vue: ['vuejs', 'vue.js', 'nuxt', 'nuxtjs'],
  angular: ['angularjs', 'angular.js', 'ng'],
  frontend: ['front-end', 'front end', 'ui development', 'client-side'],
  html: ['html5', 'markup'],
  css: ['css3', 'scss', 'sass', 'less', 'styled-components', 'tailwind'],

  // -------------------------------------------------------------------------
  // BACKEND & INFRASTRUCTURE
  // -------------------------------------------------------------------------
  nodejs: ['node.js', 'node', 'express', 'expressjs', 'nestjs', 'koa'],
  backend: ['back-end', 'back end', 'server-side', 'api development'],
  api: ['rest', 'restful', 'graphql', 'grpc', 'soap', 'web services'],
  microservices: ['micro-services', 'service-oriented', 'soa'],
  aws: ['amazon web services', 'ec2', 's3', 'lambda', 'cloudformation', 'dynamodb', 'rds', 'eks', 'ecs'],
  gcp: ['google cloud', 'google cloud platform', 'bigquery', 'cloud run'],
  azure: ['microsoft azure', 'azure devops'],
  cloud: ['cloud computing', 'cloud infrastructure', 'cloud services'],
  docker: ['containerization', 'containers', 'dockerfile'],
  kubernetes: ['k8s', 'kubectl', 'helm', 'container orchestration'],
  devops: ['dev ops', 'infrastructure', 'sre', 'site reliability'],
  cicd: ['ci/cd', 'ci cd', 'continuous integration', 'continuous deployment', 'jenkins', 'github actions', 'gitlab ci'],

  // -------------------------------------------------------------------------
  // DATABASES
  // -------------------------------------------------------------------------
  sql: ['mysql', 'postgresql', 'postgres', 'mssql', 'sql server', 'oracle', 'relational database'],
  nosql: ['mongodb', 'dynamodb', 'cassandra', 'redis', 'couchdb', 'document database'],
  database: ['db', 'data storage', 'rdbms'],
  postgresql: ['postgres', 'psql'],
  mongodb: ['mongo', 'document db'],

  // -------------------------------------------------------------------------
  // DATA & ML
  // -------------------------------------------------------------------------
  'machine learning': ['ml', 'deep learning', 'ai', 'artificial intelligence', 'neural networks'],
  'data science': ['data analysis', 'data analytics', 'data engineering', 'statistical analysis'],
  tensorflow: ['keras', 'pytorch', 'deep learning framework'],

  // -------------------------------------------------------------------------
  // DESIGN
  // -------------------------------------------------------------------------
  figma: ['figma design', 'figma prototyping'],
  sketch: ['sketch app', 'sketch design'],
  'ux design': ['user experience', 'ux', 'user research', 'usability'],
  'ui design': ['user interface', 'ui', 'visual design', 'interface design'],
  'product design': ['digital product design', 'app design'],
  wireframing: ['wireframes', 'low fidelity', 'lo-fi'],
  prototyping: ['prototypes', 'high fidelity', 'hi-fi', 'interactive prototype'],

  // -------------------------------------------------------------------------
  // PROJECT MANAGEMENT
  // -------------------------------------------------------------------------
  agile: ['scrum', 'kanban', 'sprint', 'agile methodology', 'ceremonies', 'standups', 'retrospectives'],
  'project management': ['pm', 'program management', 'project delivery'],
  jira: ['jira software', 'atlassian jira'],

  // -------------------------------------------------------------------------
  // SOFT SKILLS
  // -------------------------------------------------------------------------
  communication: ['communicating', 'presenting', 'presentations', 'stakeholder', 'collaborated', 'collaboration', 'liaison'],
  'problem-solving': ['problem solving', 'troubleshooting', 'debugging', 'analytical', 'critical thinking', 'solutions'],
  teamwork: ['team player', 'collaborative', 'collaboration', 'worked with', 'partnered'],
};

// =============================================================================
// DOMAIN DETECTION
// =============================================================================

const DOMAIN_INDICATORS: Record<string, string[]> = {
  marketing: [
    'marketing', 'demand gen', 'demand generation', 'paid media', 'paid ads',
    'google ads', 'linkedin ads', 'facebook ads', 'abm', 'account-based',
    'seo', 'sem', 'ppc', 'lead gen', 'mql', 'hubspot', 'marketo',
    'content marketing', 'brand', 'growth marketing', 'campaign',
    'roas', 'ctr', 'conversion', 'digital marketing', 'performance marketing',
    'b2b marketing', 'marketing manager', 'marketing lead', 'marketing director'
  ],
  sales: [
    'sales', 'account executive', 'business development', 'quota', 'pipeline',
    'enterprise sales', 'saas sales', 'b2b sales', 'revenue', 'deals',
    'account management', 'sales operations', 'sales manager'
  ],
  software: [
    'software engineer', 'software developer', 'programming', 'coding',
    'full stack', 'fullstack', 'frontend developer', 'backend developer',
    'react', 'angular', 'vue', 'javascript', 'typescript', 'python', 'java',
    'api', 'microservices', 'aws', 'cloud', 'devops', 'computer science'
  ],
  design: [
    'ux designer', 'ui designer', 'product designer', 'design system',
    'user research', 'usability', 'wireframe', 'prototype', 'figma', 'sketch',
    'visual design', 'interaction design', 'design lead'
  ],
  data: [
    'data scientist', 'data analyst', 'data engineer', 'machine learning',
    'analytics', 'statistical', 'sql', 'python', 'tableau', 'power bi',
    'data visualization', 'big data'
  ],
  finance: [
    'financial analyst', 'finance manager', 'accounting', 'budget',
    'forecasting', 'fp&a', 'controller', 'cfo', 'investment'
  ],
  operations: [
    'operations manager', 'ops', 'process improvement', 'supply chain',
    'logistics', 'project manager', 'program manager'
  ],
};

/**
 * Detect domains in text
 */
function detectDomain(text: string): string[] {
  const textLower = text.toLowerCase();
  const detected: string[] = [];

  for (const [domain, indicators] of Object.entries(DOMAIN_INDICATORS)) {
    const matches = indicators.filter(ind => textLower.includes(ind)).length;
    // Require at least 2 indicators OR 1 very specific one
    if (matches >= 2 || indicators.some(ind => ind.length > 10 && textLower.includes(ind))) {
      detected.push(domain);
    }
  }

  return detected;
}

/**
 * Check if domains overlap
 */
function domainsOverlap(reqDomains: string[], resumeDomains: string[]): boolean {
  if (reqDomains.length === 0) return true;
  if (resumeDomains.length === 0) return true; // Be generous if we can't detect

  // Marketing and Sales often overlap
  const related: Record<string, string[]> = {
    marketing: ['sales', 'operations'],
    sales: ['marketing', 'operations'],
    software: ['data'],
    data: ['software'],
  };

  return reqDomains.some(rd => {
    if (resumeDomains.includes(rd)) return true;
    // Check related domains
    const relatedDomains = related[rd] || [];
    return relatedDomains.some(rel => resumeDomains.includes(rel));
  });
}

// =============================================================================
// MAIN MATCHING FUNCTION
// =============================================================================

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

  // Detect domains
  const resumeText = getResumeFullText(resume);
  const jdText = getJDFullText(jd);
  const resumeDomains = detectDomain(resumeText);
  const jdDomains = detectDomain(jdText);
  const hasDomainMismatch = !domainsOverlap(jdDomains, resumeDomains);

  // Lower thresholds for matching
  const MATCH_THRESHOLD = 55; // Was 70-80, now 55

  for (const req of allRequirements) {
    const match = findBestMatch(req, resume, jd.keywords, resumeDomains, jdDomains);

    if (match.score >= MATCH_THRESHOLD) {
      matched.push(match);
    } else {
      missing.push(match);
    }
  }

  // Sort by score
  matched.sort((a, b) => b.score - a.score);
  missing.sort((a, b) => {
    const impOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return impOrder[a.requirement.importance] - impOrder[b.requirement.importance];
  });

  return { matched, missing, hasDomainMismatch };
}

/**
 * Get full text from resume for domain detection
 */
function getResumeFullText(resume: ResumeData): string {
  return [
    ...resume.skills.map(s => s.name),
    ...resume.experiences.map(e => `${e.title} ${e.company}`),
    ...resume.experiences.flatMap(e => e.bullets.map(b => b.text)),
  ].join(' ');
}

/**
 * Get full text from JD for domain detection
 */
function getJDFullText(jd: JDRequirements): string {
  return [
    jd.title,
    ...jd.required.map(r => r.text),
    ...jd.preferred.map(r => r.text),
    ...jd.keywords,
  ].join(' ');
}

/**
 * Find the best match for a requirement
 */
function findBestMatch(
  requirement: Requirement,
  resume: ResumeData,
  keywords: string[],
  resumeDomains: string[],
  jdDomains: string[]
): MatchResult {
  let bestMatch: MatchResult = {
    requirement,
    matchedItem: null,
    score: 0,
    matchType: 'missing',
    originalText: '',
  };

  const reqLower = requirement.text.toLowerCase();

  // 1. Check skills
  for (const skill of resume.skills) {
    const score = scoreSkillMatch(reqLower, skill.name.toLowerCase());
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

  // 2. Check experience bullets
  for (const exp of resume.experiences) {
    for (const bullet of exp.bullets) {
      const score = scoreBulletMatch(reqLower, bullet.text.toLowerCase(), keywords);
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

    // Also check job titles
    const titleScore = scoreTitleMatch(reqLower, exp.title.toLowerCase());
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

  // 3. Check for experience years
  if (reqLower.includes('year') || reqLower.includes('experience')) {
    const yearsScore = scoreExperienceYears(requirement.text, resume);
    if (yearsScore > bestMatch.score) {
      bestMatch = {
        requirement,
        matchedItem: null,
        score: yearsScore,
        matchType: getMatchType(yearsScore),
        originalText: `${getTotalYears(resume)}+ years of experience`,
      };
    }
  }

  // 4. Check education
  for (const edu of resume.education) {
    const score = scoreEducationMatch(reqLower, edu);
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

  // 5. Raw text fallback for specific terms
  const rawScore = scoreRawTextMatch(reqLower, resume.rawText.toLowerCase());
  if (rawScore > bestMatch.score) {
    bestMatch = {
      requirement,
      matchedItem: null,
      score: rawScore,
      matchType: getMatchType(rawScore),
      originalText: 'Found in resume',
    };
  }

  return bestMatch;
}

// =============================================================================
// SCORING FUNCTIONS
// =============================================================================

/**
 * Score skill match
 */
function scoreSkillMatch(requirement: string, skill: string): number {
  // Direct match
  if (requirement.includes(skill) || skill.includes(requirement)) {
    return 95;
  }

  // Synonym match
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    const allTerms = [canonical.toLowerCase(), ...synonyms.map(s => s.toLowerCase())];

    const reqMatch = allTerms.some(t => requirement.includes(t));
    const skillMatch = allTerms.some(t => skill.includes(t));

    if (reqMatch && skillMatch) {
      return 90;
    }
  }

  // Partial word match
  const reqWords = requirement.split(/\s+/).filter(w => w.length > 3);
  const skillWords = skill.split(/\s+/).filter(w => w.length > 3);
  const overlap = reqWords.filter(rw => skillWords.some(sw => sw.includes(rw) || rw.includes(sw)));

  if (overlap.length > 0) {
    return 60 + Math.min(overlap.length * 10, 25);
  }

  return 0;
}

/**
 * Score bullet match - the core matching logic
 */
function scoreBulletMatch(requirement: string, bullet: string, keywords: string[]): number {
  let score = 0;

  // 1. Check synonym groups (ALL of them, not just technical)
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    const allTerms = [canonical.toLowerCase(), ...synonyms.map(s => s.toLowerCase())];

    const reqHasTerm = allTerms.some(t => requirement.includes(t));
    const bulletHasTerm = allTerms.some(t => bullet.includes(t));

    if (reqHasTerm && bulletHasTerm) {
      score += 40; // Strong semantic match
      break; // Only count once
    }
  }

  // 2. Direct word overlap (excluding stopwords)
  const stopwords = new Set(['the', 'and', 'with', 'for', 'that', 'this', 'from', 'have', 'been', 'were', 'was', 'are', 'our', 'your', 'will', 'can', 'ability', 'able', 'experience']);
  const reqWords = requirement.split(/\s+/).filter(w => w.length > 3 && !stopwords.has(w));
  const bulletWords = bullet.split(/\s+/).filter(w => w.length > 3);

  const matchedWords = reqWords.filter(rw => 
    bulletWords.some(bw => bw.includes(rw) || rw.includes(bw))
  );

  if (matchedWords.length >= 2) {
    score += 25 + (matchedWords.length * 5);
  } else if (matchedWords.length === 1) {
    score += 15;
  }

  // 3. Keyword matches from JD
  const keywordMatches = keywords.filter(k => 
    k.length > 3 && bullet.includes(k.toLowerCase())
  ).length;
  score += Math.min(keywordMatches * 5, 15);

  // 4. Metrics bonus (shows quantified impact)
  if (/\$[\d,]+|\d+%|\d+x|\d+\s*(million|k\b|m\b)/i.test(bullet)) {
    score += 10;
  }

  return Math.min(score, 95);
}

/**
 * Score title match
 */
function scoreTitleMatch(requirement: string, title: string): number {
  // Check for role matches
  const roles = [
    ['manager', 'lead', 'director', 'head'],
    ['engineer', 'developer'],
    ['analyst', 'specialist'],
    ['designer'],
    ['marketing', 'growth', 'demand gen'],
    ['sales', 'account'],
  ];

  for (const roleGroup of roles) {
    const reqHasRole = roleGroup.some(r => requirement.includes(r));
    const titleHasRole = roleGroup.some(r => title.includes(r));
    if (reqHasRole && titleHasRole) {
      return 80;
    }
  }

  // Seniority matches
  if (requirement.includes('senior') && /senior|lead|director|head|principal/i.test(title)) {
    return 75;
  }

  if (requirement.includes('experience') && /manager|lead|senior|director/i.test(title)) {
    return 70;
  }

  return 0;
}

/**
 * Score experience years
 */
function scoreExperienceYears(requirement: string, resume: ResumeData): number {
  const reqLower = requirement.toLowerCase();

  // Extract required years
  const yearsMatch = reqLower.match(/(\d+)\+?\s*years?/i);
  if (!yearsMatch) return 0;

  const requiredYears = parseInt(yearsMatch[1]);
  const actualYears = getTotalYears(resume);

  if (actualYears >= requiredYears) return 90;
  if (actualYears >= requiredYears * 0.8) return 75;
  if (actualYears >= requiredYears * 0.6) return 60;
  if (actualYears > 0) return 40;

  return 0;
}

/**
 * Get total years of experience
 */
function getTotalYears(resume: ResumeData): number {
  let totalYears = 0;
  const currentYear = new Date().getFullYear();

  for (const exp of resume.experiences) {
    if (exp.dateRange) {
      const years = extractYearsFromDateRange(exp.dateRange, currentYear);
      totalYears += years;
    } else {
      totalYears += 1; // Assume at least 1 year
    }
  }

  return totalYears;
}

/**
 * Extract years from date range
 */
function extractYearsFromDateRange(dateRange: string, currentYear: number): number {
  const presentMatch = /present|current|now/i.test(dateRange);
  const yearsMatch = dateRange.match(/(\d{4})/g);

  if (yearsMatch && yearsMatch.length >= 1) {
    const startYear = parseInt(yearsMatch[0]);
    const endYear = presentMatch ? currentYear : (yearsMatch[1] ? parseInt(yearsMatch[1]) : currentYear);
    return Math.max(1, endYear - startYear);
  }

  return 1;
}

/**
 * Score education match
 */
function scoreEducationMatch(requirement: string, education: Education): number {
  const eduText = `${education.degree} ${education.institution}`.toLowerCase();

  // Degree type matches
  const degreeTypes = [
    { names: ['bachelor', 'bs', 'ba', 'b.s.', 'b.a.', 'bcomm', 'b.comm'], level: 1 },
    { names: ['master', 'ms', 'ma', 'm.s.', 'm.a.', 'mba'], level: 2 },
    { names: ['phd', 'ph.d.', 'doctorate'], level: 3 },
  ];

  for (const { names } of degreeTypes) {
    const reqHas = names.some(n => requirement.includes(n));
    const eduHas = names.some(n => eduText.includes(n));
    if (reqHas && eduHas) return 90;
  }

  // Field of study
  const fields = ['marketing', 'business', 'commerce', 'computer science', 'engineering', 'design', 'communications'];
  for (const field of fields) {
    if (requirement.includes(field) && eduText.includes(field)) {
      return 85;
    }
  }

  // Generic degree requirement
  if (requirement.includes('degree') && education.degree) {
    return 70;
  }

  return 0;
}

/**
 * Score raw text match (fallback)
 */
function scoreRawTextMatch(requirement: string, rawText: string): number {
  // Check for specific term matches
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    const allTerms = [canonical.toLowerCase(), ...synonyms.map(s => s.toLowerCase())];

    const reqHasTerm = allTerms.some(t => requirement.includes(t));
    const textHasTerm = allTerms.some(t => rawText.includes(t));

    if (reqHasTerm && textHasTerm) {
      return 60; // Found via synonym in raw text
    }
  }

  return 0;
}

/**
 * Get match type from score
 */
function getMatchType(score: number): MatchResult['matchType'] {
  if (score >= 85) return 'exact';
  if (score >= 60) return 'semantic';
  if (score >= 40) return 'partial';
  return 'missing';
}

// =============================================================================
// SCORE CALCULATION
// =============================================================================

/**
 * Calculate overall match score
 */
export function calculateMatchScore(
  matched: MatchResult[],
  missing: MatchResult[],
  hasDomainMismatch: boolean = false
): number {
  const total = matched.length + missing.length;
  if (total === 0) return 50; // Default if no requirements

  // Weight by importance
  const weights = { critical: 3, high: 2, medium: 1.5, low: 0.5 };

  let weightedScore = 0;
  let totalWeight = 0;

  // Score matched items
  for (const m of matched) {
    const weight = weights[m.requirement.importance];
    weightedScore += (m.score / 100) * weight;
    totalWeight += weight;
  }

  // Penalize missing items (but not as harshly)
  for (const m of missing) {
    const weight = weights[m.requirement.importance] * 0.7; // Reduced penalty
    totalWeight += weight;
  }

  let score = Math.round((weightedScore / totalWeight) * 100);

  // Domain mismatch penalty (but not too severe)
  if (hasDomainMismatch) {
    score = Math.round(score * 0.7);
  }

  // Ensure reasonable bounds
  return Math.min(Math.max(score, 20), 95);
}
