import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { api, getSupabaseClient } from './backend';

type Profile = {
  user_id: string;
  full_name?: string | null;
  role: string;
  account_status?: string;
  phone_number?: string | null;
};

type Auth = {
  ready: boolean;
  profileLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileError: string;
  configError: string;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
};

const Context = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [configError, setConfigError] = useState('');

  useEffect(() => {
    let alive = true;
    let subscription: { unsubscribe: () => void } | undefined;

    try {
      const supabase = getSupabaseClient();
      supabase.auth.getSession().then(({ data, error }) => {
        if (!alive) return;
        if (error) setProfileError(error.message);
        setSession(data.session ?? null);
        setReady(true);
      }).catch((error: unknown) => {
        if (!alive) return;
        setConfigError(error instanceof Error ? error.message : 'Could not restore the session.');
        setReady(true);
      });
      const listener = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!alive) return;
        setSession(nextSession);
        setReady(true);
      });
      subscription = listener.data.subscription;
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : 'App configuration is missing.');
      setReady(true);
    }

    return () => {
      alive = false;
      subscription?.unsubscribe();
    };
  }, []);

  const loadProfile = useCallback(async (token: string) => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const value = await api<Profile>('/api/profile', 'GET', undefined, token);
      setProfile(value);
      return value;
    } catch (error) {
      setProfile(null);
      setProfileError(error instanceof Error ? error.message : 'We could not load your profile.');
      throw error;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setProfile(null);
      setProfileError('');
      return;
    }
    loadProfile(session.access_token).catch(() => {});
  }, [session?.access_token, loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setProfileError('');
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const trustedProfile = await api<Profile>('/api/profile', 'GET', undefined, data.session.access_token);
    if (trustedProfile.role !== 'RESCUER') {
      await supabase.auth.signOut();
      throw new Error('This app is only for Rescuer accounts. Ask your administrator for the correct account.');
    }
    setProfile(trustedProfile);
  }, []);

  const signOut = useCallback(async () => {
    await getSupabaseClient().auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(
    () => (session?.access_token ? loadProfile(session.access_token) : Promise.resolve(null)),
    [session?.access_token, loadProfile],
  );

  const value = useMemo<Auth>(() => ({
    ready,
    profileLoading,
    session,
    user: session?.user ?? null,
    profile,
    profileError,
    configError,
    signIn,
    signOut,
    refreshProfile,
  }), [ready, profileLoading, session, profile, profileError, configError, signIn, signOut, refreshProfile]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
