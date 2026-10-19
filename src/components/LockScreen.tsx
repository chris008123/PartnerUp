import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as LocalAuth from 'expo-local-authentication';
import Logo from './Logo';
import Button from './Button';
import { colors } from '../theme';

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const unlock = async () => {
    const r = await LocalAuth.authenticateAsync({ promptMessage: 'Unlock Partner Up' });
    if (r.success) onUnlock();
  };
  useEffect(() => { unlock(); }, []);
  return (
    <View style={s.wrap}>
      <Logo size={34} />
      <Text style={s.text}>Partner Up is locked</Text>
      <View style={{ width: 200, marginTop: 20 }}>
        <Button title="Unlock" onPress={unlock} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  text: { color: '#B9D3BC', marginTop: 18, fontSize: 14 },
});
