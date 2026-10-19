import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

type Props = { title: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'outline' };

export default function Button({ title, onPress, loading, variant = 'primary' }: Props) {
  const outline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        s.btn,
        outline ? s.outline : s.primary,
        (pressed || loading) && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={outline ? colors.green : colors.white} />
      ) : (
        <Text style={[s.text, { color: outline ? colors.green : colors.white }]}>{title}</Text>
      )}
    </Pressable>
  );
}
const s = StyleSheet.create({
  btn: { height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.green },
  outline: { borderWidth: 1.5, borderColor: colors.green, backgroundColor: 'transparent' },
  text: { fontSize: 16, fontWeight: '700' },
});
