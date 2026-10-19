import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.active]}>
      <Text style={[s.text, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}
const s = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, marginRight: 8, marginBottom: 8 },
  active: { backgroundColor: colors.green, borderColor: colors.green },
  text: { fontSize: 13, fontWeight: '600', color: colors.text },
});
