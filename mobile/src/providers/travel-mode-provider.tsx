import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  readTravelMode,
  saveTravelMode,
  TravelMode,
} from "@/lib/travel-mode-storage";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";
type ModeContext = {
  mode: TravelMode;
  loading: boolean;
  setMode: (mode: TravelMode) => void;
};
const Context = createContext<ModeContext | null>(null);
export function TravelModeProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = usePassengerAuth();
  const email = (user?.email ?? "").toLowerCase();
  const [state, setState] = useState<{ email: string; mode: TravelMode }>({
    email: "",
    mode: "passenger",
  });
  const operation = useRef(0);
  const [ready, setReady] = useState("");
  useEffect(() => {
    let active = true;
    const version = ++operation.current;
    if (!email) return;
    readTravelMode(email)
      .catch(() => "passenger" as TravelMode)
      .then((mode) => {
        if (active && version === operation.current) {
          setState({ email, mode });
          setReady(email);
        }
      });
    return () => {
      active = false;
    };
  }, [email]);
  const setMode = useCallback(
    (mode: TravelMode) => {
      operation.current += 1;
      setState({ email, mode });
      setReady(email);
      if (email) void saveTravelMode(email, mode).catch(() => {});
    },
    [email],
  );
  return (
    <Context.Provider
      value={{
        mode: email && state.email === email ? state.mode : "passenger",
        loading: authLoading || Boolean(email && ready !== email),
        setMode,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useTravelMode() {
  const value = useContext(Context);
  if (!value) throw new Error("TravelModeProvider is missing");
  return value;
}
