import { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Text, Button, Card, Toast } from '../../src/components/ui';
import { colors, spacing, borderRadius } from '../../src/theme';
import { useGenerationStore, useResumeStore, useHistoryStore, useGoalsStore } from '../../src/stores';
import {
  generateResumePDF,
  generateCoverLetterPDF,
  sharePDF,
  isSharingAvailable,
} from '../../src/services/exportService';

type Tab = 'resume' | 'coverLetter';

export default function ResultScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [hasPromptedApplied, setHasPromptedApplied] = useState(false);

  const result = useGenerationStore((state) => state.result);
  const reset = useGenerationStore((state) => state.reset);
  const parsedData = useResumeStore((state) => state.parsedData);
  const historyItems = useHistoryStore((state) => state.items);
  const markAsApplied = useHistoryStore((state) => state.markAsApplied);
  const recordApplication = useGoalsStore((state) => state.recordApplication);

  if (!result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="h2">No results available</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success.main;
    if (score >= 60) return colors.warning.main;
    return colors.error.main;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Needs Improvement';
  };

  // AI Detection helpers - FIXED LOGIC
  const getAIDetectionStatus = (aiScore: number) => {
    // aiScore is the percentage of AI-detected content (0-100)
    // Lower is better (more human)
    if (aiScore < 30) return { label: 'Human-like', color: colors.success.main, passing: true };
    if (aiScore < 50) return { label: 'Mostly Human', color: colors.success.main, passing: true };
    if (aiScore < 70) return { label: 'Mixed', color: colors.warning.main, passing: false };
    return { label: 'AI Detected', color: colors.error.main, passing: false };
  };

  const getAIScoreDisplay = (aiScore: number) => {
    // Show as "Human Score" = 100 - AI Score
    // But clarify what it means
    const humanScore = 100 - aiScore;
    return {
      value: humanScore,
      label: humanScore >= 50 ? 'Human Score' : 'AI Content',
      displayValue: humanScore >= 50 ? `${humanScore}%` : `${aiScore}%`,
    };
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  // Find the most recent history item with status 'generated' (the one we just created)
  const currentHistoryItem = historyItems.find(
    (item) => item.status === 'generated' && item.result === result
  ) || historyItems.find((item) => item.status === 'generated');

  const promptMarkAsApplied = () => {
    if (hasPromptedApplied || !currentHistoryItem) return;

    setHasPromptedApplied(true);

    Alert.alert(
      'Mark as Applied?',
      'Did you apply to this job? This helps track your progress and maintain your streak!',
      [
        {
          text: 'Not Yet',
          style: 'cancel',
        },
        {
          text: 'Yes, I Applied!',
          onPress: () => {
            markAsApplied(currentHistoryItem.id);
            recordApplication();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToastMessage('Great job! Application tracked!');
          },
        },
      ]
    );
  };

  const handleCopy = async () => {
    const content = activeTab === 'resume'
      ? result.resume.rawText
      : result.coverLetter;

    try {
      await Clipboard.setStringAsync(content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToastMessage('Copied to clipboard!');

      // Prompt to mark as applied after copying
      setTimeout(() => promptMarkAsApplied(), 500);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Check if sharing is available
      const available = await isSharingAvailable();
      if (!available) {
        Alert.alert('Export Unavailable', 'PDF sharing is not available on this device.');
        return;
      }

      setIsExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      let pdfUri: string;

      if (activeTab === 'resume') {
        // Generate resume PDF
        pdfUri = await generateResumePDF(result.resume, {
          name: parsedData?.contact?.name,
          email: parsedData?.contact?.email,
          phone: parsedData?.contact?.phone,
        });
      } else {
        // Generate cover letter PDF
        // Try to extract job title from matched items or use default
        const jobTitle = result.matchedItems[0]?.requirement?.text?.substring(0, 50) || undefined;
        pdfUri = await generateCoverLetterPDF(
          result.coverLetter,
          jobTitle,
          undefined,
          {
            name: parsedData?.contact?.name,
            email: parsedData?.contact?.email,
            phone: parsedData?.contact?.phone,
          }
        );
      }

      // Share the PDF
      await sharePDF(pdfUri, activeTab === 'resume' ? 'Tailored_Resume.pdf' : 'Cover_Letter.pdf');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Prompt to mark as applied after exporting
      setTimeout(() => promptMarkAsApplied(), 500);
    } catch (error) {
      console.error('Export error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Export Failed',
        'Failed to generate PDF. Please try copying the text instead.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    reset();
    router.back();
  };

  const handleNewGeneration = () => {
    reset();
    router.replace('/(tabs)/generate');
  };

  // Get AI detection display info
  const aiScore = result.aiDetection?.score ?? 0;
  const aiStatus = getAIDetectionStatus(aiScore);
  const aiDisplay = getAIScoreDisplay(aiScore);

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast notification */}
      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        type="success"
      />

      {/* Header with close button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text variant="h2" color="secondary">✕</Text>
        </TouchableOpacity>
        <Text variant="h2" align="center">Results</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Match Score */}
      <View style={styles.scoreSection}>
        <Text
          variant="displayLarge"
          style={[styles.scoreNumber, { color: getScoreColor(result.matchScore) }]}
        >
          {result.matchScore}%
        </Text>
        <Text variant="body" color="secondary">
          {getScoreLabel(result.matchScore)}
        </Text>
        <Text variant="caption" color="tertiary">
          Processed in {(result.processingTime / 1000).toFixed(1)}s
        </Text>

        {/* Application Status */}
        {currentHistoryItem && (
          currentHistoryItem.status === 'applied' || currentHistoryItem.status === 'interviewing' || currentHistoryItem.status === 'offer' ? (
            <View style={styles.appliedBadge}>
              <Text variant="caption" style={styles.appliedBadgeText}>
                {currentHistoryItem.status === 'applied' && '✓ Applied'}
                {currentHistoryItem.status === 'interviewing' && '🎯 Interviewing'}
                {currentHistoryItem.status === 'offer' && '🎉 Offer Received!'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.markAppliedButton}
              onPress={() => {
                markAsApplied(currentHistoryItem.id);
                recordApplication();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showToastMessage('Great job! Application tracked!');
              }}
            >
              <Text variant="caption" style={styles.markAppliedText}>
                Mark as Applied
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TabButton
          label="Resume"
          active={activeTab === 'resume'}
          onPress={() => setActiveTab('resume')}
        />
        <TabButton
          label="Cover Letter"
          active={activeTab === 'coverLetter'}
          onPress={() => setActiveTab('coverLetter')}
        />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card variant="outlined" padding={4}>
          <Text variant="body" style={styles.contentText}>
            {activeTab === 'resume'
              ? result.resume.rawText
              : result.coverLetter}
          </Text>
        </Card>

        {/* Match summary (for resume tab) */}
        {activeTab === 'resume' && (
          <Card variant="filled" padding={4}>
            <Text variant="label" style={styles.summaryTitle}>Match Summary</Text>
            <View style={styles.summaryRow}>
              <Text variant="body" style={{ color: colors.success.main }}>
                ✓ {result.matchedItems.length} matched
              </Text>
              <Text variant="body" color="tertiary">•</Text>
              <Text variant="body" style={{ color: colors.error.main }}>
                ✗ {result.missingItems.length} gaps
              </Text>
            </View>
          </Card>
        )}

        {/* AI Detection Score for Cover Letter - FIXED */}
        {activeTab === 'coverLetter' && result.aiDetection && (
          <Card
            variant="filled"
            padding={4}
            style={[
              styles.aiDetectionCard,
              aiStatus.passing ? styles.aiDetectionPassing : styles.aiDetectionWarning,
            ]}
          >
            <View style={styles.aiDetectionHeader}>
              <Text variant="label" style={styles.aiDetectionLabel}>
                AI Detection
              </Text>
              <View
                style={[
                  styles.aiDetectionBadge,
                  { backgroundColor: aiStatus.color + '20' },
                ]}
              >
                <Text
                  variant="caption"
                  style={[styles.aiDetectionBadgeText, { color: aiStatus.color }]}
                >
                  {aiStatus.label}
                </Text>
              </View>
            </View>
            
            <View style={styles.aiDetectionScore}>
              <Text variant="h2" style={{ color: aiStatus.color }}>
                {100 - aiScore}%
              </Text>
              <Text variant="caption" color="secondary">
                Human Score
              </Text>
            </View>
            
            {/* Clearer explanation */}
            <Text variant="bodySmall" color="secondary" align="center">
              {result.aiDetection.feedback}
            </Text>
            
            {/* Help text if failing */}
            {!aiStatus.passing && (
              <Text variant="caption" color="tertiary" align="center" style={styles.helpText}>
                Tip: Make small personal edits to improve the score
              </Text>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Footer actions */}
      <View style={styles.footer}>
        <Button
          variant="outline"
          onPress={handleCopy}
          style={styles.footerButton}
        >
          Copy
        </Button>
        <Button
          variant="outline"
          onPress={handleExportPDF}
          disabled={isExporting}
          loading={isExporting}
          style={styles.footerButton}
        >
          Export PDF
        </Button>
        <Button
          onPress={handleNewGeneration}
          style={styles.footerButton}
        >
          New
        </Button>
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.tab, active && styles.activeTab]}
      activeOpacity={0.7}
    >
      <Text
        variant="label"
        color={active ? colors.primary[600] : 'secondary'}
      >
        {label}
      </Text>
    </TouchableOpacity>
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
  closeButton: {
    padding: spacing[2],
    width: 40,
  },
  placeholder: {
    width: 40,
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    gap: spacing[1],
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 72,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
  },
  activeTab: {
    backgroundColor: colors.primary[50],
  },
  scroll: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  contentText: {
    lineHeight: 24,
  },
  summaryTitle: {
    marginBottom: spacing[2],
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  footer: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  footerButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  appliedBadge: {
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.success.main + '20',
    borderRadius: borderRadius.full,
  },
  appliedBadgeText: {
    color: colors.success.main,
    fontWeight: '600',
  },
  markAppliedButton: {
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[600],
  },
  markAppliedText: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  aiDetectionCard: {
    gap: spacing[2],
  },
  aiDetectionPassing: {
    backgroundColor: colors.success.main + '10',
    borderWidth: 1,
    borderColor: colors.success.main + '30',
  },
  aiDetectionWarning: {
    backgroundColor: colors.warning.main + '10',
    borderWidth: 1,
    borderColor: colors.warning.main + '30',
  },
  aiDetectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiDetectionLabel: {
    color: colors.text.secondary,
  },
  aiDetectionBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  aiDetectionBadgeText: {
    fontWeight: '600',
    fontSize: 11,
  },
  aiDetectionScore: {
    alignItems: 'center',
    gap: spacing[1],
  },
  helpText: {
    marginTop: spacing[1],
    fontStyle: 'italic',
  },
});
