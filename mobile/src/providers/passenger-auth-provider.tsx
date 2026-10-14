import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { stopBackgroundDriverTracking } from "@/lib/background-driver-location";
import {
  AuthUser,
  fetchPassengerSession,
  PassengerAccount,
  passengerSignIn,
  passengerSignOut,
  passengerSignUp,
  readStoredSession,
  storeSession,
  isExpiredSession,
  subscribeToSessionExpiry,
} from "@/lib/auth";

type AuthContextValue = {
  loading: boolean;
  restorationError: string | null;
  retryRestore: () => void;
  session: string | null;
  user: AuthUser | null;
  passenger: PassengerAccount | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    city: string;
  }) => Promise<string | null>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function PassengerAuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [passenger, setPassenger] = useState<PassengerAccount | null>(null);
  const operation = useRef(0);
  const [restorationError, setRestorationError] = useState<string | null>(null);
  const [restoreVersion, setRestoreVersion] = useState(0);
  const retryRestore = useCallback(() => {
    setLoading(true);
    setRestorationError(null);
    setRestoreVersion((v) => v + 1);
  }, []);

  const applySession = useCallback(
    async (token: string | null, version = operation.current) => {
      if (!token) {
        setSession(null);
        setUser(null);
        setPassenger(null);
        return;
      }

      const response = await fetchPassengerSession(token);
      if (version !== operation.current) return;
      if (!response.authenticated || !response.user?.email) {
        throw new Error(
          "The server returned an invalid session. Please sign in again.",
        );
      }
      setSession(token);
      setUser(response.user);
      setPassenger(response.passenger);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    const version = operation.current;

    readStoredSession()
      .then(async (token) => {
        if (!active || version !== operation.current) return;

        if (!token) {
          setLoading(false);
          return;
        }

        try {
          const response = await fetchPassengerSession(token);
          if (!active || version !== operation.current) return;

          setSession(token);
          setUser(response.user);
          setPassenger(response.passenger);
        } catch (error) {
          if (!active || version !== operation.current) return;
          if (isExpiredSession(error)) await storeSession(null);
          else
            setRestorationError(
              error instanceof Error
                ? error.message
                : "Unable to restore your account. Please try again.",
            );
          if (!active || version !== operation.current) return;
          setSession(null);
          setUser(null);
          setPassenger(null);
        } finally {
          if (active && version === operation.current) setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setRestorationError(
            "Unable to read your saved account. Please try again.",
          );
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [restoreVersion]);

  useEffect(
    () =>
      subscribeToSessionExpiry((token) => {
        if (!session || session !== token) return;
        operation.current += 1;
        setSession(null);
        setUser(null);
        setPassenger(null);
        setLoading(false);
        void storeSession(null).catch(() => {});
        void stopBackgroundDriverTracking().catch(() => {});
      }),
    [session],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const version = ++operation.current;
    try {
      const response = await passengerSignIn(email, password);
      if (version !== operation.current) return;
      await storeSession(response.session);
      if (version !== operation.current) return;
      setRestorationError(null);
      setSession(response.session);
      setUser(response.user);
      setPassenger(response.passenger);
    } finally {
      if (version === operation.current) setLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      city: string;
    }) => {
      const version = ++operation.current;
      try {
        const response = await passengerSignUp(input);
        if (version !== operation.current) return null;
        if (!response.session)
          return (
            response.message ??
            "Check your email to verify your account, then sign in."
          );
        await storeSession(response.session);
        if (version !== operation.current) return null;
        setRestorationError(null);
        setSession(response.session);
        setUser(response.user);
        setPassenger(response.passenger);
        return null;
      } finally {
        if (version === operation.current) setLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    operation.current += 1;
    setRestorationError(null);
    setSession(null);
    setUser(null);
    setPassenger(null);
    setLoading(false);
    await stopBackgroundDriverTracking().catch(() => {});
    await passengerSignOut(session);
  }, [session]);

  const refresh = useCallback(async () => {
    const version = operation.current;
    const token = session ?? (await readStoredSession());
    if (!token || version !== operation.current) return;
    try {
      await applySession(token, version);
    } catch (error) {
      if (version === operation.current && isExpiredSession(error)) {
        await storeSession(null);
        if (version !== operation.current) return;
        setSession(null);
        setUser(null);
        setPassenger(null);
      }
      throw error;
    }
  }, [applySession, session]);

  const value = useMemo(
    () => ({
      loading,
      restorationError,
      retryRestore,
      session,
      user,
      passenger,
      signIn,
      signUp,
      signOut,
      refresh,
    }),
    [
      loading,
      restorationError,
      retryRestore,
      passenger,
      refresh,
      session,
      signIn,
      signOut,
      signUp,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function usePassengerAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error(
      "usePassengerAuth must be used inside PassengerAuthProvider",
    );
  }

  return value;
}
