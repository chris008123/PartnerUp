import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '../context/AuthContext';

// null = still checking, true/false = known
export function useIsAdmin(): boolean | null {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    return onSnapshot(doc(db, 'admins', user.uid), (s) => setIsAdmin(s.exists()), () => setIsAdmin(false));
  }, [user?.uid]);
  return isAdmin;
}
