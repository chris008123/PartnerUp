import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, AppState } from 'react-native';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../src/lib/firebase';
import { useAuth } from '../src/context/AuthContext';
import { authMessage } from '../src/lib/errors';
import Button from '../src/components/Button';
import { colors } from '../src/theme';

export default function VerifyEmail() {
  const { user, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // When the member comes back to the app after tapping the link, re-check automatically.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh().catch(() => {});
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function check() {
    setBusy(true);
    try {
      await refresh();
      if (!auth.currentUser?.emailVerified) {
        Alert.alert('Not verified yet', 'Open the link in the email we sent you, then tap this button again.');
      }
    } catch (e) {
      Alert.alert('Could not check', authMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!user || cooldown > 0) return;
    try {
      await sendEmailVerification(user);
      setCooldown(60);
      Alert.alert('Email sent', `We sent a new link to ${user.email}. Check your spam folder too.`);
    } catch (e) {
      Alert.alert('Could not send email', authMessage(e));
    }
  }

  return (
    <View style={s.wrap}>
      <View style={s.badge}><Text style={s.badgeText}>✉</Text></View>
      <Text style={s.title}>Verify your email</Text>
      <Text style={s.sub}>
        We sent a verification link to{'\n'}
        <Text style={s.email}>{user?.email}</Text>
        {'\n\n'}Open the email, tap the link, then come back here. Check your spam folder if you can't find it.
      </Text>

      <Button title="I've verified, continue" onPress={check} loading={busy} />
      <View style={{ height: 12 }} />
      <Button
        title={cooldown > 0 ? `Resend email (${cooldown}s)` : 'Resend email'}
        variant="outline"
        onPress={resend}
      />
      <Text style={s.out} onPress={() => signOut(auth)}>Use a different account</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' },
  badge: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  badgeText: { color: '#4ADE80', fontSize: 30 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, marginBottom: 28 },
  email: { color: colors.text, fontWeight: '700' },
  out: { color: colors.green, fontWeight: '700', textAlign: 'center', marginTop: 24 },
});
