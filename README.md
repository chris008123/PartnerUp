# Partner Up

A mobile app for church members to track their personal partnership (giving) records.
React Native (Expo, runs in Expo Go) + Firebase Spark (free) plan: Auth + Firestore. Payment-proof images go to Cloudinary (free tier).
It records giving only. It never moves money.

## 1. Install
This folder is a complete Expo project (SDK 57, dependency versions verified together).
    npm install
    copy .env.example .env      (PowerShell/cmd; on Mac/Linux use: cp .env.example .env)
The included `.npmrc` sets `legacy-peer-deps=true`, which avoids an npm peer-dependency conflict with Expo.
If versions ever drift after an Expo update, run `npx expo install --fix`.

## 2. Firebase (Spark plan only)
1. Console > Add project. Add a Web app and copy its config values into `.env` (copy `.env.example`).
2. Build > Authentication > Get started > turn on Email/Password.
3. Build > Firestore Database > Create database (start in test mode for the first run).
4. Do NOT enable Cloud Storage or Cloud Functions (they need the paid Blaze plan). Images use Cloudinary.

## 3. Cloudinary (free)
Settings > Upload > Add upload preset > Signing mode: Unsigned. Put the cloud name and preset name in `.env`.

## 4. Security rules (do this before real members use the app)
Firestore > Rules tab > paste the contents of `firestore.rules` > Publish.
(Or with the Firebase CLI: `firebase deploy --only firestore:rules`.)
Test mode expires after 30 days, so publishing these rules is required.

## 5. Make your first admin
1. Create an account in the app, then in Firebase Console > Authentication > Users copy that user's UID.
2. Firestore > Start collection `admins` > Document ID = that UID > add any field (e.g. `active: true`) > Save.
3. Reopen the app. Profile now shows "Verify records (admin)".
Add more finance officers the same way. Remove a document to remove admin access.

## 6. Optional: your own categories
Firestore > collection `categories` > documents like { name: "Building Project", isActive: true, order: 1 }.
Without any, the app uses: Building Project, Ministry Programs, Tithe, Welfare, Other.

## 7. Run
    npx expo start -c
Scan the QR code with Expo Go.

## Quick test checklist
- Create account, sign out, sign in, close and reopen (stays signed in)
- Add a record with and without a proof photo
- As admin: verify one record, reject another with a reason
- As the member: the status chips update, "Verified by" shows, a rejected record can be edited and resubmitted
- A member cannot verify their own record (rules block it)
- Create a monthly target, confirm the Home progress bar

## Known limits
- Remote push notifications don't work in Expo Go. Reminders are in-app only.
- The Firebase JS SDK in React Native has a memory cache only: a record added offline syncs if the app stays open, but can be lost if it is closed first.
- Lists load all of one member's records and filter on the phone (fine for personal use). Admin queue is pending records only; there is no history view yet.
- Face ID is not available inside Expo Go on iPhone (passcode fallback). Fingerprint works on Android.
- The logo is a text approximation. Replace `src/components/Logo.tsx` with your exported Figma logo.
