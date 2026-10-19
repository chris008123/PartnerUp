import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { startOfWeek } from 'date-fns';
import { useTargets } from '../../src/lib/useTargets';
import { useProfile } from '../../src/lib/useProfile';
import { useAuth } from '../../src/context/AuthContext';
import { useRecords } from '../../src/context/RecordsContext';
import { formatGHS } from '../../src/lib/money';
import { monthTotal, pendingCount, weekStreak, targetProgress } from '../../src/lib/stats';
import RecordRow from '../../src/components/RecordRow';
import Button from '../../src/components/Button';
import { colors } from '../../src/theme';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function Home() {
  const { user } = useAuth();
  const { records } = useRecords();
  const router = useRouter();
  const monthly = useTargets().find((t) => t.period === 'monthly');
  const profile = useProfile();
  const target = monthly ? monthly.amountGoal : null;

  const total = monthTotal(records);
  const pct = monthly && target ? Math.min(100, Math.round((targetProgress(monthly, records) / target) * 100)) : null;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const showReminder = profile.weeklyReminder && !records.some((r) => r.date >= weekStart);
  const first = (user?.displayName || '').split(' ')[0];
  const streak = weekStreak(records);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={s.header}>
        <Text style={s.greet}>{greeting()}{first ? `, ${first}` : ''}</Text>
        <Text style={s.label}>This month</Text>
        <Text style={s.total}>{formatGHS(total)}</Text>
        {pct !== null ? (
          <>
            <Text style={s.sub}>{pct}% of {formatGHS(target!)} target</Text>
            <View style={s.track}><View style={[s.fill, { width: `${pct}%` }]} /></View>
          </>
        ) : (
          <Pressable onPress={() => router.push('/(tabs)/targets')}>
            <Text style={s.sub}>Set a monthly target to track your progress</Text>
          </Pressable>
        )}
      </View>

      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={s.statLabel}>Streak</Text>
          <Text style={s.statValue}>{streak} {streak === 1 ? 'week' : 'weeks'}</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statLabel}>Pending</Text>
          <Text style={s.statValue}>{pendingCount(records)}</Text>
        </View>
      </View>

      {showReminder && (
        <Pressable style={s.reminder} onPress={() => router.push('/add-record')}>
          <Text style={s.reminderText}>You haven't added a record this week. Tap to add one.</Text>
        </Pressable>
      )}

      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>Recent records</Text>
          <Pressable onPress={() => router.push('/(tabs)/records')}><Text style={s.link}>See all</Text></Pressable>
        </View>
        {records.length === 0 ? (
          <Text style={s.empty}>No records yet. Add your first partnership record.</Text>
        ) : (
          records.slice(0, 5).map((r) => <RecordRow key={r.id} r={r} onPress={() => router.push(`/record/${r.id}`)} />)
        )}
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Button title="+ Add record" onPress={() => router.push('/add-record')} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: colors.green, paddingTop: 64, paddingHorizontal: 22, paddingBottom: 54, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  greet: { color: '#B9D3BC', fontSize: 14 },
  label: { color: colors.white, fontSize: 20, fontWeight: '700', marginTop: 14 },
  total: { color: colors.white, fontSize: 36, fontWeight: '800', marginTop: 2 },
  sub: { color: '#B9D3BC', fontSize: 13, marginTop: 6, marginBottom: 10 },
  track: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)' },
  fill: { height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  stats: { flexDirection: 'row', paddingHorizontal: 20, marginTop: -30 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14, marginHorizontal: 5, borderWidth: 1, borderColor: colors.border },
  statLabel: { color: colors.muted, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 16, margin: 20, marginBottom: 16, paddingHorizontal: 16, paddingTop: 14, borderWidth: 1, borderColor: colors.border },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  link: { color: colors.green, fontWeight: '700', fontSize: 13 },
  reminder: { backgroundColor: colors.greenSoft, marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 12 },
  reminderText: { color: colors.green, fontSize: 13, fontWeight: '600' },
  empty: { color: colors.muted, paddingVertical: 22, textAlign: 'center' },
});
