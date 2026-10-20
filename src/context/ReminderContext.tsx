import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Notifications } from '../lib/notifications';
import { startOfWeek } from 'date-fns';
import { useAuth } from './AuthContext';
import { useRecords } from './RecordsContext';
import { DEFAULT_REMINDER, ReminderSettings, loadReminder, saveReminder, syncReminders } from '../lib/reminder';

// Show reminders even if the app happens to be open.
try {
  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {}

type Ctx = { settings: ReminderSettings; update: (patch: Partial<ReminderSettings>) => void };
const ReminderContext = createContext<Ctx>({ settings: DEFAULT_REMINDER, update: () => {} });

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { records, loading } = useRecords();
  const [settings, setSettings] = useState(DEFAULT_REMINDER);
  const [loaded, setLoaded] = useState(false);
  const [wake, setWake] = useState(0);

  useEffect(() => { loadReminder().then((s) => { setSettings(s); setLoaded(true); }); }, []);

  // Re-plan when the app comes back to the foreground so the 8-week window keeps rolling forward.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') setWake((w) => w + 1); });
    return () => sub.remove();
  }, []);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const hasThisWeek = records.some((r) => r.status !== 'REJECTED' && r.date >= weekStart);

  useEffect(() => {
    if (!loaded || loading) return;
    syncReminders(user ? settings : { ...settings, enabled: false }, hasThisWeek)
      .catch((e) => console.warn('reminder sync', e?.message));
  }, [loaded, loading, user?.uid, settings, hasThisWeek, wake]);

  const update = useCallback((patch: Partial<ReminderSettings>) => {
    setSettings((prev) => { const next = { ...prev, ...patch }; saveReminder(next); return next; });
  }, []);

  return <ReminderContext.Provider value={{ settings, update }}>{children}</ReminderContext.Provider>;
}
export const useReminder = () => useContext(ReminderContext);
