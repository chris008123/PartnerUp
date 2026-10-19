import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, StyleSheet, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, updateDoc, doc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../src/lib/firebase';
import { useAuth } from '../src/context/AuthContext';
import { useRecords } from '../src/context/RecordsContext';
import { useCategories } from '../src/lib/useCategories';
import { toPesewas } from '../src/lib/money';
import { monthKeyOf } from '../src/lib/stats';
import { uploadProof } from '../src/lib/upload';
import Button from '../src/components/Button';
import Chip from '../src/components/Chip';
import { colors } from '../src/theme';

const METHODS = ['MTN Mobile Money', 'Telecel Cash', 'AirtelTigo Money', 'Bank transfer', 'Cash'];

export default function AddRecord() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { records } = useRecords();
  const editing = id ? records.find((r) => r.id === id) : undefined;
  const locked = editing?.status === 'VERIFIED';
  const baseCats = useCategories();
  const cats = !editing || baseCats.some((c) => c.id === editing.categoryId)
    ? baseCats : [...baseCats, { id: editing.categoryId, name: editing.categoryName }];

  const [amount, setAmount] = useState(editing ? (editing.amount / 100).toFixed(2) : '');
  const [catId, setCatId] = useState(editing?.categoryId ?? '');
  const [date, setDate] = useState(editing?.date ?? new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [method, setMethod] = useState(editing?.method ?? METHODS[0]);
  const [proof, setProof] = useState<string | null>(editing?.proofUrl ?? null);
  const [note, setNote] = useState(editing?.note ?? '');
  const [errors, setErrors] = useState<{ amount?: string; cat?: string }>({});
  const [saving, setSaving] = useState(false);

  const onAmount = (t: string) => {
    let v = t.replace(/[^0-9.]/g, '');
    const i = v.indexOf('.');
    if (i !== -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '').slice(0, 2);
    setAmount(v);
  };

  async function pick(camera: boolean) {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow access in your phone settings to add proof.');
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5 };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled) setProof(res.assets[0].uri);
  }
  const addProof = () =>
    Alert.alert('Payment proof', 'Add a screenshot or photo of the receipt.', [
      { text: 'Take photo', onPress: () => pick(true) },
      { text: 'Choose from gallery', onPress: () => pick(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  async function save() {
    const e: typeof errors = {};
    const pesewas = toPesewas(amount);
    if (pesewas <= 0) e.amount = 'Enter an amount greater than 0.';
    if (!catId) e.cat = 'Choose a category.';
    setErrors(e);
    if (Object.keys(e).length || !user) return;
    setSaving(true);
    try {
      const isLocal = !!proof && !proof.startsWith('http');
      const proofUrl = isLocal ? await uploadProof(proof!) : proof;
      const cat = cats.find((c) => c.id === catId)!;
      const fail = (err: any) => Alert.alert('Could not save record', err.message);
      // Not awaited on purpose: offline saves are kept locally and sync later.
      if (editing) {
        const patch = locked
          ? { note: note.trim(), proofUrl, updatedAt: serverTimestamp() }
          : {
              categoryId: cat.id, categoryName: cat.name, amount: pesewas,
              date: Timestamp.fromDate(date), monthKey: monthKeyOf(date), method,
              note: note.trim(), proofUrl, updatedAt: serverTimestamp(),
              ...(editing.status === 'REJECTED' ? { status: 'PENDING' } : {}), // resubmit
            };
        updateDoc(doc(db, 'records', editing.id), patch).catch(fail);
      } else {
        addDoc(collection(db, 'records'), {
          userId: user.uid, categoryId: cat.id, categoryName: cat.name,
          amount: pesewas, date: Timestamp.fromDate(date), monthKey: monthKeyOf(date),
          method, reference: '', note: note.trim(), proofUrl,
          status: 'PENDING', verifiedBy: null, verifiedAt: null, isDeleted: false,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        }).catch(fail);
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Could not save record', err?.message ?? 'Please try again.');
      setSaving(false);
    }
  }

  const noop = () => {};
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <View style={s.top}>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={s.close}>Cancel</Text></Pressable>
          <Text style={s.title}>{editing ? 'Edit record' : 'Add record'}</Text>
          <View style={{ width: 50 }} />
        </View>

        {locked && <Text style={s.lockNote}>This record is verified. Only the note and proof can be changed.</Text>}

        <Text style={s.label}>Amount</Text>
        <View style={[s.amountBox, !!errors.amount && { borderColor: colors.rejected }, locked && s.dim]}>
          <Text style={s.cedi}>GH₵</Text>
          <TextInput value={amount} onChangeText={onAmount} editable={!locked} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.muted} style={s.amountInput} />
        </View>
        {!!errors.amount && <Text style={s.error}>{errors.amount}</Text>}

        <Text style={s.label}>Category</Text>
        <View style={[s.wrapRow, locked && s.dim]}>{cats.map((c) => <Chip key={c.id} label={c.name} active={catId === c.id} onPress={locked ? noop : () => setCatId(c.id)} />)}</View>
        {!!errors.cat && <Text style={s.error}>{errors.cat}</Text>}

        <Text style={s.label}>Date</Text>
        <Pressable style={[s.field, locked && s.dim]} disabled={locked} onPress={() => setShowPicker(true)}>
          <Text style={s.fieldText}>{format(date, 'EEEE, d MMMM yyyy')}</Text>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={date} mode="date" maximumDate={new Date()}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, d) => { if (Platform.OS !== 'ios') setShowPicker(false); if (d) setDate(d); }}
          />
        )}

        <Text style={s.label}>Payment method</Text>
        <View style={[s.wrapRow, locked && s.dim]}>{METHODS.map((m) => <Chip key={m} label={m} active={method === m} onPress={locked ? noop : () => setMethod(m)} />)}</View>

        <Text style={s.label}>Payment proof (optional)</Text>
        {proof ? (
          <View>
            <Image source={{ uri: proof }} style={s.proof} />
            <Pressable onPress={() => setProof(null)}><Text style={s.remove}>Remove photo</Text></Pressable>
          </View>
        ) : (
          <Pressable style={s.upload} onPress={addProof}><Text style={s.uploadText}>Upload payment proof</Text></Pressable>
        )}

        <Text style={s.label}>Note (optional)</Text>
        <TextInput value={note} onChangeText={setNote} placeholder="Reference or note" placeholderTextColor={colors.muted} style={[s.field, { color: colors.text }]} />

        <View style={{ height: 22 }} />
        <Button title={editing ? 'Save changes' : 'Save record'} onPress={save} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingTop: 24, paddingBottom: 48 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  close: { color: colors.green, fontWeight: '700', width: 50 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  lockNote: { backgroundColor: colors.greenSoft, color: colors.green, padding: 12, borderRadius: 10, fontSize: 13, marginTop: 8 },
  dim: { opacity: 0.55 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 18, marginBottom: 8 },
  amountBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, height: 64 },
  cedi: { fontSize: 22, fontWeight: '800', color: colors.muted, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '800', color: colors.text },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap' },
  field: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, height: 48, justifyContent: 'center' },
  fieldText: { color: colors.text, fontSize: 15 },
  upload: { height: 90, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.green, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenSoft },
  uploadText: { color: colors.green, fontWeight: '700' },
  proof: { width: '100%', height: 200, borderRadius: 12, backgroundColor: colors.border },
  remove: { color: colors.rejected, fontWeight: '700', marginTop: 8 },
  error: { color: colors.rejected, fontSize: 12, marginTop: 2 },
});
