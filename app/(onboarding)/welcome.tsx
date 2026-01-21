import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ResuMatch</Text>
          <Text style={styles.subtitle}>
            Tailor your resume to any job in seconds
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="⚡"
            title="AI-Powered Matching"
            description="Instantly match your skills to job requirements"
          />
          <FeatureItem
            icon="🎯"
            title="Keyword Optimization"
            description="Beat ATS systems with targeted keywords"
          />
          <FeatureItem
            icon="✉️"
            title="Cover Letters"
            description="Generate tailored cover letters automatically"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(onboarding)/upload')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    gap: 12,
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
  },
  features: {
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 24,
    gap: 12,
  },
  button: {
    backgroundColor: '#CDFF64',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    marginTop: 8,
  },
});
