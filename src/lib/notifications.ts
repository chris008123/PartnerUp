// Loads expo-notifications safely. In Expo Go (and in builds made before the package was added)
// its native module is missing and importing it would crash the whole app, so we catch that here.
type NotificationsModule = typeof import('expo-notifications');

let loaded: NotificationsModule | null = null;
try {
  loaded = require('expo-notifications') as NotificationsModule;
} catch {
  loaded = null;
}

export const Notifications = loaded;
export const notificationsAvailable = loaded !== null;
