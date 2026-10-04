import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AuthUser,
  fetchPassengerSession,
  PassengerAccount,
  passengerSignIn,
  passengerSignOut,
  passengerSignUp,
  readStoredSession,
} from '@/lib/auth';

type AuthContextValue = {
  loading: boolean;
  session: string | null;
  user: AuthUser | null;
  passenger: PassengerAccount | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    city: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function PassengerAuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [passenger, setPassenger] = useState<PassengerAccount | null>(null);

  const applySession = useCallback(async (token: string | null) => {
    if (!token) {
      setSession(null);
      setUser(null);
      setPassenger(null);
      return;
    }

    const response = await fetchPassengerSession(token);
    setSession(token);
    setUser(response.user);
    setPassenger(response.passenger);
  }, []);

  useEffect(() => {
    let active = true;

    readStoredSession()
      .then(async (token) => {
        if (!active) return;

        if (!token) {
          setLoading(false);
          return;
        }

        try {
          const response = await fetchPassengerSession(token);
          if (!active) return;

          setSession(token);
          setUser(response.user);
          setPassenger(response.passenger);
        } catch {
          if (!active) return;
          await passengerSignOut(null);
          setSession(null);
          setUser(null);
          setPassenger(null);
        } finally {
          if (active) setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await passengerSignIn(email, password);
      await applySession(response.session);
    },
    [applySession]
  );

  const signUp = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      city: string;
    }) => {
      const response = await passengerSignUp(input);
      setSession(response.session);
      setUser(response.user);
      setPassenger(response.passenger);
    },
    []
  );

  const signOut = useCallback(async () => {
    await passengerSignOut(session);
    setSession(null);
    setUser(null);
    setPassenger(null);
  }, [session]);

  const refresh = useCallback(async () => {
    if (!session) return;
    await applySession(session);
  }, [applySession, session]);

  const value = useMemo(
    () => ({
      loading,
      session,
      user,
      passenger,
      signIn,
      signUp,
      signOut,
      refresh,
    }),
    [loading, passenger, refresh, session, signIn, signOut, signUp, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function usePassengerAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('usePassengerAuth must be used inside PassengerAuthProvider');
  }

  return value;
}
