# ResuMatch v2

## Product Vision

**"Land your next job in 30-60 days"**

ResuMatch is a gamified job search accountability system that makes applying so fast and easy, users actually do it. We remove every excuse by combining:
- 8-second tailored resumes
- AI-detection-proof cover letters
- Application tracking with streaks and goals
- Beautiful, ATS-friendly PDF exports

---

## CRITICAL: Use Existing Code

This is a mature codebase. DO NOT recreate things that exist.
EXTEND the app, don't replace it.

---

## Tech Stack

- React Native 0.81.5 / Expo SDK 54
- TypeScript 5.9
- Expo Router (file-based routing)
- Zustand (state management with persistence)
- OpenAI API (gpt-4o) - key embedded in config
- ZeroGPT API (AI detection)

---

## Project Structure

```
src/
├── config/
│   └── env.ts                    # API keys (gitignored)
├── services/
│   ├── ai/
│   │   └── client.ts             # OpenAI wrapper with retry/timeout
│   ├── tailoring/
│   │   ├── index.ts              # Main exports
│   │   ├── orchestrator.ts       # 2-pass tailoring flow
│   │   ├── parser.ts             # Resume parsing (no LLM)
│   │   ├── jdAnalyzer.ts         # JD extraction (1 LLM call)
│   │   ├── matcher.ts            # Skill matching (no LLM)
│   │   ├── formatter.ts          # Resume formatting (1 LLM call)
│   │   ├── coverLetter.ts        # Cover letter gen (1 LLM call)
│   │   └── types.ts              # All type definitions
│   ├── aiDetection.ts            # ZeroGPT integration
│   ├── pdfService.ts             # PDF import (extract text)
│   └── exportService.ts          # PDF export (resume/cover letter)
├── stores/
│   ├── index.ts                  # All exports
│   ├── authStore.ts              # Onboarding state (no API key)
│   ├── resumeStore.ts            # User's resume data
│   ├── generationStore.ts        # Current generation state
│   ├── historyStore.ts           # Past applications with status
│   └── goalsStore.ts             # Weekly targets, streaks
├── components/ui/
│   ├── index.ts                  # All exports
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Text.tsx
│   ├── Toast.tsx
│   ├── LoadingOverlay.tsx
│   └── ConfirmDialog.tsx
├── templates/
│   ├── resumeTemplate.ts         # HTML template for PDF
│   └── coverLetterTemplate.ts    # HTML template for PDF
├── utils/
│   ├── formatDate.ts             # Relative dates
│   └── cleanJobDescription.ts    # Clean pasted JDs
├── theme/
│   ├── colors.ts
│   ├── spacing.ts
│   └── typography.ts
└── __tests__/
    ├── fixtures/
    │   ├── testResumes.ts
    │   └── testJobDescriptions.ts
    ├── algorithmTest.ts
    └── runTests.ts

app/
├── _layout.tsx                   # Root layout
├── index.tsx                     # Entry router
├── (onboarding)/
│   ├── _layout.tsx
│   ├── welcome.tsx               # Hero + Get Started
│   ├── upload.tsx                # Resume paste/PDF upload
│   ├── goals.tsx                 # Set timeline + weekly target
│   └── complete.tsx              # Success, go to app
├── (tabs)/
│   ├── _layout.tsx               # Tab navigator
│   ├── generate.tsx              # Main generation screen
│   ├── tracker.tsx               # Application pipeline
│   └── profile.tsx               # Settings + resume
└── (modals)/
    ├── _layout.tsx
    ├── result.tsx                # Match score, resume, cover letter
    └── edit-resume.tsx           # Edit resume text
```

---

## Stores Reference

### authStore
```typescript
import { useAuthStore } from '../stores';

const { 
  hasCompletedOnboarding,
  completeOnboarding,
  resetOnboarding 
} = useAuthStore();
```

### resumeStore
```typescript
import { useResumeStore } from '../stores';

const {
  rawText,              // Original resume text
  parsedData,           // Structured ResumeData
  setRawText,
  setParsedData,
  clearResume
} = useResumeStore();
```

### generationStore
```typescript
import { useGenerationStore } from '../stores';

const {
  jobDescription,
  status,               // 'idle' | 'generating' | 'success' | 'error'
  progress,             // { step, progress: 0-100, message }
  result,               // TailoringResult
  aiDetectionScore,     // ZeroGPT score
  setJobDescription,
  startGeneration,
  setProgress,
  setResult,
  setError,
  reset
} = useGenerationStore();
```

### historyStore
```typescript
import { useHistoryStore } from '../stores';

const {
  items,                // HistoryItem[]
  addItem,              // Add new application
  updateStatus,         // Change status (applied/replied/interviewing/offer/rejected)
  removeItem,
  clearHistory
} = useHistoryStore();

// HistoryItem shape:
{
  id: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  aiDetectionScore: number;
  result: TailoringResult;
  status: 'applied' | 'replied' | 'interviewing' | 'offer' | 'rejected';
  appliedDate: string;
  createdAt: string;
}
```

