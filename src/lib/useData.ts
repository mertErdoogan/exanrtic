import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads data when the screen gains focus (and whenever `deps` change) and
 * exposes a manual reload. Local SQLite reads are fast, so refetching on
 * focus keeps screens fresh without a global cache.
 */
export function useData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  const key = JSON.stringify(deps);

  useEffect(() => {
    loadRef.current = load;
  });

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setData(await loadRef.current());
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
      // `key` is intentional: it re-runs the load when the caller's deps change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload, key]),
  );

  return { data, error, loading, reload };
}
