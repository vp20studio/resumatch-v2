import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text, Button, Card } from '../../src/components/ui';
import { colors, spacing, borderRadius } from '../../src/theme';

export default function PaywallScreen() {
  const handlePurchase = (plan: string) => {
    // TODO: In production, integrate with RevenueCat/StoreKit
    // For now, just close the modal
    console.log('Purchase plan:', plan);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text variant="h2">✕</Text>
          </TouchableOpacity>
          <Text variant="displayLarge" align="center">✨</Text>
          <Text variant="h1" align="center">Upgrade to Pro</Text>
          <Text variant="body" color="secondary" align="center">
            Unlock unlimited resume tailoring and premium features
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem checked title="Unlimited tailored resumes" />
          <FeatureItem checked title="AI-powered cover letters" />
          <FeatureItem checked title="Advanced keyword matching" />
          <FeatureItem checked title="Application tracking" />
          <FeatureItem checked title="Export to PDF" />
          <FeatureItem checked title="Priority support" />
        </View>

        <View style={styles.plans}>
          <PlanCard
            title="Weekly"
            price="$4.99"
            period="/week"
            onPress={() => handlePurchase('weekly')}
          />
          <PlanCard
            title="Annual"
            price="$49.99"
            period="/year"
            badge="Best Value"
            highlighted
            onPress={() => handlePurchase('annual')}
          />
        </View>

        <Text variant="caption" color="tertiary" align="center" style={styles.terms}>
          Cancel anytime. Subscription renews automatically.
          By subscribing, you agree to our Terms and Privacy Policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ checked, title }: { checked: boolean; title: string }) {
  return (
    <View style={styles.featureItem}>
      <Text variant="body" color={colors.success.main}>
        {checked ? '✓' : '○'}
      </Text>
      <Text variant="body">{title}</Text>
    </View>
  );
}

function PlanCard({
  title,
  price,
  period,
  badge,
  highlighted,
  onPress,
}: {
  title: string;
  price: string;
  period: string;
  badge?: string;
  highlighted?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Card
        variant={highlighted ? 'elevated' : 'outlined'}
        padding={4}
        style={[styles.planCard, highlighted && styles.highlightedPlan]}
      >
        {badge && (
          <View style={styles.badge}>
            <Text variant="caption" color={colors.neutral[0]}>
              {badge}
            </Text>
          </View>
        )}
        <Text variant="label" color="secondary">{title}</Text>
        <View style={styles.priceRow}>
          <Text variant="displayMedium">{price}</Text>
          <Text variant="body" color="secondary">{period}</Text>
        </View>
        <Button
          fullWidth
          variant={highlighted ? 'primary' : 'outline'}
          onPress={onPress}
        >
          Subscribe
        </Button>
      </Card>
    </TouchableOpacity>
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
    gap: spacing[3],
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: spacing[2],
  },
  features: {
    gap: spacing[3],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  plans: {
    gap: spacing[4],
  },
  planCard: {
    gap: spacing[3],
    position: 'relative',
  },
  highlightedPlan: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: spacing[4],
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
  },
  terms: {
    paddingHorizontal: spacing[4],
  },
});
