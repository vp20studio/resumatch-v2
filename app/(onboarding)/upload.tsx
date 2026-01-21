import { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Text, Button, Card, StepIndicator } from '../../src/components/ui';
import { colors, spacing, borderRadius, textStyles } from '../../src/theme';
import { useResumeStore } from '../../src/stores';

type UploadMethod = 'file' | 'paste' | null;

export default function UploadScreen() {
  const [method, setMethod] = useState<UploadMethod>(null);
  const [pastedText, setPastedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const setRawText = useResumeStore((state) => state.setRawText);
  const setUploadSource = useResumeStore((state) => state.setUploadSource);

  const handleFilePick = async () => {
    try {
      setIsLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        // For now, we'll handle text files. PDF parsing would require additional library
        if (file.mimeType === 'text/plain') {
          const content = await FileSystem.readAsStringAsync(file.uri);
          setRawText(content);
          setUploadSource('file');
          router.push('/(onboarding)/complete');
        } else {
          // For PDFs, we'd need a PDF parser - for now, prompt paste
          setMethod('paste');
        }
      }
    } catch (error) {
      console.error('File pick error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteSubmit = () => {
    if (pastedText.trim().length > 50) {
      setRawText(pastedText.trim());
      setUploadSource('paste');
      router.push('/(onboarding)/complete');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <StepIndicator
          currentStep={1}
          totalSteps={2}
          labels={['Upload Resume', 'Complete']}
        />

        <View style={styles.header}>
          <Text variant="h1" align="center">
            Add Your Resume
          </Text>
          <Text variant="body" color="secondary" align="center">
            We'll use this to match your experience to job descriptions
          </Text>
        </View>

        {!method && (
          <View style={styles.options}>
            <Card variant="outlined" padding={6}>
              <View style={styles.optionContent}>
                <Text variant="h2">Upload File</Text>
                <Text variant="bodySmall" color="secondary">
                  PDF, DOC, or TXT format
                </Text>
                <Button
                  variant="primary"
                  onPress={handleFilePick}
                  loading={isLoading}
                  style={styles.optionButton}
                >
                  Choose File
                </Button>
              </View>
            </Card>

            <Text variant="body" color="tertiary" align="center">
              or
            </Text>

            <Card variant="outlined" padding={6}>
              <View style={styles.optionContent}>
                <Text variant="h2">Paste Text</Text>
                <Text variant="bodySmall" color="secondary">
                  Copy and paste your resume content
                </Text>
                <Button
                  variant="secondary"
                  onPress={() => setMethod('paste')}
                  style={styles.optionButton}
                >
                  Paste Resume
                </Button>
              </View>
            </Card>
          </View>
        )}

        {method === 'paste' && (
          <View style={styles.pasteSection}>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Paste your resume text here..."
              placeholderTextColor={colors.text.tertiary}
              value={pastedText}
              onChangeText={setPastedText}
              textAlignVertical="top"
            />
            <View style={styles.pasteActions}>
              <Button
                variant="ghost"
                onPress={() => {
                  setMethod(null);
                  setPastedText('');
                }}
              >
                Back
              </Button>
              <Button
                disabled={pastedText.trim().length < 50}
                onPress={handlePasteSubmit}
              >
                Continue
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    padding: spacing[6],
    gap: spacing[8],
  },
  header: {
    gap: spacing[2],
    marginTop: spacing[4],
  },
  options: {
    gap: spacing[4],
  },
  optionContent: {
    alignItems: 'center',
    gap: spacing[2],
  },
  optionButton: {
    marginTop: spacing[3],
  },
  pasteSection: {
    gap: spacing[4],
  },
  textArea: {
    ...textStyles.body,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    minHeight: 300,
    color: colors.text.primary,
  },
  pasteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
