import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuth from 'expo-local-authentication';
import { auth, db } from '../../src/lib/firebase';
import { useAuth } from '../../src/context/AuthContext';
import { useProfile } from '../../src/lib/useProfile';
import { useIsAdmin } from '../../src/lib/useIsAdmin';
import Button from '../../src/components/Button';
import ReminderSettings from '../../src/components/ReminderSettings';
import { colors } from '../../src/theme';

const initials = (n?: string | null) => (n || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

function Row({ title, open, onPress, children }: { title: string; open?: boolean; onPress: () => void; children?: React.ReactNode }) {
  return (
    <View style={s.item}>
      <Pressable style={s.row} onPress={onPress}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.chev}>{open ? '⌃' : '›'}</Text>
      </Pressable>
      {open && <View style={s.body}>{children}</View>}
    </View>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const profile = useProfile();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [cell, setCell] = useState('');
  const [bio, setBio] = useState(false);
  const toggle = (k: string) => setOpen((o) => (o === k ? null : k));

  useEffect(() => { setCell(profile.cellName); }, [profile.cellName]);
  useEffect(() => { SecureStore.getItemAsync('biometricLock').then((v) => setBio(!!v)).catch(() => {}); }, []);

  const merge = (data: object) => {
    if (!user) return;
    setDoc(doc(db, 'users', user.uid), data, { merge: true }).catch((e) => Alert.alert('Could not save', e.message));
  };

  async function toggleBio(on: boolean) {
    if (on) {
      const ok = (await LocalAuth.hasHardwareAsync()) && (await LocalAuth.isEnrolledAsync());
      if (!ok) return Alert.alert('Not available', 'Set up Face ID, a fingerprint, or a screen lock on your phone first.');
      const r = await LocalAuth.authenticateAsync({ promptMessage: 'Confirm to turn on app lock' });
      if (!r.success) return;
      await SecureStore.setItemAsync('biometricLock', '1');
    } else {
      await SecureStore.deleteItemAsync('biometricLock');
    }
    setBio(on);
  }

  async function changePassword() {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert('Check your email', `We sent a password reset link to ${user.email}.`);
    } catch { Alert.alert('Could not send link', 'Please try again.'); }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}>
      <View style={s.head}>
        <View style={s.avatar}><Text style={s.avatarText}>{initials(user?.displayName)}</Text></View>
        <Text style={s.name}>{user?.displayName || 'Your profile'}</Text>
        <Text style={s.email}>{profile.cellName ? `${profile.cellName} · ` : ''}{user?.email}</Text>
      </View>

      <View style={s.card}>
        <Row title="My cell" open={open === 'cell'} onPress={() => toggle('cell')}>
          <TextInput value={cell} onChangeText={setCell} placeholder="Your cell or group name" placeholderTextColor={colors.muted} style={s.input} />
          <View style={{ marginTop: 10 }}><Button title="Save" onPress={() => { merge({ cellName: cell.trim() }); setOpen(null); }} /></View>
        </Row>
        <Row title="My targets" onPress={() => router.push('/(tabs)/targets')} />
        {isAdmin && <Row title="Verify records (admin)" onPress={() => router.push('/admin')} />}
        <Row title="Notifications" open={open === 'notif'} onPress={() => toggle('notif')}>
          <ReminderSettings />
        </Row>
        <Row title="Security" open={open === 'sec'} onPress={() => toggle('sec')}>
          <View style={s.switchRow}>
            <Text style={s.help}>Lock the app with Face ID, fingerprint or screen lock</Text>
            <Switch value={bio} onValueChange={toggleBio} trackColor={{ true: colors.greenMid }} />
          </View>
          <View style={{ marginTop: 12 }}><Button title="Change password" variant="outline" onPress={changePassword} /></View>
        </Row>
        <Row title="Help & support" open={open === 'help'} onPress={() => toggle('help')}>
          <Text style={s.help}>
            Add a record each time you give, then attach your payment proof. A finance officer verifies it and its status changes from Pending to Verified.{'\n\n'}Need help? Contact your church office.
          </Text>
        </Row>
      </View>

      <Button title="Sign out" variant="outline" onPress={() => signOut(auth)} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  head: { alignItems: 'center', marginBottom: 22 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 24, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 12 },
  email: { color: colors.muted, marginTop: 3, fontSize: 13 },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 22 },
  item: { borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  chev: { fontSize: 20, color: colors.muted },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, backgroundColor: colors.bg },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  help: { color: colors.muted, fontSize: 13, lineHeight: 19, flex: 1, marginRight: 12 },
});
