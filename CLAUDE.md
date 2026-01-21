# ResuMatch v2

## CRITICAL: Read This First

This is an EXISTING codebase with working services, stores, and components.
DO NOT recreate things that already exist. EXTEND the app, don't replace it.

## Project Overview

Mobile app that generates tailored resumes and cover letters using a 2-pass AI algorithm.

**What's DONE:**
- Tailoring algorithm (src/services/tailoring/) - 2-pass, 3 LLM calls, 5-8 seconds
- AI client (src/services/ai/client.ts) - OpenAI gpt-4o with retry/timeout
- State management (src/stores/) - Zustand with persistence
- Theme system (src/theme/) - Colors, spacing, typography
- Base UI components (src/components/ui/) - Button, Card, Input, Text, etc.
- Navigation structure (app/) - Expo Router with tabs

**What NEEDS building:**
- Onboarding flow (API key input, resume paste)
- Generate screen content (JD input → results)
- History screen (past generations list)
- Profile screen (view/edit resume, settings)
- Results viewing (modal or screen for tailored output)
- PDF upload support
- Polish and animations

## Tech Stack

- React Native 0.81.5 / Expo SDK 54
- TypeScript 5.9
- Expo Router (file-based routing)
- Zustand (state management)
- OpenAI API (gpt-4o)

---

## EXISTING CODE - USE THESE, DON'T RECREATE

### Stores (src/stores/)

```typescript
// Resume data - PERSISTED
import { useResumeStore } from '../stores';
const { rawText, parsedData, setRawText, setParsedData } = useResumeStore();

// Generation state - EPHEMERAL  
import { useGenerationStore } from '../stores';
const { 
  jobDescription, 
  status,      // 'idle' | 'generating' | 'success' | 'error'
  progress,    // { step, progress, message }
  result,      // TailoringResult
  setJobDescription,
  startGeneration,
  setProgress,
  setResult,
  setError,
  reset 
} = useGenerationStore();

// Auth state
import { useAuthStore } from '../stores';
const { isLoading, apiKey, setApiKey } = useAuthStore();
```

### Tailoring Service (src/services/tailoring/)

```typescript
import { tailorResume, tailorResumeQuick } from '../services/tailoring';

// Full mode (3 LLM calls, ~8 seconds)
const result = await tailorResume(resumeText, jobDescription, (progress) => {
  // progress: { step, progress: 0-100, message }
  setProgress(progress);
});

// Quick mode (1 LLM call, ~3 seconds)  
const result = await tailorResumeQuick(resumeText, jobDescription, onProgress);

// Result shape:
// {
//   resume: TailoredResume,
//   coverLetter: string,
//   matchScore: number,
//   matchedItems: MatchResult[],
//   missingItems: MatchResult[],
//   processingTime: number
// }
```

### AI Client (src/services/ai/client.ts)

```typescript
import { initializeOpenAI, isOpenAIInitialized } from '../services/ai/client';

// Must be called before using tailoring service
initializeOpenAI(apiKey);
```

### Theme (src/theme/)

```typescript
import { colors, spacing, typography } from '../theme';

// Colors - USE THESE, don't hardcode
colors.primary[600]      // #4F46E5 - main brand color
colors.accent[500]       // #14B8A6 - teal for success
colors.text.primary      // #111827
colors.text.secondary    // #4B5563
colors.background.primary // #FFFFFF
colors.border.light      // #E5E7EB
colors.success.main      // #10B981
colors.error.main        // #EF4444

// Spacing
spacing[1] = 4
spacing[2] = 8
spacing[3] = 12
spacing[4] = 16
spacing[6] = 24
spacing[8] = 32
```

### UI Components (src/components/ui/)

```typescript
import { Button, Card, Input, Text } from '../components/ui';

// Text variants
<Text variant="h1">Large heading</Text>
<Text variant="h2">Section heading</Text>
<Text variant="body">Body text</Text>
<Text variant="caption">Small text</Text>

// Button
<Button title="Generate" onPress={handlePress} />
<Button title="Cancel" variant="secondary" />
<Button title="Delete" variant="destructive" />

// Input
<Input 
  label="Job Description"
  value={value}
  onChangeText={setValue}
  placeholder="Paste job description..."
  multiline
  numberOfLines={6}
/>

// Card
<Card>
  <Text>Content</Text>
</Card>
```

---

