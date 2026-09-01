"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ */
/*  Shared Auth Context — single Supabase listener for the entire app */
/* ------------------------------------------------------------------ */

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
});

/**
 * Mount this ONCE in the root Providers tree.
 * It creates a single `onAuthStateChange` listener instead of one per component.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    // Check if the account has been banned by an admin in the background.
    // If banned, it signs the user out and clears state.
    async function checkBan(session: Session) {
      try {
        console.log("useAuth: checking if user is banned:", session.user.id);
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_banned")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("useAuth: checkBan profiles query error:", error);
          return;
        }

        if (profile?.is_banned) {
          console.warn("useAuth: user is banned, signing out...");
          await supabase.auth.signOut();
          setState({ session: null, user: null, loading: false });
          toast.error("Your account has been suspended. Contact support if you believe this is a mistake.");
        }
      } catch (err) {
        console.error("useAuth: checkBan exception occurred:", err);
      }
    }

    async function hydrateSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error("useAuth: getSession error:", error);
        setState({ session: null, user: null, loading: false });
        return;
      }

      setState({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      });

      if (data.session?.user) {
        checkBan(data.session);
      }
    }

    hydrateSession();

    // Single global listener handles initial session hydration as well (via INITIAL_SESSION)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("useAuth: onAuthStateChange fired event:", event, "session present:", !!session);
      
      // Update state synchronously to prevent race conditions and blockages
      setState({
        session,
        user: session?.user ?? null,
        loading: false,
      });

      // Run ban check in the background without blocking the UI state transition
      if (session?.user) {
        checkBan(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
  );
}

/** Read auth state — zero overhead, just a context read. */
export function useAuth() {
  return useContext(AuthContext);
}

/* ------------------------------------------------------------------ */
/*  Admin / role helper (still creates one Supabase query, but no     */
/*  extra auth listeners)                                              */
/* ------------------------------------------------------------------ */

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMod, setIsMod] = useState(false);
  const [isUploader, setIsUploader] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsMod(false);
      setIsUploader(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (error) {
          console.error("useIsAdmin roles fetch error:", error);
          return;
        }
        const roles = (data ?? []).map((r) => r.role);
        setIsAdmin(roles.includes("admin"));
        setIsMod(roles.includes("moderator"));
        setIsUploader(roles.includes("uploader"));
      });
  }, [user]);

  return { isAdmin, isMod, isUploader, user };
}
