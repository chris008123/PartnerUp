import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '../context/AuthContext';

export type Profile = { cellName: string; weeklyReminder: boolean };

export function useProfile(): Profile {
  const { user } = useAuth();
  const [p, setP] = useState<Profile>({ cellName: '', weeklyReminder: false });
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (s) => {
      const x: any = s.data() || {};
      setP({ cellName: x.cellName || '', weeklyReminder: !!x.weeklyReminder });
    }, () => {});
  }, [user?.uid]);
  return p;
}
