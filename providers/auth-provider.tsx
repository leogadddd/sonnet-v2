"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useUser } from "@/lib/store/use-user";
import { getSupabase } from "@/lib/supabase/supabase-client";
import dbClient from "@/lib/system/localdb/client";
import type { UserObject } from "@/lib/system/user/user";

const AuthContext = createContext({
  isLoaded: false,
  isSignedIn: false,
  userId: null as string | null,
  error: "",
  refresh: async () => {},
});
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useUser((state) => state.user);
  const [isLoaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    let generation = 0;
    const db = getSupabase();
    async function refresh() {
      const current = ++generation;
      try {
        const response = await fetch("/api/user", { cache: "no-store" });
        if (!response.ok && response.status !== 401)
          throw new Error("Unable to load your account.");
        const account: UserObject | null = response.ok
          ? await response.json()
          : null;
        if (!active || current !== generation) return;
        if (useUser.getState().user?.id !== account?.id) {
          useUser.getState().setUser(null);
          dbClient.setAccount(account?.id ?? null);
        }
        useUser.getState().setUser(account);
        setError("");
      } catch (cause) {
        if (!active || current !== generation) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load your account.",
        );
      } finally {
        if (active && current === generation) setLoaded(true);
      }
    }
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        ++generation;
        useUser.getState().setUser(null);
        dbClient.setAccount(null);
        setLoaded(true);
      } else {
        if (session && useUser.getState().user?.id !== session.user.id) {
          ++generation;
          useUser.getState().setUser(null);
          dbClient.setAccount(null);
        }
        setTimeout(() => {
          if (active) void refresh();
        }, 0);
      }
    });
    void refresh();
    return () => {
      active = false;
      ++generation;
      subscription.unsubscribe();
    };
  }, [revision]);
  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn: !!user,
        userId: user?.id ?? null,
        error,
        refresh: async () => {
          setRevision((value) => value + 1);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
