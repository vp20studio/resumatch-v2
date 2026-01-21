import { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { Text, Button, Card, StepIndicator } from '../../src/components/ui';
import { colors, spacing, borderRadius, textStyles } from '../../src/theme';
import { useResumeStore } from '../../src/stores';
import { extractTextFromPDF, isValidPDF } from '../../src/services/pdfService';

type UploadMethod = 'file' | 'paste' | null;
type ProcessingStatus = 'idle' | 'picking' | 'processing' | 'error';

export default function UploadScreen() {
  const [method, setMethod] = useState<UploadMethod>(null);
  const [pastedText, setPastedText] = useState('');
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [processingMessage, setProcessingMessage] = useState('');

  const setRawText = useResumeStore((state) => state.setRawText);
  const setUploadSource = useResumeStore((state) => state.setUploadSource);

  const handleFilePick = async () => {
    try {
      setStatus('picking');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setStatus('idle');
        return;
      }

      if (!result.assets[0]) {
        setStatus('idle');
        return;
      }

      const file = result.assets[0];

      // Handle text files directly
      if (file.mimeType === 'text/plain') {
        const content = await FileSystem.readAsStringAsync(file.uri);
        if (content.trim().length < 50) {
          Alert.alert('Invalid File', 'The file appears to be empty or too short.');
          setStatus('idle');
          return;
        }
        setRawText(content);
        setUploadSource('file');
        router.push('/(onboarding)/goals');
        return;
      }

      // Handle PDF files
      if (file.mimeType === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
        setStatus('processing');
        setProcessingMessage('Reading PDF file...');

        try {
          // Read file as base64
          const base64Content = await FileSystem.readAsStringAsync(file.uri, {
            encoding: 'base64',
          });

          // Validate it's a real PDF
          if (!isValidPDF(base64Content)) {
            Alert.alert('Invalid PDF', 'The file does not appear to be a valid PDF document.');
            setStatus('idle');
            return;
          }

          setProcessingMessage('Extracting text from PDF...');

          // Extract text using OpenAI
          const extractedText = await extractTextFromPDF(base64Content);

          if (extractedText.trim().length < 50) {
            throw new Error('Could not extract sufficient text from the PDF.');
          }

          setRawText(extractedText);
          setUploadSource('file');
          router.push('/(onboarding)/goals');
        } catch (error) {
          console.error('PDF processing error:', error);
          setStatus('error');

          // Offer to paste text instead
          Alert.alert(
            'PDF Processing Failed',
            'We couldn\'t extract text from your PDF. Would you like to paste your resume text instead?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setStatus('idle') },
              { text: 'Paste Text', onPress: () => {
                setStatus('idle');
                setMethod('paste');
              }},
            ]
          );
          return;
        }
        return;
      }

      // Handle Word docs - prompt to paste for now
      if (file.mimeType === 'application/msword' ||
          file.name?.toLowerCase().endsWith('.doc') ||
          file.name?.toLowerCase().endsWith('.docx')) {
        Alert.alert(
          'Word Documents',
          'Word document support is coming soon. Please paste your resume text instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Paste Text', onPress: () => setMethod('paste') },
          ]
        );
        setStatus('idle');
        return;
      }

      // Unknown format
      Alert.alert('Unsupported Format', 'Please upload a PDF or TXT file, or paste your resume text.');
      setStatus('idle');
    } catch (error) {
      console.error('File pick error:', error);
      Alert.alert('Error', 'Failed to read the file. Please try again.');
      setStatus('idle');
    }
  };

  const handlePasteSubmit = () => {
    if (pastedText.trim().length > 50) {
      setRawText(pastedText.trim());
      setUploadSource('paste');
      router.push('/(onboarding)/goals');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setPastedText(text);
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
    }
  };

  const isLoading = status === 'picking' || status === 'processing';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <StepIndicator
          currentStep={1}
          totalSteps={3}
          labels={['Resume', 'Goals', 'Complete']}
        />

        <View style={styles.header}>
          <Text variant="h1" align="center">
            Add Your Resume
          </Text>
          <Text variant="body" color="secondary" align="center">
            We'll use this to match your experience to job descriptions
          </Text>
        </View>

        {/* Processing State */}
        {status === 'processing' && (
          <Card variant="filled" padding={6}>
            <View style={styles.processingContent}>
              <Text variant="h2" align="center">Processing PDF</Text>
              <Text variant="body" color="secondary" align="center">
                {processingMessage}
              </Text>
              <Text variant="caption" color="tertiary" align="center">
                This may take a few seconds...
              </Text>
            </View>
          </Card>
        )}

        {/* Options - only show when not processing */}
        {!method && status !== 'processing' && (
          <View style={styles.options}>
            <Card variant="outlined" padding={6}>
              <View style={styles.optionContent}>
                <Text variant="h2">Upload PDF</Text>
                <Text variant="bodySmall" color="secondary">
                  PDF or TXT format
                </Text>
                <Button
                  variant="primary"
                  onPress={handleFilePick}
                  loading={isLoading}
                  disabled={isLoading}
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
                  disabled={isLoading}
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
            <Button
              variant="secondary"
              onPress={handlePasteFromClipboard}
              fullWidth
            >
              Paste from Clipboard
            </Button>
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
  processingContent: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
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
