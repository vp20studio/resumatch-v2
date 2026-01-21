import { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Text, Button, Card } from '../../src/components/ui';
import { colors, spacing, borderRadius, textStyles } from '../../src/theme';
import { useAuthStore } from '../../src/stores';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const setError = useAuthStore((state) => state.setError);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    const success = await signInWithEmail(email.trim(), password);

    if (success) {
      // Navigation handled by app/index.tsx based on auth state
      router.replace('/');
    }
  };

  const handleSignUp = () => {
    setError(null);
    router.push('/(auth)/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="h1">Welcome Back</Text>
            <Text variant="body" color="secondary">
              Sign in to continue your job search
            </Text>
          </View>

          <Card variant="filled" padding={4}>
            <View style={styles.form}>
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
                  placeholder="Enter your password"
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

              {error && (
                <Text variant="caption" color={colors.error.main}>
                  {error}
                </Text>
              )}

              <Button
                fullWidth
                onPress={handleLogin}
                disabled={isLoading || !email.trim() || !password.trim()}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </View>
          </Card>

          <View style={styles.footer}>
            <Text variant="body" color="secondary">
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
              <Text variant="body" color={colors.primary[600]} style={styles.link}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
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
  keyboardView: {
    flex: 1,
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
