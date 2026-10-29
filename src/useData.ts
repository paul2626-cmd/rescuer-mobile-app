import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { api } from './backend';

export function useData<T = any>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!path) {
      setData(null);
      setLoading(false);
      setError('');
      return null;
    }
    setError('');
    setLoading(true);
    try {
      const value = await api<T>(path);
      setData(value);
      return value;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'We could not load this information.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    let previousState: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (previousState.match(/inactive|background/) && nextState === 'active') reload();
      previousState = nextState;
    });
    return () => subscription.remove();
  }, [reload]);

  return { data, loading, error, reload };
}
