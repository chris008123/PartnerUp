import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { Link } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../src/lib/firebase';
import { authMessage } from '../../src/lib/errors';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { colors } from '../../src/theme';

export default function SignUp() {
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address.';
    if (f.phone.trim().length < 9) e.phone = 'Enter a valid phone number.';
    if (f.password.length < 6) e.password = 'Use at least 6 characters.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email.trim(), f.password);
      await updateProfile(cred.user, { displayName: f.name.trim() });
      sendEmailVerification(cred.user).catch(() => {}); // member can resend from the verify screen
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: f.name.trim(),
        email: f.email.trim().toLowerCase(),
        phone: f.phone.trim(),
        cellId: null,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      Alert.alert('Could not create account', authMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Create account</Text>
        <Text style={s.sub}>Start tracking your partnerships</Text>
        <Input label="Full name" value={f.name} onChangeText={set('name')} autoCapitalize="words" placeholder="Your name" error={errors.name} />
        <Input label="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" placeholder="you@example.com" error={errors.email} />
        <Input label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="024 000 0000" error={errors.phone} />
        <Input label="Password" value={f.password} onChangeText={set('password')} secure placeholder="At least 6 characters" error={errors.password} />
        <View style={{ height: 6 }} />
        <Button title="Create account" onPress={submit} loading={loading} />
        <Text style={s.footer}>
          Already have an account? <Link href="/(auth)/sign-in" style={s.link}>Sign in</Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  wrap: { padding: 24, paddingTop: 80 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.muted, marginTop: 6, marginBottom: 26 },
  footer: { textAlign: 'center', color: colors.muted, marginTop: 22, fontSize: 14 },
  link: { color: colors.green, fontWeight: '700' },
});
