import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Text, Button } from '../../src/components/ui';
import { colors, spacing, borderRadius, textStyles } from '../../src/theme';
import { useResumeStore } from '../../src/stores';
import { parseResume } from '../../src/services/tailoring';

export default function EditResumeScreen() {
  const resumeText = useResumeStore((state) => state.rawText);
  const setRawText = useResumeStore((state) => state.setRawText);
  const setParsedData = useResumeStore((state) => state.setParsedData);
  const setUploadSource = useResumeStore((state) => state.setUploadSource);

  const [text, setText] = useState(resumeText);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(text !== resumeText);
  }, [text, resumeText]);

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await Clipboard.getStringAsync();
      if (clipboardText) {
        setText(clipboardText);
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
    }
  };

  const handleSave = () => {
    if (text.trim().length < 50) return;

    // Save the raw text
    setRawText(text.trim());
    setUploadSource('paste');

    // Parse and save the parsed data
    const parsed = parseResume(text.trim());
    setParsedData(parsed);

    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  const isValid = text.trim().length >= 50;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text variant="body" color="secondary">Cancel</Text>
        </TouchableOpacity>
        <Text variant="h2" align="center">Edit Resume</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={!isValid || !hasChanges}
        >
          <Text
            variant="body"
            color={isValid && hasChanges ? colors.primary[600] : 'tertiary'}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.actions}>
            <Button
              variant="secondary"
              size="sm"
              onPress={handlePasteFromClipboard}
            >
              Paste from Clipboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setText('')}
              disabled={text.length === 0}
            >
              Clear
            </Button>
          </View>

          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Paste or type your resume text here..."
            placeholderTextColor={colors.text.tertiary}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            autoFocus={!resumeText}
          />

          {text.length > 0 && text.length < 50 && (
            <Text variant="caption" color={colors.warning.main}>
              Resume should be at least 50 characters
            </Text>
          )}

          {text.length >= 50 && (
            <Text variant="caption" color="secondary">
              {text.length} characters
            </Text>
          )}
        </ScrollView>

        {/* Footer with save button */}
        <View style={styles.footer}>
          <Button
            fullWidth
            disabled={!isValid || !hasChanges}
            onPress={handleSave}
          >
            Save Changes
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerButton: {
    minWidth: 60,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    padding: spacing[4],
    gap: spacing[3],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  textArea: {
    ...textStyles.body,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    minHeight: 400,
    color: colors.text.primary,
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});
