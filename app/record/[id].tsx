import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, Modal, StyleSheet, Alert } from 'react-native';
import { goBack } from '../../src/lib/nav';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../src/lib/firebase';
import { useRecords } from '../../src/context/RecordsContext';
import { formatGHS } from '../../src/lib/money';
import StatusChip from '../../src/components/StatusChip';
import Button from '../../src/components/Button';
import { colors } from '../../src/theme';

export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { records } = useRecords();
  const router = useRouter();
  const [zoom, setZoom] = useState(false);
  const r = records.find((x) => x.id === id);

  if (!r) {
    return (
      <View style={[s.wrap, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.muted, marginBottom: 16 }}>This record is no longer available.</Text>
        <View style={{ width: 160 }}><Button title="Go back" onPress={() => goBack(router)} /></View>
      </View>
    );
  }

  const verified = r.status === 'VERIFIED';
  const confirmDelete = () =>
    Alert.alert('Delete record?', 'This removes the record from your list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          updateDoc(doc(db, 'records', r.id), { isDeleted: true, updatedAt: serverTimestamp() })
            .catch((e) => Alert.alert('Could not delete', e.message));
          goBack(router);
        },
      },
    ]);

  const rows: [string, string][] = [
    ['Category', r.categoryName],
    ['Date', format(r.date, 'EEEE, d MMMM yyyy')],
    ['Method', r.method],
    ...(verified ? [['Verified by', `${r.verifiedByName || 'Finance team'}${r.verifiedAt ? ' · ' + format(r.verifiedAt, 'd MMM yyyy') : ''}`] as [string, string]] : []),
    ...(r.reference ? [['Reference', r.reference] as [string, string]] : []),
    ...(r.note ? [['Note', r.note] as [string, string]] : []),
  ];

  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}>
        <Pressable onPress={() => goBack(router)} hitSlop={12}><Text style={s.back}>‹ Back</Text></Pressable>
        <Text style={s.title}>Record detail</Text>

        {r.proofUrl ? (
          <Pressable onPress={() => setZoom(true)}>
            <Image source={{ uri: r.proofUrl }} style={s.proof} resizeMode="cover" />
            <Text style={s.hint}>Tap to enlarge</Text>
          </Pressable>
        ) : (
          <View style={[s.proof, s.noProof]}><Text style={{ color: colors.muted }}>No payment proof attached</Text></View>
        )}

        <View style={s.amountRow}>
          <Text style={s.amount}>{formatGHS(r.amount)}</Text>
          <StatusChip status={r.status} />
        </View>

        <View style={s.card}>
          {rows.map(([k, v], i) => (
            <View key={k} style={[s.row, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.key}>{k}</Text>
              <Text style={s.val}>{v}</Text>
            </View>
          ))}
        </View>

        {r.status === 'REJECTED' && <Text style={s.note}>This record was rejected{r.reviewNote ? `: ${r.reviewNote}` : '.'} Edit it and save to resubmit for verification.</Text>}
        {verified && <Text style={s.note}>Verified records can't be deleted, and amount and date are locked. Contact your finance officer if something is wrong.</Text>}

        <View style={s.actions}>
          <View style={{ flex: 1 }}>
            <Button title="Edit" variant="outline" onPress={() => router.push({ pathname: '/add-record', params: { id: r.id } })} />
          </View>
          {!verified && (
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Pressable style={s.delete} onPress={confirmDelete}><Text style={s.deleteText}>Delete</Text></Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)}>
        <Pressable style={s.modal} onPress={() => setZoom(false)}>
          {r.proofUrl && <Image source={{ uri: r.proofUrl }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />}
          <Text style={{ color: colors.white, marginTop: 12 }}>Tap anywhere to close</Text>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  back: { color: colors.green, fontWeight: '700', fontSize: 15 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 10, marginBottom: 16 },
  proof: { width: '100%', height: 200, borderRadius: 14, backgroundColor: colors.border },
  noProof: { alignItems: 'center', justifyContent: 'center' },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 6 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 14 },
  amount: { fontSize: 30, fontWeight: '800', color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  key: { color: colors.muted, fontSize: 14 },
  val: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 16 },
  note: { color: colors.muted, fontSize: 13, marginTop: 14, lineHeight: 19 },
  actions: { flexDirection: 'row', marginTop: 24 },
  delete: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.rejected },
  deleteText: { color: colors.rejected, fontWeight: '700', fontSize: 16 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
});