## Navigation Structure

```
app/
├── _layout.tsx              # Root - Stack with (onboarding), (tabs), (modals)
├── index.tsx                # Redirect based on onboarding/auth state
├── (onboarding)/
│   ├── _layout.tsx          # Onboarding stack
│   ├── welcome.tsx          # Welcome screen
│   ├── api-key.tsx          # API key input
│   └── resume-upload.tsx    # Paste resume
├── (tabs)/
│   ├── _layout.tsx          # Tab navigator (Generate, History, Profile)
│   ├── generate.tsx         # Main generation screen
│   ├── history.tsx          # Past generations
│   └── profile.tsx          # User profile & settings
└── (modals)/
    ├── _layout.tsx          # Modal stack
    └── result.tsx           # View generation result
```

---

## Screen Specifications

### Onboarding: Welcome
- Hero section with app value prop
- "Get Started" button → api-key screen
- Skip option if returning user (check AsyncStorage)

### Onboarding: API Key
- Explain why OpenAI key is needed
- Secure input field for API key
- "Test Connection" button to verify
- Save to secure storage (expo-secure-store)
- Link to OpenAI to get key

### Onboarding: Resume Upload
- Two options: Paste text OR Upload PDF
- Large text area for paste
- "Paste from Clipboard" button
- PDF picker (expo-document-picker)
- Preview of parsed content
- "Continue" saves to resumeStore

### Tab: Generate
- Show current resume summary (from resumeStore)
- "Edit Resume" link
- Large text input for job description
- "Paste from Clipboard" button
- "Generate" button (disabled if no JD or no resume)
- Progress indicator during generation
- Auto-navigate to result on success

### Tab: History
- List of past generations (need to add history store)
- Each item shows: company, job title, match score, date
- Tap to view full result
- Swipe to delete
- Empty state if no history

### Tab: Profile
- Resume summary card
- "Update Resume" button
- "API Key" setting (masked, with edit)
- "Clear History" option
- "Reset App" option (clear all data)
- App version

### Modal: Result
- Match score prominently displayed (use ScoreGauge component)
- Segmented control: Resume | Cover Letter
- Scrollable content area
- "Copy" button for each section
- "Share" button
- Matched/Missing skills summary (collapsible)

---

## Implementation Patterns

### Screen Template
```typescript
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { useGenerationStore, useResumeStore } from '../../src/stores';

export default function ScreenName() {
  // Use existing stores
  const { rawText } = useResumeStore();
  const { status, result } = useGenerationStore();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        {/* Content */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    padding: spacing[4],
  },
});
```

### Generation Flow
```typescript
import { tailorResume } from '../../src/services/tailoring';
import { useGenerationStore, useResumeStore } from '../../src/stores';
import { initializeOpenAI } from '../../src/services/ai/client';

const handleGenerate = async () => {
  const { rawText } = useResumeStore.getState();
  const { jobDescription, startGeneration, setProgress, setResult, setError } = 
    useGenerationStore.getState();

  startGeneration();

  try {
    const result = await tailorResume(rawText, jobDescription, setProgress);
    setResult(result);
    // Navigate to result modal
    router.push('/(modals)/result');
  } catch (error) {
    setError(error.message);
  }
};
```

---

## DO NOT

- ❌ Create new state management - USE existing Zustand stores
- ❌ Create new types for resume/tailoring - IMPORT from services/tailoring/types
- ❌ Hardcode colors - USE colors from src/theme/colors
- ❌ Create new Button/Input/Text - USE src/components/ui
- ❌ Reimplement tailoring algorithm - CALL tailorResume()
- ❌ Create custom navigation - USE Expo Router file-based routing
- ❌ Store API key in AsyncStorage - USE expo-secure-store

## DO

- ✅ Import from existing modules
- ✅ Follow the screen template pattern above
- ✅ Use StyleSheet.create() for styles
- ✅ Use the colors and spacing tokens
- ✅ Handle loading/error/empty states
- ✅ Add proper TypeScript types
- ✅ Use SafeAreaView for screen containers

---

## Commands

```bash
npm start          # Start Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator  
npm run web        # Web browser
npx tsc --noEmit   # Type check
```

## Dependencies to Add

```bash
# If not already installed
npx expo install expo-secure-store
npx expo install expo-document-picker
npx expo install expo-clipboard
npx expo install react-native-safe-area-context
```
