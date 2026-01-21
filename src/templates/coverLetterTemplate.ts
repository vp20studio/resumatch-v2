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

  // Parse salutation, body, closing, signature from the text
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

/**
 * Parse cover letter text into structured parts
 * Handles both formal ("Dear Hiring Manager,") and casual ("Hi,", "Hello,") greetings
 */
function parseCoverLetter(
  paragraphs: string[],
  opts: CoverLetterTemplateOptions
): {
  salutation: string;
  body: string[];
  closing: string;
  signature: string;
} {
  let salutation = 'Hi,';
  let body = [...paragraphs];
  let closing = 'Best,';
  let signature = opts.applicantName || '[Your Name]';

  // Greeting patterns to detect (both formal and casual)
  const greetingPatterns = [
    /^dear\s/i,
    /^hi,?\s*$/i,
    /^hi\s/i,
    /^hello,?\s*$/i,
    /^hello\s/i,
    /^hey,?\s*$/i,
    /^hey\s/i,
    /^good\s+(morning|afternoon|evening)/i,
    /^to\s+whom/i,
  ];

  // Check if first paragraph is a salutation/greeting
  if (body.length > 0) {
    const firstPara = body[0].trim();
    const firstLine = firstPara.split('\n')[0].trim();
    
    const isGreeting = greetingPatterns.some(p => p.test(firstLine));
    
    if (isGreeting) {
      // If the greeting is just "Hi," or "Hello," on its own line, use it
      if (/^(hi|hello|hey|dear\s+hiring\s+manager),?\s*$/i.test(firstLine)) {
        salutation = firstLine.endsWith(',') ? firstLine : firstLine + ',';
        
        // Check if there's more content after the greeting in the same paragraph
        const restOfPara = firstPara.split('\n').slice(1).join('\n').trim();
        if (restOfPara) {
          body[0] = restOfPara;
        } else {
          body.shift();
        }
      } else if (firstPara.includes('\n')) {
        // Greeting is part of first line, body continues
        const lines = firstPara.split('\n');
        salutation = lines[0].trim();
        if (!salutation.endsWith(',')) salutation += ',';
        body[0] = lines.slice(1).join('\n').trim();
        if (!body[0]) body.shift();
      } else {
        // Whole first paragraph is just the greeting
        salutation = body.shift()!;
        if (!salutation.endsWith(',')) salutation += ',';
      }
    }
  }

  // Closing patterns
  const closingPatterns = [
    /^sincerely,?$/i,
    /^best,?$/i,
    /^regards,?$/i,
    /^best\s+regards,?$/i,
    /^thank\s+you,?$/i,
    /^thanks,?$/i,
    /^warm\s+regards,?$/i,
    /^cheers,?$/i,
    /^take\s+care,?$/i,
  ];

  // Check if last paragraph is a signature block
  if (body.length > 0) {
    const lastPara = body[body.length - 1];
    const lastLines = lastPara.split('\n').map(l => l.trim()).filter(l => l);

    // If it's a short block (likely signature)
    if (lastPara.length < 150 && lastLines.length <= 3) {
      const potentialSignature = body.pop()!;
      const lines = potentialSignature.split('\n').map(l => l.trim()).filter(l => l);

      if (lines.length === 1) {
        // Just one line - could be closing or name
        if (closingPatterns.some(p => p.test(lines[0]))) {
          closing = lines[0];
        } else if (lines[0].split(' ').length <= 4) {
          // Likely a name
          signature = lines[0];
        } else {
          // Put it back, it's probably body content
          body.push(potentialSignature);
        }
      } else if (lines.length === 2) {
        // Two lines - likely closing + name
        if (closingPatterns.some(p => p.test(lines[0]))) {
          closing = lines[0];
          signature = lines[1];
        } else {
          // First line might be last sentence, second is name
          body.push(lines[0]);
          signature = lines[1];
        }
      } else if (lines.length === 3) {
        // Three lines - might have extra content
        if (closingPatterns.some(p => p.test(lines[0]))) {
          closing = lines[0];
          signature = lines.slice(1).join(' ');
        } else if (closingPatterns.some(p => p.test(lines[1]))) {
          body.push(lines[0]);
          closing = lines[1];
          signature = lines[2];
        }
      }
    }
  }

  // Check if second to last paragraph is a standalone closing
  if (body.length > 0) {
    const lastPara = body[body.length - 1].trim();
    if (closingPatterns.some(p => p.test(lastPara))) {
      closing = body.pop()!;
    }
  }

  // Clean up closing - ensure it ends with comma
  if (closing && !closing.endsWith(',')) {
    closing = closing + ',';
  }

  // If we still don't have body content, something went wrong - put signature back as body
  if (body.length === 0 && signature !== opts.applicantName) {
    body.push(signature);
    signature = opts.applicantName || '[Your Name]';
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
      margin-bottom: 30pt;
      padding-bottom: 12pt;
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

    .letter-content {
      max-width: 6.5in;
    }

    .salutation {
      font-size: 11pt;
      color: #111827;
      margin-bottom: 16pt;
    }

    .body {
      margin-bottom: 20pt;
    }

    .body p {
      font-size: 11pt;
      color: #374151;
      line-height: 1.7;
      margin-bottom: 14pt;
      text-align: left;
    }

    .body p:last-child {
      margin-bottom: 0;
    }

    .closing {
      font-size: 11pt;
      color: #111827;
      margin-bottom: 24pt;
      margin-top: 20pt;
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
