import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDoc, updateDoc, deleteDoc, doc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../src/lib/firebase';
import { useAuth } from '../src/context/AuthContext';
import { useTargets } from '../src/lib/useTargets';
import { useCategories } from '../src/lib/useCategories';
import { toPesewas } from '../src/lib/money';
import Button from '../src/components/Button';
import Chip from '../src/components/Chip';
import { colors } from '../src/theme';

const PERIODS = [['monthly', 'Monthly'], ['yearly', 'Yearly'], ['custom', 'Custom range']] as const;

export default function TargetForm() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = useTargets().find((t) => t.id === id);
  const cats = useCategories();

  const [name, setName] = useState(editing?.name ?? '');
  const [amount, setAmount] = useState(editing ? (editing.amountGoal / 100).toFixed(2) : '');
  const [period, setPeriod] = useState<'monthly' | 'yearly' | 'custom'>(editing?.period ?? 'monthly');
  const [start, setStart] = useState(editing?.startDate ?? new Date());
  const [end, setEnd] = useState(editing?.endDate ?? new Date());
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);
  const [catId, setCatId] = useState<string | null>(editing?.categoryId ?? null);
  const [errors, setErrors] = useState<{ name?: string; amount?: string; range?: string }>({});
  const [saving, setSaving] = useState(false);

  const onAmount = (t: string) => {
    let v = t.replace(/[^0-9.]/g, '');
    const i = v.indexOf('.');
    if (i !== -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '').slice(0, 2);
    setAmount(v);
  };

  function save() {
    const e: typeof errors = {};
    const goal = toPesewas(amount);
    if (name.trim().length < 2) e.name = 'Give your target a name.';
    if (goal <= 0) e.amount = 'Enter an amount greater than 0.';
    if (period === 'custom' && end < start) e.range = 'End date must be after the start date.';
    setErrors(e);
    if (Object.keys(e).length || !user) return;
    setSaving(true);
    const cat = cats.find((c) => c.id === catId);
    const data = {
      name: name.trim(), amountGoal: goal, period,
      startDate: period === 'custom' ? Timestamp.fromDate(start) : null,
      endDate: period === 'custom' ? Timestamp.fromDate(end) : null,
      categoryId: cat?.id ?? null, categoryName: cat?.name ?? null,
    };
    const fail = (err: any) => Alert.alert('Could not save target', err.message);
    if (editing) updateDoc(doc(db, 'targets', editing.id), data).catch(fail);
    else addDoc(collection(db, 'targets'), { ...data, userId: user.uid, createdAt: serverTimestamp() }).catch(fail);
    router.back();
  }

  const remove = () =>
    Alert.alert('Delete target?', 'Your records are not affected.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteDoc(doc(db, 'targets', editing!.id)).catch(() => {}); router.back(); } },
    ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <View style={s.top}>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={s.close}>Cancel</Text></Pressable>
          <Text style={s.title}>{editing ? 'Edit target' : 'New target'}</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={s.label}>Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Monthly partnership" placeholderTextColor={colors.muted} style={[s.field, !!errors.name && s.err]} />
        {!!errors.name && <Text style={s.error}>{errors.name}</Text>}

        <Text style={s.label}>Goal amount</Text>
        <View style={[s.field, s.amountRow, !!errors.amount && s.err]}>
          <Text style={s.cedi}>GH₵</Text>
          <TextInput value={amount} onChangeText={onAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.muted} style={s.amountInput} />
        </View>
        {!!errors.amount && <Text style={s.error}>{errors.amount}</Text>}

        <Text style={s.label}>Period</Text>
        <View style={s.wrapRow}>{PERIODS.map(([k, l]) => <Chip key={k} label={l} active={period === k} onPress={() => setPeriod(k)} />)}</View>

        {period === 'custom' && (
          <View>
            <View style={{ flexDirection: 'row' }}>
              <Pressable style={[s.field, { flex: 1, marginRight: 8 }]} onPress={() => setPicking('start')}><Text style={s.fieldText}>From {format(start, 'd MMM yyyy')}</Text></Pressable>
              <Pressable style={[s.field, { flex: 1 }]} onPress={() => setPicking('end')}><Text style={s.fieldText}>To {format(end, 'd MMM yyyy')}</Text></Pressable>
            </View>
            {!!errors.range && <Text style={s.error}>{errors.range}</Text>}
            {picking && (
              <DateTimePicker
                value={picking === 'start' ? start : end} mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_, d) => { const which = picking; if (Platform.OS !== 'ios') setPicking(null); if (d) (which === 'start' ? setStart : setEnd)(d); }}
              />
            )}
          </View>
        )}

        <Text style={s.label}>Count only one category? (optional)</Text>
        <View style={s.wrapRow}>
          <Chip label="All categories" active={catId === null} onPress={() => setCatId(null)} />
          {cats.map((c) => <Chip key={c.id} label={c.name} active={catId === c.id} onPress={() => setCatId(c.id)} />)}
        </View>

        <View style={{ height: 22 }} />
        <Button title={editing ? 'Save changes' : 'Create target'} onPress={save} loading={saving} />
        {editing && (
          <Pressable onPress={remove} style={{ marginTop: 18 }}><Text style={s.delete}>Delete target</Text></Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingTop: 24, paddingBottom: 48 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  close: { color: colors.green, fontWeight: '700', width: 50 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 18, marginBottom: 8 },
  field: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, height: 48, justifyContent: 'center', color: colors.text },
  fieldText: { color: colors.text, fontSize: 14 },
  err: { borderColor: colors.rejected },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  cedi: { fontSize: 16, fontWeight: '800', color: colors.muted, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap' },
  error: { color: colors.rejected, fontSize: 12, marginTop: 4 },
  delete: { color: colors.rejected, fontWeight: '700', textAlign: 'center' },
});
