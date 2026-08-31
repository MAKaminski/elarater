/**
 * Auth session. Anonymous browse is allowed; an account is required to rate
 * (docs/01-product-spec.md).
 */
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '../supabase';
import { getProfile } from '../api/profiles';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

/** The profile row, including whether the terms gate has been cleared. */
export function useProfile() {
  const { user, loading } = useSession();
  const query = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => (user ? getProfile(user.id) : null),
    enabled: !!user,
  });

  return {
    profile: query.data ?? null,
    isLoading: loading || query.isLoading,
    /** False until the user has accepted terms — the RLS policy enforces the same. */
    canPost: !!query.data?.terms_accepted_at && !query.data.is_suspended,
    refetch: query.refetch,
  };
}
