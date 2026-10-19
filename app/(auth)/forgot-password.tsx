import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { authMessage } from '../../src/lib/errors';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { colors } from '../../src/theme';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Check your email', 'We sent a link to reset your password.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/sign-in') },
      ]);
    } catch (err) {
      Alert.alert('Could not send link', authMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Reset password</Text>
      <Text style={s.sub}>Enter your email and we will send you a reset link.</Text>
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@example.com" error={error} />
      <Button title="Send reset link" onPress={submit} loading={loading} />
      <Link href="/(auth)/sign-in" style={s.back}>Back to sign in</Link>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 90 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.muted, marginTop: 6, marginBottom: 26 },
  back: { textAlign: 'center', color: colors.green, fontWeight: '700', marginTop: 22 },
});
