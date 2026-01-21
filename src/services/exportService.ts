/**
 * Export Service - Generate PDFs from tailored resumes and cover letters
 * Uses ATS-friendly templates for professional output
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TailoredResume } from './tailoring/types';
import {
  generateResumeHTML,
  generateCoverLetterHTML,
  ResumeTemplateOptions,
  CoverLetterTemplateOptions,
} from '../templates';

export interface ResumeExportOptions {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
}

export interface CoverLetterExportOptions {
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  companyName?: string;
  jobTitle?: string;
  recipientName?: string;
}

/**
 * Generate a PDF from a tailored resume using ATS-friendly template
 */
export async function generateResumePDF(
  resume: TailoredResume,
  options?: ResumeExportOptions
): Promise<string> {
  const templateOptions: ResumeTemplateOptions = {
    name: options?.name,
    email: options?.email,
    phone: options?.phone,
    location: options?.location,
    linkedin: options?.linkedin,
  };

  const html = generateResumeHTML(resume, templateOptions);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

/**
 * Generate a PDF from a cover letter using professional template
 */
export async function generateCoverLetterPDF(
  coverLetter: string,
  jobTitle?: string,
  company?: string,
  applicantInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  }
): Promise<string> {
  const templateOptions: CoverLetterTemplateOptions = {
    applicantName: applicantInfo?.name,
    applicantEmail: applicantInfo?.email,
    applicantPhone: applicantInfo?.phone,
    companyName: company,
    jobTitle: jobTitle,
  };

  const html = generateCoverLetterHTML(coverLetter, templateOptions);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

/**
 * Share a PDF file
 */
export async function sharePDF(uri: string, filename?: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: filename || 'Share Document',
    UTI: 'com.adobe.pdf',
  });
}

/**
 * Check if sharing is available on this device
 */
export async function isSharingAvailable(): Promise<boolean> {
  return await Sharing.isAvailableAsync();
}
