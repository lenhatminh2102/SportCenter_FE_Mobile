import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/services/api';
export function useApiQuery<T>(loader: () => Promise<T>, enabled = true, autoLoad = true) {
  const [state, setState] = useState<{ data: T | null; error: Error | null; loading: boolean }>({ data: null, error: null, loading: enabled });
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const version = ++sequence.current;
    if (!enabled) { setState({ data: null, error: null, loading: false }); return; }
    setState({ data: null, error: null, loading: true });
    try {
      const data = await loader();
      if (sequence.current === version) setState({ data, error: null, loading: false });
    } catch (error) {
      if (sequence.current === version) setState({ data: null, error: error instanceof Error ? error : new Error('Yêu cầu thất bại.'), loading: false });
    }
  }, [loader, enabled]);
  useEffect(() => { if (autoLoad) void reload(); return () => { sequence.current++; }; }, [reload, autoLoad]);
  return { ...state, reload, missing: state.error instanceof ApiError && state.error.status === 404 };
}
