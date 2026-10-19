import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useRecords } from '../../src/context/RecordsContext';
import { useTargets } from '../../src/lib/useTargets';
import { targetProgress } from '../../src/lib/stats';
import { formatGHS } from '../../src/lib/money';
import ProgressBar from '../../src/components/ProgressBar';
import Button from '../../src/components/Button';
import { Target } from '../../src/lib/types';
import { colors } from '../../src/theme';

const periodLabel = (t: Target) =>
  t.period === 'monthly' ? 'This month' : t.period === 'yearly' ? 'This year'
  : `${t.startDate ? format(t.startDate, 'd MMM') : ''} – ${t.endDate ? format(t.endDate, 'd MMM yyyy') : ''}`;

export default function Targets() {
  const { records } = useRecords();
  const targets = useTargets();
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}>
      <Text style={s.title}>Targets</Text>
      <Text style={s.sub}>Track your giving goals</Text>

      {targets.length === 0 && <Text style={s.empty}>No targets yet. Create one to see your progress on Home.</Text>}

      {targets.map((t) => {
        const done = targetProgress(t, records);
        const pct = t.amountGoal ? Math.round((done / t.amountGoal) * 100) : 0;
        return (
          <Pressable key={t.id} style={s.card} onPress={() => router.push({ pathname: '/target', params: { id: t.id } })}>
            <View style={s.head}>
              <Text style={s.name}>{t.name}</Text>
              <Text style={s.pct}>{pct}%</Text>
            </View>
            <Text style={s.meta}>{periodLabel(t)}{t.categoryName ? ` · ${t.categoryName}` : ''}</Text>
            <View style={{ marginVertical: 10 }}><ProgressBar pct={pct} color={pct >= 100 ? colors.verified : colors.greenMid} /></View>
            <Text style={s.amount}>{formatGHS(done)} of {formatGHS(t.amountGoal)}</Text>
            {pct >= 100 && <Text style={s.done}>Target reached. Well done!</Text>}
          </Pressable>
        );
      })}

      <View style={{ marginTop: 8 }}><Button title="+ New target" onPress={() => router.push('/target')} /></View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 20 },
  empty: { color: colors.muted, textAlign: 'center', marginVertical: 32 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1 },
  pct: { fontSize: 15, fontWeight: '800', color: colors.green },
  meta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  amount: { color: colors.text, fontSize: 14, fontWeight: '600' },
  done: { color: colors.verified, fontWeight: '700', fontSize: 12, marginTop: 6 },
});
