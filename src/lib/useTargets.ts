import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '../context/AuthContext';
import { Target } from './types';

export function useTargets() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<Target[]>([]);
  useEffect(() => {
    if (!user) { setTargets([]); return; }
    const q = query(collection(db, 'targets'), where('userId', '==', user.uid));
    return onSnapshot(q, (snap) => {
      setTargets(
        snap.docs
          .map((d) => {
            const x: any = d.data();
            return { ...x, id: d.id, startDate: x.startDate?.toDate?.() ?? null, endDate: x.endDate?.toDate?.() ?? null } as Target;
          })
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    }, () => {});
  }, [user?.uid]);
  return targets;
}
