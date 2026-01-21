#!/bin/bash

# ResuMatch v2 Overnight Build Script
# Uses Ralph Wiggum technique for autonomous Claude Code loops
#
# This script is tailored to YOUR existing codebase:
# - Uses your existing stores, components, and services
# - Extends rather than replaces
# - References specific files and patterns from your code

set -e

PROJECT_DIR="${1:-$(pwd)}"
LOG_DIR="$PROJECT_DIR/.build-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/build-$(date +%Y%m%d-%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ResuMatch v2 - Overnight Build       ║${NC}"
echo -e "${BLUE}║   Started: $(date '+%Y-%m-%d %H:%M:%S')          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_DIR" || { echo -e "${RED}Cannot access $PROJECT_DIR${NC}"; exit 1; }

echo -e "${YELLOW}Project: $PROJECT_DIR${NC}"
echo -e "${YELLOW}Log: $LOG_FILE${NC}"
echo ""

# Verify CLAUDE.md exists
if [ ! -f "CLAUDE.md" ]; then
    echo -e "${RED}ERROR: CLAUDE.md not found in project root${NC}"
    echo "Copy CLAUDE.md to your project root before running."
    exit 1
fi

# Verify key files exist
if [ ! -d "src/stores" ] || [ ! -d "src/services" ]; then
    echo -e "${RED}ERROR: Expected src/stores and src/services directories${NC}"
    echo "Make sure you're in the correct project directory."
    exit 1
fi

echo -e "${GREEN}✓ Pre-flight checks passed${NC}"
echo ""

# ==============================================================================
# PHASE 1: Onboarding
# ==============================================================================

PHASE1_PROMPT='Read CLAUDE.md thoroughly first - it documents the existing codebase.

PHASE 1: Build Onboarding Flow

CRITICAL: Use EXISTING code:
- Import stores from src/stores
- Import components from src/components/ui  
- Import theme from src/theme
- DO NOT create new state management

Tasks:
1. Install: npx expo install expo-secure-store expo-clipboard

2. Update src/stores/authStore.ts:
   - Add apiKey (stored in expo-secure-store, NOT AsyncStorage)
   - Add hasCompletedOnboarding boolean
   - Add setApiKey, clearApiKey, completeOnboarding actions

3. Create app/index.tsx:
   - Check hasCompletedOnboarding
   - Redirect to /(onboarding)/welcome or /(tabs)/generate

4. Create app/(onboarding)/_layout.tsx - simple Stack

5. Create app/(onboarding)/welcome.tsx:
   - "ResuMatch" heading, tagline, 3 benefits
   - "Get Started" button
   - Use colors.primary[600], Text component

6. Create app/(onboarding)/api-key.tsx:
   - Explain OpenAI requirement
   - Secure input for API key
   - Verify button that calls initializeOpenAI() and tests connection
   - Save with setApiKey on success

7. Create app/(onboarding)/resume-upload.tsx:
   - Multiline input for pasting resume
   - "Paste from Clipboard" using expo-clipboard
   - Save to resumeStore.setRawText()
   - Call completeOnboarding(), navigate to tabs

Verify: App starts at welcome, flows through all screens, saves data, skips onboarding on restart.

Output <promise>PHASE1_COMPLETE</promise> when working.'

echo -e "${BLUE}━━━ Phase 1: Onboarding ━━━${NC}"
echo "Starting at $(date '+%H:%M:%S')"
claude -p "/ralph-wiggum:ralph-loop '$PHASE1_PROMPT' --max-iterations 30 --completion-promise 'PHASE1_COMPLETE'" 2>&1 | tee -a "$LOG_FILE"
echo ""

# ==============================================================================
# PHASE 2: Generate Flow
# ==============================================================================

PHASE2_PROMPT='Read CLAUDE.md first.

PHASE 2: Build Generate Flow

CRITICAL: The tailoring algorithm EXISTS in src/services/tailoring/
- Import { tailorResume } from src/services/tailoring
- Use generationStore for state (status, progress, result, error)
- Use resumeStore for rawText
- DO NOT reimplement the algorithm

Tasks:
1. Create app/(tabs)/generate.tsx:
   - Show resume summary from resumeStore
   - Job description input (multiline)
   - "Paste from Clipboard" button
   - "Generate" button (disabled if no resume or JD)
   - When generating: show progress from generationStore.progress
   - On success: navigate to /(modals)/result
   - On error: show error with retry

   Generation handler:
   ```
   const result = await tailorResume(rawText, jobDescription, setProgress);
   setResult(result);
   router.push("/(modals)/result");
   ```

2. Create app/(modals)/_layout.tsx - Stack with modal presentation

