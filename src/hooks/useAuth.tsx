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
    // Sign out and clear state if the account has been banned by an admin.
    // Returns true if the user was banned (and thus signed out).
    async function enforceBan(session: Session | null): Promise<boolean> {
      if (!session?.user) return false;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile?.is_banned) {
        await supabase.auth.signOut();
        setState({ session: null, user: null, loading: false });
        toast.error("Your account has been suspended. Contact support if you believe this is a mistake.");
        return true;
      }
      return false;
    }

    // Hydrate initial session
    supabase.auth.getSession().then(async ({ data }) => {
      if (await enforceBan(data.session)) return;
      setState({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      });
    }).catch((err) => {
      console.error("useAuth getSession error:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
      }));
    });

    // Single global listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (await enforceBan(session)) return;
      setState({
        session,
        user: session?.user ?? null,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
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