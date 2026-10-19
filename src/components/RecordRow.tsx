import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import StatusChip from './StatusChip';
import { formatGHS } from '../lib/money';
import { RecordDoc } from '../lib/types';
import { colors } from '../theme';

export default function RecordRow({ r, onPress }: { r: RecordDoc; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.amount}>{formatGHS(r.amount)}</Text>
        <Text style={s.meta}>{r.categoryName} · {format(r.date, 'd MMM')}</Text>
      </View>
      <StatusChip status={r.status} />
    </Pressable>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  amount: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
