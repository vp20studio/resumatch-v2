import { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { Text, Button, Card } from '../../src/components/ui';
import { colors, spacing, borderRadius } from '../../src/theme';
import { useGenerationStore } from '../../src/stores';

type Tab = 'resume' | 'coverLetter';

export default function PreviewScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const result = useGenerationStore((state) => state.result);

  if (!result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="h2">No preview available</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    const content = activeTab === 'resume'
      ? result.resume.rawText
      : result.coverLetter;

    try {
      await Share.share({
        message: content,
        title: activeTab === 'resume' ? 'Tailored Resume' : 'Cover Letter',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopy = () => {
    // Would use Clipboard API
    console.log('Copy to clipboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text variant="h2">✕</Text>
        </TouchableOpacity>
        <Text variant="h1" align="center">Preview</Text>
        <View style={styles.placeholder} />
      </View>

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

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card variant="outlined" padding={4}>
          <Text variant="body" style={styles.previewText}>
            {activeTab === 'resume'
              ? result.resume.rawText
              : result.coverLetter}
          </Text>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button variant="outline" onPress={handleCopy}>
          Copy
        </Button>
        <Button onPress={handleShare}>
          Share
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
  return (
    <TouchableOpacity
      onPress={onPress}
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
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    padding: spacing[4],
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
  },
  previewText: {
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
});
