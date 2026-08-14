import React from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field } from '../../src/components/ui';
import { font, spacing, Palette } from '../../src/theme';
import { useTheme } from '../../src/theme/useTheme';
import { useAuth } from '../../src/lib/auth';

export default function Login() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onLogin = async () => {
    if (busy) return;
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(app)/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Could not log in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.logo}>✈️</Text>
            <Text style={styles.brand}>Wander</Text>
            <Text style={styles.tagline}>Every trip, sorted in one place.</Text>
          </View>

          <View style={styles.form}>
            <Field label="Email" icon="mail-outline" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <Field label="Password" icon="lock-closed-outline" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={onLogin} />

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button label={busy ? 'Logging in…' : 'Log in'} onPress={onLogin} full disabled={busy} style={{ marginTop: spacing.sm }} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>New here? </Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable>
                  <Text style={styles.link}>Create an account</Text>
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
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  hero: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: { fontSize: 60 },
  brand: { fontSize: font.size.display, fontWeight: font.weight.bold, color: colors.text, marginTop: 4 },
  tagline: { fontSize: font.size.md, color: colors.textMuted, marginTop: 6 },
  form: {},
  link: { color: colors.primary, fontWeight: font.weight.semibold, fontSize: font.size.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { color: colors.textMuted, fontSize: font.size.sm },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  errorText: { color: colors.danger, fontSize: font.size.sm, flex: 1 },
});