3. Create app/(modals)/result.tsx:
   - Match score display (big number, colored by score)
   - Tabs: Resume | Cover Letter
   - ScrollView with formatted content
   - Copy button using expo-clipboard
   - Show matchedItems and missingItems in collapsible section

Verify: Can paste JD, generate (takes 5-8 sec), see results, copy text.

Output <promise>PHASE2_COMPLETE</promise> when working.'

echo -e "${BLUE}━━━ Phase 2: Generate Flow ━━━${NC}"
echo "Starting at $(date '+%H:%M:%S')"
claude -p "/ralph-wiggum:ralph-loop '$PHASE2_PROMPT' --max-iterations 40 --completion-promise 'PHASE2_COMPLETE'" 2>&1 | tee -a "$LOG_FILE"
echo ""

# ==============================================================================
# PHASE 3: History & Profile
# ==============================================================================

PHASE3_PROMPT='Read CLAUDE.md first.

PHASE 3: History & Profile Screens

Tasks:
1. Create src/stores/historyStore.ts:
   - Zustand with persist (AsyncStorage)
   - items: HistoryItem[] with id, jobTitle, company, matchScore, result, createdAt
   - addItem, removeItem, clearHistory actions
   - Export from src/stores/index.ts

2. Update generate flow to save to history after success:
   - Extract job title and company from JD (simple parsing)
   - Call historyStore.addItem()

3. Create app/(tabs)/history.tsx:
   - FlatList of history items
   - Each shows: job title, company, score badge, relative date
   - Tap: load into generationStore, navigate to result modal
   - Empty state if no history

4. Create app/(tabs)/profile.tsx:
   - Resume preview card with edit button
   - API Key setting (masked)
   - Clear History button (with confirmation)
   - Reset App button (clear all, return to onboarding)
   - App version info

5. Create app/(modals)/edit-resume.tsx:
   - Edit resume text
   - Save/Cancel buttons

6. Create src/components/ui/ConfirmDialog.tsx for destructive actions

7. Create src/utils/formatDate.ts for relative dates

Verify: History saves after generation, can view old results, profile shows data, reset works.

Output <promise>PHASE3_COMPLETE</promise> when working.'

echo -e "${BLUE}━━━ Phase 3: History & Profile ━━━${NC}"
echo "Starting at $(date '+%H:%M:%S')"
claude -p "/ralph-wiggum:ralph-loop '$PHASE3_PROMPT' --max-iterations 45 --completion-promise 'PHASE3_COMPLETE'" 2>&1 | tee -a "$LOG_FILE"
echo ""

# ==============================================================================
# PHASE 4: Polish
# ==============================================================================

PHASE4_PROMPT='Read CLAUDE.md first.

PHASE 4: Polish & Refinements

Tasks:
1. Install: npx expo install expo-haptics

2. Create LoadingOverlay component - full screen with spinner

3. Create ErrorState component - error message with retry button

4. Add animations using React Native Animated:
   - Fade in screens on mount
   - Smooth progress updates during generation
   - Match score count-up animation

5. Add haptic feedback:
   - Button presses: Haptics.impactAsync(Light)
   - Generation complete: Haptics.notificationAsync(Success)
   - Copy: Haptics.impactAsync(Light)

6. Create Toast component for copy feedback

7. Add KeyboardAvoidingView to all form screens

8. Add pull-to-refresh on History screen

9. Add accessibility labels to interactive elements

10. Visual consistency check:
    - All colors from theme
    - Consistent spacing
    - Proper safe area handling
    - Loading states everywhere needed

Verify: Animations smooth, haptics fire, copy shows toast, keyboard handled.

Output <promise>PHASE4_COMPLETE</promise> when polished.'

echo -e "${BLUE}━━━ Phase 4: Polish ━━━${NC}"
echo "Starting at $(date '+%H:%M:%S')"
claude -p "/ralph-wiggum:ralph-loop '$PHASE4_PROMPT' --max-iterations 35 --completion-promise 'PHASE4_COMPLETE'" 2>&1 | tee -a "$LOG_FILE"
echo ""

# ==============================================================================
# Complete
# ==============================================================================

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Build Complete                       ║${NC}"
echo -e "${BLUE}║   Finished: $(date '+%Y-%m-%d %H:%M:%S')          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Check log: cat $LOG_FILE | grep -E '(COMPLETE|error|Error)'"
echo "  2. Type check: npx tsc --noEmit"
echo "  3. Run app: npx expo start"
echo "  4. Review changes: git diff --stat"
echo ""
echo -e "${GREEN}Good luck! 🚀${NC}"
