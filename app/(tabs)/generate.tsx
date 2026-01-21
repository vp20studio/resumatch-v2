import { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  Text,
  Button,
  Card,
  ScoreGauge,
  ProgressRing,
  MatchItem,
  MissingItem,
} from '../../src/components/ui';
import { colors, spacing, borderRadius, textStyles } from '../../src/theme';
import { useGenerationStore, useResumeStore, useApplicationsStore } from '../../src/stores';
import { tailorResume } from '../../src/services/tailoring';
import { initializeOpenAI } from '../../src/services/ai/client';

export default function GenerateScreen() {
  const [jdText, setJdText] = useState('');

  const {
    status,
    progress,
    result,
    error,
    startGeneration,
    setProgress,
    setResult,
    setError,
    reset,
  } = useGenerationStore();

  const resumeText = useResumeStore((state) => state.rawText);
  const addApplication = useApplicationsStore((state) => state.addApplication);

  const handleGenerate = async () => {
    if (!jdText.trim() || !resumeText) return;

    // Initialize OpenAI (in production, get key from env/secure storage)
    // initializeOpenAI(process.env.OPENAI_API_KEY);

    startGeneration();

    try {
      const tailoringResult = await tailorResume(resumeText, jdText, (p) => {
        setProgress(p);
      });

      setResult(tailoringResult);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSave = () => {
    if (!result) return;

    addApplication({
      jobTitle: result.matchedItems[0]?.requirement.text || 'Position',
      company: 'Company', // Would extract from JD
      matchScore: result.matchScore,
      tailoredResume: result.resume.rawText,
      coverLetter: result.coverLetter,
      jobDescription: jdText,
    });

    reset();
    setJdText('');
    router.push('/(tabs)/history');
  };

  // Render based on status
  if (status === 'generating') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.generatingContainer}>
          <ProgressRing
            progress={progress?.progress ?? 0}
            size={120}
            status={progress?.message}
          />
          <Text variant="h2" align="center" style={styles.generatingTitle}>
            Tailoring Your Resume
          </Text>
          <Text variant="body" color="secondary" align="center">
            This usually takes 5-8 seconds
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'success' && result) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.resultHeader}>
            <ScoreGauge score={result.matchScore} />
            <Text variant="body" color="secondary" align="center">
              Processed in {(result.processingTime / 1000).toFixed(1)}s
            </Text>
          </View>

          <Card variant="outlined" padding={4}>
            <Text variant="h3">Matched Qualifications</Text>
            <View style={styles.matchList}>
              {result.matchedItems.slice(0, 5).map((match, i) => (
                <MatchItem
                  key={i}
                  requirement={match.requirement.text}
                  matchedContent={match.originalText}
                  score={match.score}
                />
              ))}
            </View>
          </Card>

          {result.missingItems.length > 0 && (
            <Card variant="outlined" padding={4}>
              <Text variant="h3">Gaps to Address</Text>
              <View style={styles.matchList}>
                {result.missingItems.slice(0, 3).map((missing, i) => (
                  <MissingItem
                    key={i}
                    requirement={missing.requirement.text}
                    isRequired={missing.requirement.importance === 'critical'}
                  />
                ))}
              </View>
            </Card>
          )}

          <View style={styles.actions}>
            <Button variant="outline" onPress={() => router.push('/(modals)/preview')}>
              Preview Resume
            </Button>
            <Button onPress={handleSave}>
              Save Application
            </Button>
          </View>

          <Button variant="ghost" onPress={reset}>
            Start Over
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="h2" align="center">Something went wrong</Text>
          <Text variant="body" color="secondary" align="center">
            {error}
          </Text>
          <Button onPress={reset}>Try Again</Button>
        </View>
      </SafeAreaView>
    );
  }

  // Default: input form
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text variant="h1">Tailor Resume</Text>
            <Text variant="body" color="secondary">
              Paste the job description below to optimize your resume
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text variant="label">Job Description</Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Paste the full job description here..."
              placeholderTextColor={colors.text.tertiary}
              value={jdText}
              onChangeText={setJdText}
              textAlignVertical="top"
            />
          </View>

          <Button
            fullWidth
            disabled={jdText.trim().length < 50}
            onPress={handleGenerate}
          >
            Generate Tailored Resume
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    padding: spacing[6],
    gap: spacing[6],
  },
  header: {
    gap: spacing[2],
  },
  inputSection: {
    gap: spacing[2],
  },
  textArea: {
    ...textStyles.body,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    minHeight: 200,
    color: colors.text.primary,
  },
  generatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
    padding: spacing[6],
  },
  generatingTitle: {
    marginTop: spacing[4],
  },
  resultHeader: {
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  matchList: {
    gap: spacing[3],
    marginTop: spacing[3],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    padding: spacing[6],
  },
});
