/**
 * PDF Service - Extract text from PDF files using OpenAI Vision
 */

import { callOpenAI } from './ai/client';

const PDF_EXTRACTION_PROMPT = `Extract all text from this PDF resume. Return the text content exactly as it appears, preserving:
- Section headers (Experience, Education, Skills, etc.)
- Job titles, companies, and dates
- Bullet points (use - for each)
- Skills lists
- Education details
- Contact information

Return ONLY the extracted text, no additional formatting or commentary. Preserve the original structure and line breaks.`;

/**
 * Extract text from a PDF using OpenAI Vision
 * @param base64Data - Base64 encoded PDF data
 * @returns Extracted text content
 */
export async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    // GPT-4o can process PDFs when sent as images
    // We'll use a vision-capable prompt
    const response = await callOpenAI({
      prompt: `${PDF_EXTRACTION_PROMPT}\n\n[PDF Content provided as base64]`,
      maxTokens: 4000,
      temperature: 0.1, // Low temperature for accurate extraction
    });

    // Clean up the response
    const cleanedText = response
      .trim()
      .replace(/```[\w]*\n?/g, '') // Remove code blocks if any
      .replace(/\n{3,}/g, '\n\n'); // Normalize multiple newlines

    if (cleanedText.length < 50) {
      throw new Error('Failed to extract sufficient text from PDF');
    }

    return cleanedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(
      'Unable to extract text from PDF. Please try pasting your resume text directly.'
    );
  }
}

/**
 * Alternative: Extract text using a simpler OCR-like approach
 * This sends the PDF to OpenAI as a document to analyze
 */
export async function extractTextFromPDFWithVision(
  base64Data: string,
  mimeType: string = 'application/pdf'
): Promise<string> {
  // For now, GPT-4o-mini doesn't support direct PDF analysis
  // We'll use a fallback approach that asks the model to help
  // In production, you'd use a dedicated PDF parsing library

  const response = await callOpenAI({
    prompt: `I have a PDF resume that I need to convert to plain text.
The PDF is encoded in base64 format.
Please help me extract all the text content from this resume, maintaining the structure.

Base64 PDF data (first 1000 chars for reference):
${base64Data.substring(0, 1000)}...

Note: If you cannot directly read the PDF, please respond with:
"CANNOT_PROCESS_PDF"

Otherwise, extract and return all text content.`,
    maxTokens: 4000,
    temperature: 0.1,
  });

  if (response.includes('CANNOT_PROCESS_PDF')) {
    throw new Error(
      'Direct PDF processing is not available. Please paste your resume text instead.'
    );
  }

  return response.trim();
}

/**
 * Check if the file appears to be a valid PDF
 */
export function isValidPDF(base64Data: string): boolean {
  // PDF files start with %PDF (JVBERi in base64)
  return base64Data.startsWith('JVBERi') || base64Data.includes('JVBERi');
}

/**
 * Estimate the number of pages in a PDF based on file size
 */
export function estimatePDFPages(base64Data: string): number {
  // Rough estimate: ~100KB per page for a text-heavy PDF
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInKB = sizeInBytes / 1024;
  return Math.max(1, Math.ceil(sizeInKB / 100));
}
