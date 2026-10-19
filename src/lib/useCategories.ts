import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const DEFAULTS = ['Building Project', 'Ministry Programs', 'Tithe', 'Welfare', 'Other'].map((n) => ({ id: slug(n), name: n }));

export function useCategories() {
  const [cats, setCats] = useState(DEFAULTS);
  useEffect(() => {
    getDocs(collection(db, 'categories'))
      .then((snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((c) => c.isActive !== false)
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
          .map((c) => ({ id: c.id as string, name: c.name as string }));
        if (list.length) setCats(list);
      })
      .catch(() => {});
  }, []);
  return cats;
}
