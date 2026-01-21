/**
 * Professional Cover Letter Template
 * Clean, professional HTML for cover letter PDF export
 */

export interface CoverLetterTemplateOptions {
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantLocation?: string;
  recipientName?: string;
  companyName?: string;
  jobTitle?: string;
  date?: string;
  primaryColor?: string;
}

const DEFAULT_OPTIONS: CoverLetterTemplateOptions = {
  date: new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  primaryColor: '#4F46E5',
};

/**
 * Generate professional HTML for a cover letter
 */
export function generateCoverLetterHTML(
  coverLetterText: string,
  options: CoverLetterTemplateOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Parse the cover letter into paragraphs
  const paragraphs = coverLetterText
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Try to detect and remove salutation/signature from body if present
  const { salutation, body, closing, signature } = parseCoverLetter(paragraphs, opts);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cover Letter - ${escapeHtml(opts.applicantName || 'Applicant')}</title>
  <style>
    ${getCoverLetterStyles(opts.primaryColor)}
  </style>
</head>
<body>
  <div class="container">
    ${generateHeader(opts)}

    <div class="letter-content">
      ${opts.date ? `<p class="date">${escapeHtml(opts.date)}</p>` : ''}

      ${generateRecipientBlock(opts)}

      <p class="salutation">${escapeHtml(salutation)}</p>

      <div class="body">
        ${body.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
      </div>

      <p class="closing">${escapeHtml(closing)}</p>

      <p class="signature">${escapeHtml(signature)}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateHeader(opts: CoverLetterTemplateOptions): string {
  const parts: string[] = [];

  if (opts.applicantName) {
    parts.push(`<h1 class="name">${escapeHtml(opts.applicantName)}</h1>`);
  }

  const contactParts: string[] = [];
  if (opts.applicantEmail) contactParts.push(escapeHtml(opts.applicantEmail));
  if (opts.applicantPhone) contactParts.push(escapeHtml(opts.applicantPhone));
  if (opts.applicantLocation) contactParts.push(escapeHtml(opts.applicantLocation));

  if (contactParts.length > 0) {
    parts.push(`<p class="contact">${contactParts.join(' | ')}</p>`);
  }

  return parts.length > 0 ? `<header class="header">${parts.join('')}</header>` : '';
}

function generateRecipientBlock(opts: CoverLetterTemplateOptions): string {
  const parts: string[] = [];

  if (opts.recipientName) {
    parts.push(escapeHtml(opts.recipientName));
  } else {
    parts.push('Hiring Manager');
  }

  if (opts.companyName) {
    parts.push(escapeHtml(opts.companyName));
  }

  if (opts.jobTitle) {
    parts.push(`Re: ${escapeHtml(opts.jobTitle)}`);
  }

  return parts.length > 0
    ? `<div class="recipient">${parts.map((p) => `<p>${p}</p>`).join('')}</div>`
    : '';
}

function parseCoverLetter(
  paragraphs: string[],
  opts: CoverLetterTemplateOptions
): {
  salutation: string;
  body: string[];
  closing: string;
  signature: string;
} {
  let salutation = 'Dear Hiring Manager,';
  let body = [...paragraphs];
  let closing = 'Sincerely,';
  let signature = opts.applicantName || '[Your Name]';

  // Check if first paragraph is a salutation
  if (body.length > 0 && body[0].toLowerCase().startsWith('dear')) {
    salutation = body.shift()!;
  }

  // Check if last paragraph is a signature (single short line)
  if (body.length > 0) {
    const lastPara = body[body.length - 1];
    const lastLines = lastPara.split('\n').filter((l) => l.trim());

    if (lastLines.length <= 2 && lastPara.length < 100) {
      const potentialSignature = body.pop()!;

      // Check for common closing phrases
      const closingPatterns = [
        /^sincerely,?$/i,
        /^best,?$/i,
        /^regards,?$/i,
        /^best regards,?$/i,
        /^thank you,?$/i,
        /^warm regards,?$/i,
      ];

      const lines = potentialSignature.split('\n').map((l) => l.trim());

      if (lines.length === 2) {
        // Closing + Name
        closing = lines[0];
        signature = lines[1];
      } else if (lines.length === 1) {
        // Just a closing or just a name
        if (closingPatterns.some((p) => p.test(lines[0]))) {
          closing = lines[0];
        } else {
          signature = lines[0];
        }
      }
    }
  }

  // Check if second to last paragraph is a closing
  if (body.length > 0) {
    const lastPara = body[body.length - 1];
    const closingPatterns = [
      /^sincerely,?$/i,
      /^best,?$/i,
      /^regards,?$/i,
      /^best regards,?$/i,
      /^thank you,?$/i,
    ];

    if (closingPatterns.some((p) => p.test(lastPara.trim()))) {
      closing = body.pop()!;
    }
  }

  return { salutation, body, closing, signature };
}

function getCoverLetterStyles(primaryColor: string = '#4F46E5'): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333333;
      background: white;
    }

    .container {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.75in 1in;
    }

    .header {
      text-align: center;
      margin-bottom: 24pt;
      padding-bottom: 12pt;
      border-bottom: 2pt solid ${primaryColor};
    }

    .name {
      font-size: 20pt;
      font-weight: 700;
      color: #111827;
      letter-spacing: 0.5pt;
      margin-bottom: 6pt;
    }

    .contact {
      font-size: 10pt;
      color: #4B5563;
    }

    .letter-content {
      max-width: 6.5in;
    }

    .date {
      font-size: 10pt;
      color: #374151;
      margin-bottom: 18pt;
    }

    .recipient {
      margin-bottom: 18pt;
    }

    .recipient p {
      font-size: 10pt;
      color: #374151;
      line-height: 1.4;
    }

    .salutation {
      font-size: 11pt;
      color: #111827;
      margin-bottom: 12pt;
    }

    .body {
      margin-bottom: 18pt;
    }

    .body p {
      font-size: 11pt;
      color: #374151;
      line-height: 1.7;
      margin-bottom: 12pt;
      text-align: justify;
    }

    .body p:last-child {
      margin-bottom: 0;
    }

    .closing {
      font-size: 11pt;
      color: #111827;
      margin-bottom: 24pt;
    }

    .signature {
      font-size: 11pt;
      font-weight: 600;
      color: #111827;
    }

    @media print {
      body {
        font-size: 10pt;
      }
      .container {
        padding: 0.5in;
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
