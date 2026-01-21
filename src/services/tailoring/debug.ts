/**
 * Debug utilities for tailoring service
 * Helps diagnose match score issues
 */

import { ResumeData, JDRequirements, MatchResult } from './types';

export function logResumeData(data: ResumeData): void {
  console.log('\n=== PARSED RESUME ===');
  console.log('Skills:', data.skills.length);
  data.skills.forEach(s => console.log(`  - ${s.name} (${s.category})`));

  console.log('\nExperiences:', data.experiences.length);
  data.experiences.forEach(e => {
    console.log(`  - ${e.title} @ ${e.company}`);
    console.log(`    Bullets: ${e.bullets.length}`);
    e.bullets.slice(0, 2).forEach(b => console.log(`      • ${b.text.substring(0, 60)}...`));
  });

  console.log('\nEducation:', data.education.length);
  data.education.forEach(e => console.log(`  - ${e.degree}`));
}

export function logJDRequirements(jd: JDRequirements): void {
  console.log('\n=== JD REQUIREMENTS ===');
  console.log('Title:', jd.title);
  console.log('Company:', jd.company);

  console.log('\nRequired:', jd.required.length);
  jd.required.forEach(r => console.log(`  - [${r.importance}] ${r.text}`));

  console.log('\nPreferred:', jd.preferred.length);
  jd.preferred.forEach(r => console.log(`  - [${r.importance}] ${r.text}`));

  console.log('\nKeywords:', jd.keywords.join(', '));
}

export function logMatchResults(matched: MatchResult[], missing: MatchResult[]): void {
  console.log('\n=== MATCH RESULTS ===');
  console.log(`Matched: ${matched.length}, Missing: ${missing.length}`);

  console.log('\nMatched Items:');
  matched.forEach(m => {
    console.log(`  ✓ [${m.score}%] ${m.requirement.text.substring(0, 50)}...`);
    console.log(`    → ${m.matchType}: ${m.originalText?.substring(0, 50) || 'N/A'}...`);
  });

  console.log('\nMissing Items:');
  missing.slice(0, 5).forEach(m => {
    console.log(`  ✗ [${m.score}%] ${m.requirement.text.substring(0, 50)}...`);
  });
  if (missing.length > 5) {
    console.log(`  ... and ${missing.length - 5} more`);
  }
}

export function logScoreCalculation(
  matched: MatchResult[],
  missing: MatchResult[],
  score: number
): void {
  const importanceWeight: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0.5 };

  let weightedMatched = 0;
  let totalWeight = 0;

  console.log('\n=== SCORE CALCULATION ===');

  for (const m of matched) {
    const weight = importanceWeight[m.requirement.importance];
    const contribution = (m.score / 100) * weight;
    weightedMatched += contribution;
    totalWeight += weight;
    console.log(`  Matched: score=${m.score}, weight=${weight}, contribution=${contribution.toFixed(2)}`);
  }

  for (const m of missing) {
    const weight = importanceWeight[m.requirement.importance];
    totalWeight += weight;
    console.log(`  Missing: weight=${weight} (adds to total only)`);
  }

  console.log(`\nWeighted Matched: ${weightedMatched.toFixed(2)}`);
  console.log(`Total Weight: ${totalWeight.toFixed(2)}`);
  console.log(`Final Score: ${score}%`);
}
