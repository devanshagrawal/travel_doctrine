import React from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { Button, Field } from '../../src/components/ui';
import { colors, font, spacing } from '../../src/theme';

export default function Login() {
  const router = useRouter();
  const login = useStore((s) => s.login);
  const loginAsDemo = useStore((s) => s.loginAsDemo);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const onLogin = () => {
    login(email.trim());
    router.replace('/(app)/(tabs)');
  };
  const onDemo = () => {
    loginAsDemo();
    router.replace('/(app)/(tabs)');
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
            <Field label="Password" icon="lock-closed-outline" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />

            <Pressable style={{ alignSelf: 'flex-end', marginBottom: spacing.md }}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>

            <Button label="Log in" onPress={onLogin} full />
            <Button label="Continue as demo" variant="secondary" onPress={onDemo} full style={{ marginTop: spacing.sm }} />

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

const styles = StyleSheet.create({
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
});
