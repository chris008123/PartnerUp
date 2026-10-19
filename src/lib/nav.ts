import { useRouter } from 'expo-router';

// Go back if there is a screen to go back to, otherwise land on Home.
// (Avoids the "GO_BACK was not handled" warning after a reload or a direct open.)
export function goBack(router: ReturnType<typeof useRouter>) {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)');
}
