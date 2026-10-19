export function authMessage(e: any): string {
  switch (e?.code) {
    case 'auth/invalid-email': return 'Enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Email or password is incorrect.';
    case 'auth/email-already-in-use': return 'An account with this email already exists. Try signing in.';
    case 'auth/weak-password': return 'Use a password with at least 6 characters.';
    case 'auth/too-many-requests': return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed': return 'No connection. Check your internet and try again.';
    case 'auth/operation-not-allowed': return 'Email/Password sign-in is not turned on in Firebase yet.';
    default: return `Something went wrong (${e?.code || e?.message || 'unknown'}). Please try again.`;
  }
}
