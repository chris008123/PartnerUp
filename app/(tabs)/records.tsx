import React, { useMemo, useState } from 'react';
import { View, Text, SectionList, TextInput, ScrollView, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useRecords } from '../../src/context/RecordsContext';
import { formatGHS } from '../../src/lib/money';
import RecordRow from '../../src/components/RecordRow';
import Chip from '../../src/components/Chip';
import { colors } from '../../src/theme';

const monthDate = (key: string) => { const [y, m] = key.split('-').map(Number); return new Date(y, m - 1, 1); };

export default function Records() {
  const { records, loading } = useRecords();
  const router = useRouter();
  const [month, setMonth] = useState('ALL');
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('ALL');

  const catNames = useMemo(() => Array.from(new Set(records.map((r) => r.categoryName))), [records]);
  const months = useMemo(() => Array.from(new Set(records.map((r) => r.monthKey))), [records]);

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = records.filter((r) => {
      if (month !== 'ALL' && r.monthKey !== month) return false;
      if (cat !== 'ALL' && r.categoryName !== cat) return false;
      if (!q) return true;
      return (
        r.categoryName.toLowerCase().includes(q) ||
        (r.note || '').toLowerCase().includes(q) ||
        formatGHS(r.amount).toLowerCase().includes(q)
      );
    });
    const map = new Map<string, typeof list>();
    list.forEach((r) => map.set(r.monthKey, [...(map.get(r.monthKey) || []), r]));
    return Array.from(map.entries()).map(([key, data]) => ({ key, title: format(monthDate(key), 'MMMM yyyy'), data }));
  }, [records, month, cat, search]);

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Records</Text>
      <TextInput value={search} onChangeText={setSearch} placeholder="Search by category, note or amount" placeholderTextColor={colors.muted} style={s.search} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 6 }}>
        <Chip label="All" active={month === 'ALL'} onPress={() => setMonth('ALL')} />
        {months.map((m) => (
          <Chip key={m} label={format(monthDate(m), 'MMM yyyy')} active={month === m} onPress={() => setMonth(m)} />
        ))}
      </ScrollView>
      {catNames.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 6 }}>
          <Chip label="All categories" active={cat === 'ALL'} onPress={() => setCat('ALL')} />
          {catNames.map((c) => <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />)}
        </ScrollView>
      )}
      <SectionList
        sections={sections}
        keyExtractor={(r) => r.id}
        renderSectionHeader={({ section }) => <Text style={s.section}>{section.title}</Text>}
        renderItem={({ item }) => <RecordRow r={item} onPress={() => router.push(`/record/${item.id}`)} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={s.empty}>
            {loading ? 'Loading your records…' : records.length ? 'No records match your search.' : 'No records yet. Tap Home, then Add record.'}
          </Text>
        }
      />
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingTop: 64, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 14 },
  search: { height: 46, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, marginBottom: 12, color: colors.text },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 14, marginBottom: 2 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 48 },
});
