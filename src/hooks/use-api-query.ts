import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/services/api';
export function useApiQuery<T>(loader: () => Promise<T>, enabled = true, autoLoad = true) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ loader: typeof loader; version: number; data: T | null; error: Error | null } | null>(null);
  const reload = useCallback(() => setVersion(current => current + 1), []);
  useEffect(() => {
    if (!enabled || (!autoLoad && version === 0)) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      return loader().then(data => {
        if (active) setState({ loader, version, data, error: null });
      });
    }).catch(error => {
      if (active) setState({ loader, version, data: null, error: error instanceof Error ? error : new Error('Yêu cầu thất bại.') });
    });
    return () => { active = false; };
  }, [loader, enabled, autoLoad, version]);
  const current = enabled && state?.loader === loader && state.version === version ? state : null;
  return { data: current?.data ?? null, error: current?.error ?? null, loading: enabled && !current, reload, missing: current?.error instanceof ApiError && current.error.status === 404 };
}
