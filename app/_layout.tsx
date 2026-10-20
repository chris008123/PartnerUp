import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { RecordsProvider } from '../src/context/RecordsContext';
import Splash from '../src/components/Splash';
import LockScreen from '../src/components/LockScreen';

function Gate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [minDelay, setMinDelay] = useState(true);
  const [locked, setLocked] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDelay(false), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user) { setLocked(false); setLockChecked(false); return; }
    SecureStore.getItemAsync('biometricLock')
      .then((v) => setLocked(!!v))
      .catch(() => {})
      .finally(() => setLockChecked(true));
  }, [user?.uid]);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    const inVerify = segments[0] === 'verify-email';
    if (!user) {
      if (!inAuth) router.replace('/(auth)/sign-in');
    } else if (!user.emailVerified) {
      if (!inVerify) router.replace('/verify-email');
    } else if (inAuth || inVerify) {
      router.replace('/(tabs)');
    }
  }, [user, user?.emailVerified, loading, segments]);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="add-record" options={{ presentation: 'modal' }} />
        <Stack.Screen name="target" options={{ presentation: 'modal' }} />
      </Stack>
      {user && locked && <LockScreen onUnlock={() => setLocked(false)} />}
      {(loading || minDelay || (user && !lockChecked)) && <Splash />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RecordsProvider>
        <Gate />
      </RecordsProvider>
    </AuthProvider>
  );
}
