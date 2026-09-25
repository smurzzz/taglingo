import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

import { useAppState } from '@/lib/app-state';

/** Real device connectivity, detected once at the app root (functionality prompt §11). */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  return online;
}

/** Real connectivity combined with the Settings "preview offline" demo switch. */
export function useIsOffline(): boolean {
  const online = useOnline();
  const { state } = useAppState();
  return !online || state.simulateOffline;
}
