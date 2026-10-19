import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { RecordDoc } from '../lib/types';

const Ctx = createContext<{ records: RecordDoc[]; loading: boolean }>({ records: [], loading: true });

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<RecordDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRecords([]); setLoading(false); return; }
    setLoading(true);
    // Single-field query: no composite index needed. Filtering/sorting happens here.
    const q = query(collection(db, 'records'), where('userId', '==', user.uid));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => {
            const x: any = d.data();
            return { ...x, id: d.id, date: x.date?.toDate?.() ?? new Date(), verifiedAt: x.verifiedAt?.toDate?.() ?? null } as RecordDoc;
          })
          .filter((r) => !r.isDeleted)
          .sort((a, b) => b.date.getTime() - a.date.getTime());
        setRecords(list);
        setLoading(false);
      },
      (err) => { console.warn('records listener', err.message); setLoading(false); }
    );
  }, [user?.uid]);

  return <Ctx.Provider value={{ records, loading }}>{children}</Ctx.Provider>;
}
export const useRecords = () => useContext(Ctx);
