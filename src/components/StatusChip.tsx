import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { Status } from '../lib/types';

const map = {
  VERIFIED: { label: 'Verified', color: colors.verified },
  PENDING: { label: 'Pending', color: colors.pending },
  REJECTED: { label: 'Rejected', color: colors.rejected },
};
export default function StatusChip({ status }: { status: Status }) {
  const m = map[status];
  return (
    <View style={s.row}>
      <View style={[s.dot, { backgroundColor: m.color }]} />
      <Text style={[s.text, { color: m.color }]}>{m.label}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  text: { fontSize: 12, fontWeight: '700' },
});
