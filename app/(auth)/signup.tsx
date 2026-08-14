import React from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field } from '../../src/components/ui';
import { font, spacing, Palette } from '../../src/theme';
import { useTheme } from '../../src/theme/useTheme';
import { useAuth } from '../../src/lib/auth';
import { notify } from '../../src/lib/confirm';

export default function Signup() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSignup = async () => {
    if (busy) return;
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError('Fill in your name, email and a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(name.trim(), email.trim(), password);
      if (needsConfirmation) {
        notify('Check your email', 'We sent you a confirmation link. Tap it, then come back and log in.');
        router.replace('/(auth)/login');
      } else {
        router.replace('/(app)/(tabs)');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Link href="/(auth)/login" asChild>
            <Pressable hitSlop={10} style={styles.back}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </Link>

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Start planning your next adventure.</Text>

          <View style={{ marginTop: spacing.xl }}>
            <Field label="Full name" icon="person-outline" placeholder="Jane Traveller" value={name} onChangeText={setName} />
            <Field label="Email" icon="mail-outline" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <Field label="Password" icon="lock-closed-outline" placeholder="Create a password" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={onSignup} />

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button label={busy ? 'Creating…' : 'Sign up'} onPress={onSignup} full disabled={busy} style={{ marginTop: spacing.sm }} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={styles.link}>Log in</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: spacing.lg, left: spacing.lg },
  backText: { fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  title: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text },
  subtitle: { fontSize: font.size.md, color: colors.textMuted, marginTop: 6 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { color: colors.textMuted, fontSize: font.size.sm },
  link: { color: colors.primary, fontWeight: font.weight.semibold, fontSize: font.size.sm },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  errorText: { color: colors.danger, fontSize: font.size.sm, flex: 1 },
});
