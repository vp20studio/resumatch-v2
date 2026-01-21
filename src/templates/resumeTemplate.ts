/**
 * ATS-Friendly Resume Template
 * Clean, parseable HTML that works with Applicant Tracking Systems
 */

import { TailoredResume } from '../services/tailoring/types';

export interface ResumeTemplateOptions {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  primaryColor?: string;
}

const DEFAULT_OPTIONS: ResumeTemplateOptions = {
  primaryColor: '#4F46E5', // colors.primary[600]
};

/**
 * Generate ATS-friendly HTML for a tailored resume
 */
export function generateResumeHTML(
  resume: TailoredResume,
  options: ResumeTemplateOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const contactSection = generateContactSection(opts);
  const summarySection = resume.summary ? generateSummarySection(resume.summary) : '';
  const skillsSection = resume.skills.length > 0 ? generateSkillsSection(resume.skills) : '';
  const experienceSection = resume.experiences.length > 0
    ? generateExperienceSection(resume.experiences)
    : '';
  const educationSection = resume.education.length > 0
    ? generateEducationSection(resume.education)
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.name || 'Resume')}</title>
  <style>
    ${getResumeStyles(opts.primaryColor)}
  </style>
</head>
<body>
  <div class="container">
    ${contactSection}
    ${summarySection}
    ${skillsSection}
    ${experienceSection}
    ${educationSection}
  </div>
</body>
</html>
  `.trim();
}

function generateContactSection(opts: ResumeTemplateOptions): string {
  const parts: string[] = [];

  if (opts.name) {
    parts.push(`<h1 class="name">${escapeHtml(opts.name)}</h1>`);
  }

  const contactParts: string[] = [];
  if (opts.email) contactParts.push(escapeHtml(opts.email));
  if (opts.phone) contactParts.push(escapeHtml(opts.phone));
  if (opts.location) contactParts.push(escapeHtml(opts.location));
  if (opts.linkedin) contactParts.push(escapeHtml(opts.linkedin));

  if (contactParts.length > 0) {
    parts.push(`<p class="contact">${contactParts.join(' | ')}</p>`);
  }

  return parts.length > 0 ? `<header class="header">${parts.join('')}</header>` : '';
}

function generateSummarySection(summary: string): string {
  return `
    <section class="section">
      <h2 class="section-title">Professional Summary</h2>
      <p class="summary">${escapeHtml(summary)}</p>
    </section>
  `;
}

function generateSkillsSection(skills: string[]): string {
  return `
    <section class="section">
      <h2 class="section-title">Skills</h2>
      <p class="skills">${skills.map(escapeHtml).join(' | ')}</p>
    </section>
  `;
}

function generateExperienceSection(
  experiences: TailoredResume['experiences']
): string {
  const experienceItems = experiences.map(
    (exp) => `
      <div class="experience-item">
        <div class="experience-header">
          <div class="experience-title-company">
            <h3 class="job-title">${escapeHtml(exp.title)}</h3>
            <span class="company">${escapeHtml(exp.company)}</span>
          </div>
          ${exp.dateRange ? `<span class="date">${escapeHtml(exp.dateRange)}</span>` : ''}
        </div>
        <ul class="bullets">
          ${exp.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}
        </ul>
      </div>
    `
  );

  return `
    <section class="section">
      <h2 class="section-title">Experience</h2>
      ${experienceItems.join('')}
    </section>
  `;
}

function generateEducationSection(education: string[]): string {
  const educationItems = education.map(
    (edu) => `<p class="education-item">${escapeHtml(edu)}</p>`
  );

  return `
    <section class="section">
      <h2 class="section-title">Education</h2>
      ${educationItems.join('')}
    </section>
  `;
}

function getResumeStyles(primaryColor: string = '#4F46E5'): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #333333;
      background: white;
    }

    .container {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in 0.6in;
    }

    .header {
      text-align: center;
      margin-bottom: 16pt;
      padding-bottom: 10pt;
      border-bottom: 2pt solid ${primaryColor};
    }

    .name {
      font-size: 22pt;
      font-weight: 700;
      color: #111827;
      letter-spacing: 0.5pt;
      margin-bottom: 6pt;
    }

    .contact {
      font-size: 10pt;
      color: #4B5563;
    }

    .section {
      margin-bottom: 14pt;
    }

    .section-title {
      font-size: 12pt;
      font-weight: 700;
      color: ${primaryColor};
      text-transform: uppercase;
      letter-spacing: 1pt;
      margin-bottom: 8pt;
      padding-bottom: 3pt;
      border-bottom: 1pt solid #E5E7EB;
    }

    .summary {
      font-size: 10pt;
      color: #374151;
      line-height: 1.5;
    }

    .skills {
      font-size: 10pt;
      color: #374151;
      line-height: 1.6;
    }

    .experience-item {
      margin-bottom: 12pt;
    }

    .experience-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4pt;
    }

    .experience-title-company {
      flex: 1;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 600;
      color: #111827;
    }

    .company {
      font-size: 10pt;
      color: #4B5563;
      font-style: italic;
    }

    .date {
      font-size: 10pt;
      color: #6B7280;
      text-align: right;
      flex-shrink: 0;
      margin-left: 12pt;
    }

    .bullets {
      list-style: none;
      padding-left: 0;
    }

    .bullets li {
      font-size: 10pt;
      color: #374151;
      line-height: 1.5;
      padding-left: 14pt;
      position: relative;
      margin-bottom: 3pt;
    }

    .bullets li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${primaryColor};
    }

    .education-item {
      font-size: 10pt;
      color: #374151;
      margin-bottom: 4pt;
    }

    @media print {
      body {
        font-size: 10pt;
      }
      .container {
        padding: 0;
      }
    }
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
