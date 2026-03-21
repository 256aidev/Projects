import { useState, useEffect, useRef, useCallback } from 'react';

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  enabled = true
): { data: T | null; error: string | null; loading: boolean; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const doFetch = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      if (mountedRef.current) {
        setData(result);
        setError(null);
        setLoading(false);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Unknown error');
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;
    doFetch();
    const id = setInterval(doFetch, intervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [doFetch, intervalMs, enabled]);

  return { data, error, loading, refetch: doFetch };
}
