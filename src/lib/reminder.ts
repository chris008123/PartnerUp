import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addWeeks, endOfWeek, startOfWeek } from 'date-fns';

export type ReminderSettings = {
  enabled: boolean;
  weekday: number; // 0 = Sunday ... 6 = Saturday
  hour: number;
  minute: number;
};

export const DEFAULT_REMINDER: ReminderSettings = { enabled: false, weekday: 0, hour: 18, minute: 0 }; // Sunday 6:00 PM
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const KEY = 'reminderSettings';
const CHANNEL = 'reminders';
const WEEKS_AHEAD = 8;

export async function loadReminder(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT_REMINDER, ...JSON.parse(raw) } : DEFAULT_REMINDER;
  } catch {
    return DEFAULT_REMINDER;
  }
}

export const saveReminder = (s: ReminderSettings) => AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});

export async function ensurePermission(): Promise<boolean> {
  let p = await Notifications.getPermissionsAsync();
  if (!p.granted && p.canAskAgain) p = await Notifications.requestPermissionsAsync();
  return p.granted;
}

// Upcoming reminder times. If the member already gave this week, this week's reminder is skipped.
function upcoming(s: ReminderSettings, skipThisWeek: boolean): Date[] {
  const now = new Date();
  const first = new Date(now);
  first.setHours(s.hour, s.minute, 0, 0);
  while (first.getDay() !== s.weekday || first <= now) first.setDate(first.getDate() + 1);

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const out: Date[] = [];
  for (let i = 0; out.length < WEEKS_AHEAD; i++) {
    const d = addWeeks(first, i);
    if (skipThisWeek && d >= weekStart && d <= weekEnd) continue;
    out.push(d);
  }
  return out;
}

export async function syncReminders(s: ReminderSettings, hasRecordThisWeek: boolean) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!s.enabled) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Weekly reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  for (const date of upcoming(s, hasRecordThisWeek)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Partner Up', body: "Have you added this week's partnership record?" },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
    });
  }
}
