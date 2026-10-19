import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { Link } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { authMessage } from '../../src/lib/errors';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { colors } from '../../src/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  async function submit() {
    const e: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Enter your password.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      Alert.alert('Could not sign in', authMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <View style={s.badge}><Text style={s.badgeText}>+</Text></View>
        <Text style={s.title}>Welcome back</Text>
        <Text style={s.sub}>Sign in to continue your partnerships</Text>

        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@example.com" error={errors.email} />
        <Input label="Password" value={password} onChangeText={setPassword} secure placeholder="Your password" error={errors.password} />

        <Link href="/(auth)/forgot-password" style={s.forgot}>Forgot password?</Link>
        <Button title="Sign in" onPress={submit} loading={loading} />

        <Text style={s.footer}>
          New here? <Link href="/(auth)/sign-up" style={s.link}>Create account</Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  wrap: { padding: 24, paddingTop: 90 },
  badge: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  badgeText: { color: '#4ADE80', fontSize: 28, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 28 },
  forgot: { color: colors.green, fontWeight: '600', textAlign: 'right', marginBottom: 20, fontSize: 13 },
  footer: { textAlign: 'center', color: colors.muted, marginTop: 22, fontSize: 14 },
  link: { color: colors.green, fontWeight: '700' },
});
