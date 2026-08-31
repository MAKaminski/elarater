import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { flush, pending, type QueuedRating } from './queue';
import { useSession } from '../auth/useSession';

/** Flushes on mount and whenever the app returns to the foreground. */
export function useOfflineQueue() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [queued, setQueued] = useState<QueuedRating[]>([]);

  const refresh = useCallback(async () => setQueued(await pending()), []);

  const attemptFlush = useCallback(async () => {
    if (!user) return;
    const result = await flush(user.id);
    if (result.flushed.length > 0) {
      await queryClient.invalidateQueries({ queryKey: ['my-ratings'] });
      await queryClient.invalidateQueries({ queryKey: ['nearby'] });
    }
    await refresh();
  }, [user, queryClient, refresh]);

  useEffect(() => {
    void attemptFlush();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void attemptFlush();
    });
    return () => sub.remove();
  }, [attemptFlush]);

  return { queued, refresh, flush: attemptFlush };
}