### goalsStore
```typescript
import { useGoalsStore } from '../stores';

const {
  targetDays,           // 30, 60, or 90
  weeklyTarget,         // Number of applications
  startDate,
  currentStreak,
  lastApplicationDate,
  weeklyProgress,       // Computed: applications this week
  daysRemaining,        // Computed: days until goal
  setGoals,
  incrementStreak,
  resetStreak
} = useGoalsStore();
```

---

## Services Reference

### Tailoring (ALREADY COMPLETE - USE IT)
```typescript
import { tailorResume, tailorResumeQuick } from '../services/tailoring';

const result = await tailorResume(resumeText, jobDescription, (progress) => {
  setProgress(progress);
});

// Result shape:
{
  resume: TailoredResume;
  coverLetter: string;
  matchScore: number;
  matchedItems: MatchResult[];
  missingItems: MatchResult[];
  processingTime: number;
}
```

### AI Detection
```typescript
import { checkAIScore } from '../services/aiDetection';

const { score, isHuman } = await checkAIScore(coverLetterText);
// score: 0-100 (lower = more human)
// isHuman: true if score < 40
```

### PDF Export
```typescript
import { generateResumePDF, generateCoverLetterPDF } from '../services/exportService';

const resumeUri = await generateResumePDF(result.resume, userName);
const coverLetterUri = await generateCoverLetterPDF(result.coverLetter, company);

// Then share:
import * as Sharing from 'expo-sharing';
await Sharing.shareAsync(resumeUri);
```

### PDF Import
```typescript
import { pickAndExtractPDF } from '../services/pdfService';

const resumeText = await pickAndExtractPDF();
if (resumeText) {
  setRawText(resumeText);
}
```

---

## Theme Reference

```typescript
import { colors, spacing, typography } from '../theme';

// Colors
colors.primary[600]       // #4F46E5 - brand
colors.accent[500]        // #14B8A6 - success/progress
colors.text.primary       // #111827
colors.text.secondary     // #4B5563
colors.background.primary // #FFFFFF
colors.success.main       // #10B981
colors.warning.main       // #F59E0B
colors.error.main         // #EF4444

// Spacing
spacing[2] = 8
spacing[4] = 16
spacing[6] = 24
spacing[8] = 32

// Use for match score colors:
// 80%+ = colors.success.main (green)
// 60-79% = colors.warning.main (yellow)
// <60% = colors.error.main (red)
```

---

## User Flows

### Onboarding (First Launch)
```
welcome.tsx → upload.tsx → goals.tsx → complete.tsx → (tabs)/generate.tsx
```

### Generation Flow
```
1. User pastes JD on generate.tsx
2. Tap "Generate" → startGeneration()
3. Call tailorResume() with progress callback
4. Check AI score with checkAIScore()
5. If AI score > 50, regenerate cover letter
6. Navigate to result.tsx modal
7. User views score, resume, cover letter
8. User exports PDF and/or copies text
9. Prompt "Mark as Applied?"
10. If yes → addItem() to history, update streak
11. Return to generate.tsx with updated stats
```

### Application Tracking
```
tracker.tsx shows pipeline:
Applied (23) → Replied (5) → Interviewing (2) → Offers (0)

Tap any item → view original result
Swipe or tap to change status
```

---

## Quality Thresholds

| Metric | Target | Action if Failed |
|--------|--------|------------------|
| Match score (relevant job) | 50-95% | Check matcher.ts |
| Match score (irrelevant job) | 20-50% | Check scoring weights |
| AI detection score | < 40% | Regenerate cover letter |
| Cover letter length | 150-350 words | Adjust prompt |
| Skills extracted | 5+ | Check parser.ts |
| Requirements extracted | 5+ | Check jdAnalyzer.ts |

---

## DO NOT

- ❌ Create new state management - USE existing Zustand stores
- ❌ Recreate types - IMPORT from services/tailoring/types
- ❌ Hardcode colors - USE theme tokens
- ❌ Recreate components - USE src/components/ui
- ❌ Reimplement tailoring - CALL tailorResume()
- ❌ Ask user for API key - IT'S EMBEDDED
- ❌ Store sensitive data in AsyncStorage - USE expo-secure-store

## DO

- ✅ Import from existing modules
- ✅ Use the theme colors and spacing
- ✅ Handle loading/error/empty states
- ✅ Update streak after applications
- ✅ Check AI detection on every cover letter
- ✅ Show progress during generation
- ✅ Make it feel gamified and motivating

---

## Commands

```bash
npm start              # Start Expo dev server
npx expo start --ios   # iOS simulator
npx expo start --web   # Web browser
npx tsc --noEmit       # Type check
npm test               # Run algorithm tests
```