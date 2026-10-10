import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
/** Keep static HTML light until the client hydrates. */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const colorScheme = useRNColorScheme();
  return hasHydrated ? colorScheme : 'light';
}
