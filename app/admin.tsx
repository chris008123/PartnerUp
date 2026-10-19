import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Modal, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../src/lib/firebase';
import { useAuth } from '../src/context/AuthContext';
import { useIsAdmin } from '../src/lib/useIsAdmin';
import { formatGHS } from '../src/lib/money';
import { RecordDoc } from '../src/lib/types';
import Button from '../src/components/Button';
import { colors } from '../src/theme';

export default function Admin() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const [items, setItems] = useState<RecordDoc[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<RecordDoc | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'records'), where('status', '==', 'PENDING'));
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs
          .map((d) => { const x: any = d.data(); return { ...x, id: d.id, date: x.date?.toDate?.() ?? new Date() } as RecordDoc; })
          .filter((r) => !r.isDeleted)
          .sort((a, b) => a.date.getTime() - b.date.getTime())
      );
    }, (e) => console.warn('admin queue', e.message));
  }, [isAdmin]);

  useEffect(() => {
    const missing = Array.from(new Set(items.map((i) => i.userId))).filter((u) => !(u in names));
    missing.forEach((uid) =>
      getDoc(doc(db, 'users', uid))
        .then((s) => { const x: any = s.data() || {}; setNames((n) => ({ ...n, [uid]: x.name ? `${x.name}${x.phone ? ' · ' + x.phone : ''}` : 'Member' })); })
        .catch(() => setNames((n) => ({ ...n, [uid]: 'Member' })))
    );
  }, [items]);

  function review(r: RecordDoc, status: 'VERIFIED' | 'REJECTED', reviewNote = '') {
    updateDoc(doc(db, 'records', r.id), {
      status, verifiedBy: user!.uid, verifiedByName: user!.displayName || 'Finance team',
      verifiedAt: serverTimestamp(), reviewNote, updatedAt: serverTimestamp(),
    }).catch((e) => Alert.alert('Could not update record', e.message));
  }

  const verify = (r: RecordDoc) =>
    Alert.alert('Verify this record?', `${formatGHS(r.amount)} from ${(names[r.userId] || 'member').split(' · ')[0]}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Verify', onPress: () => review(r, 'VERIFIED') },
    ]);

  const Header = (
    <View>
      <Pressable onPress={() => router.back()} hitSlop={12}><Text style={s.back}>‹ Back</Text></Pressable>
      <Text style={s.title}>Verify records</Text>
    </View>
  );

  if (isAdmin === null) return <View style={s.wrap}><View style={s.pad}>{Header}<Text style={s.muted}>Checking access…</Text></View></View>;
  if (!isAdmin) {
    return (
      <View style={s.wrap}><View style={s.pad}>{Header}
        <Text style={s.muted}>You don't have access to this screen. Ask the church office to add you as an admin.</Text>
      </View></View>
    );
  }

  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={[s.pad, { paddingBottom: 40 }]}>
        {Header}
        <Text style={s.sub}>{items.length} awaiting review</Text>
        {items.length === 0 && <Text style={s.empty}>All caught up. No pending records.</Text>}

        {items.map((r) => (
          <View key={r.id} style={s.card}>
            <Text style={s.member}>{names[r.userId] || 'Loading…'}</Text>
            <Text style={s.amount}>{formatGHS(r.amount)}</Text>
            <Text style={s.meta}>{r.categoryName} · {format(r.date, 'd MMM yyyy')} · {r.method}</Text>
            {!!r.note && <Text style={s.note}>“{r.note}”</Text>}
            {r.proofUrl ? (
              <Pressable onPress={() => setZoom(r.proofUrl)}>
                <Image source={{ uri: r.proofUrl }} style={s.proof} />
                <Text style={s.hint}>Tap to enlarge</Text>
              </Pressable>
            ) : <Text style={s.noProof}>No payment proof attached</Text>}
            <View style={s.actions}>
              <Pressable style={s.reject} onPress={() => { setReason(''); setRejecting(r); }}><Text style={s.rejectText}>Reject</Text></Pressable>
              <View style={{ flex: 1, marginLeft: 12 }}><Button title="Verify" onPress={() => verify(r)} /></View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!zoom} transparent animationType="fade" onRequestClose={() => setZoom(null)}>
        <Pressable style={s.zoom} onPress={() => setZoom(null)}>
          {zoom && <Image source={{ uri: zoom }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />}
          <Text style={{ color: colors.white, marginTop: 12 }}>Tap anywhere to close</Text>
        </Pressable>
      </Modal>

      <Modal visible={!!rejecting} transparent animationType="slide" onRequestClose={() => setRejecting(null)}>
        <View style={s.sheetWrap}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Reject record</Text>
            <Text style={s.muted}>Tell the member why, so they can fix it and resubmit.</Text>
            <TextInput value={reason} onChangeText={setReason} placeholder="e.g. Receipt is unclear" placeholderTextColor={colors.muted} multiline style={s.reason} />
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <View style={{ flex: 1, marginRight: 12 }}><Button title="Cancel" variant="outline" onPress={() => setRejecting(null)} /></View>
              <View style={{ flex: 1 }}>
                <Button title="Reject" onPress={() => {
                  if (!reason.trim()) return Alert.alert('Add a reason', 'Please tell the member why this was rejected.');
                  review(rejecting!, 'REJECTED', reason.trim());
                  setRejecting(null);
                }} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 20, paddingTop: 64 },
  back: { color: colors.green, fontWeight: '700', fontSize: 15 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 10 },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 18 },
  muted: { color: colors.muted, fontSize: 14, marginTop: 10, lineHeight: 20 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  member: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  amount: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 2 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 3 },
  note: { color: colors.text, fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  proof: { width: '100%', height: 170, borderRadius: 12, marginTop: 12, backgroundColor: colors.border },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 4 },
  noProof: { color: colors.pending, fontSize: 13, marginTop: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', marginTop: 16 },
  reject: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.rejected },
  rejectText: { color: colors.rejected, fontWeight: '700', fontSize: 16 },
  zoom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  sheetWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, padding: 20, paddingBottom: 36, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  reason: { minHeight: 80, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginTop: 12, color: colors.text, textAlignVertical: 'top' },
});
