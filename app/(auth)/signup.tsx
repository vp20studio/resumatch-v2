import { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Text, Button, Card } from '../../src/components/ui';
import { colors, spacing, borderRadius, textStyles } from '../../src/theme';
import { useAuthStore } from '../../src/stores';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const signUpWithEmail = useAuthStore((state) => state.signUpWithEmail);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const setError = useAuthStore((state) => state.setError);

  const handleSignUp = async () => {
    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const success = await signUpWithEmail(email.trim(), password, name.trim());

    if (success) {
      // Navigate to onboarding for new users
      router.replace('/(onboarding)/welcome');
    }
  };

  const handleLogin = () => {
    setError(null);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text variant="h1">Create Account</Text>
              <Text variant="body" color="secondary">
                Start your job search journey
              </Text>
            </View>

            <Card variant="filled" padding={4}>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text variant="label">Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor={colors.text.tertiary}
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setError(null);
                    }}
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text variant="label">Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.text.tertiary}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text variant="label">Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.text.tertiary}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError(null);
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text variant="label">Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password again"
                    placeholderTextColor={colors.text.tertiary}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setError(null);
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                {error && (
                  <Text variant="caption" color={colors.error.main}>
                    {error}
                  </Text>
                )}

                <Button
                  fullWidth
                  onPress={handleSignUp}
                  disabled={isLoading || !name.trim() || !email.trim() || !password.trim()}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </View>
            </Card>

            <View style={styles.footer}>
              <Text variant="body" color="secondary">
                Already have an account?
              </Text>
              <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
                <Text variant="body" color={colors.primary[600]} style={styles.link}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing[6],
    justifyContent: 'center',
    gap: spacing[6],
  },
  header: {
    alignItems: 'center',
    gap: spacing[2],
  },
  form: {
    gap: spacing[4],
  },
  inputGroup: {
    gap: spacing[2],
  },
  input: {
    ...textStyles.body,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.light,
    color: colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
  },
  link: {
    fontWeight: '600',
  },
});
