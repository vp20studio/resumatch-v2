import { preParsedJDs } from './fixtures/parsedJobDescriptions';
import { testResumes } from './fixtures/testResumes';
import { parseResume } from '../services/tailoring/parser';

// Copy the domain detection logic (updated)
const DOMAIN_INDICATORS: Record<string, string[]> = {
  software: ['software engineer', 'software developer', 'software development experience', 'programming language', 'computer science degree', 'cs degree'],
  frontend: ['frontend developer', 'front-end developer', 'react developer', 'angular developer', 'vue developer', 'javascript developer', 'web developer'],
  backend: ['backend developer', 'back-end developer', 'api development', 'server-side', 'microservices architecture'],
  design: ['ux designer', 'ui designer', 'ux design experience', 'ui design experience', 'user experience designer', 'product designer', 'figma', 'sketch', 'user research experience', 'usability testing', 'wireframes', 'prototypes', 'design portfolio'],
  marketing: ['marketing manager', 'marketing experience', 'marketing lead', 'demand generation', 'growth marketing', 'b2b marketing', 'marketing automation', 'hubspot', 'marketo', 'mql', 'marketing campaigns', 'content marketing'],
  sales: ['sales experience', 'sales manager', 'sales team', 'account executive', 'enterprise sales', 'quota attainment', 'sales pipeline', 'closed deals', 'revenue targets', 'b2b sales', 'saas sales'],
  data: ['data scientist', 'data analyst', 'data engineer', 'machine learning engineer', 'data science experience', 'statistical analysis'],
};

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

function getJDDomains(jd: any): string[] {
  const jdText = [jd.title, ...jd.required.map((r: any) => r.text), ...jd.preferred.map((r: any) => r.text)].join(' ');
  return detectDomain(jdText);
}

function getResumeDomains(resumeText: string): string[] {
  const resume = parseResume(resumeText);
  const allText = [
    ...resume.skills.map(s => s.name),
    ...resume.experiences.map(e => e.title + ' ' + e.company),
    ...resume.experiences.flatMap(e => e.bullets.map(b => b.text)),
  ].join(' ');
  return detectDomain(allText);
}

console.log('=== JD Domains ===');
for (const [id, jd] of Object.entries(preParsedJDs)) {
  console.log(id + ': ' + JSON.stringify(getJDDomains(jd)));
}

console.log('\n=== Resume Domains ===');
for (const resume of testResumes) {
  console.log(resume.id + ': ' + JSON.stringify(getResumeDomains(resume.text)));
}

console.log('\n=== Problematic Pairs ===');
const pairs = [
  ['swe-mid', 'ux-designer-health'],
  ['swe-mid', 'vp-sales-enterprise'],
  ['marketing-senior', 'ux-designer-health'],
  ['career-changer', 'junior-swe-google'],
  ['exec-sales', 'junior-swe-google'],
];

for (const [resumeId, jdId] of pairs) {
  const resume = testResumes.find(r => r.id === resumeId);
  const jd = preParsedJDs[jdId];
  if (resume && jd) {
    const resumeDomains = getResumeDomains(resume.text);
    const jdDomains = getJDDomains(jd);
    const overlap = jdDomains.filter(d => resumeDomains.includes(d));
    console.log(resumeId + ' vs ' + jdId + ':');
    console.log('  Resume: ' + JSON.stringify(resumeDomains));
    console.log('  JD: ' + JSON.stringify(jdDomains));
    console.log('  Overlap: ' + JSON.stringify(overlap) + ' -> ' + (overlap.length > 0 ? 'NO MISMATCH' : 'MISMATCH'));
  }
}
