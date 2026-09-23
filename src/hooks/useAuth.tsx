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
  /** True when the current session is an anonymous/guest sign-in. */
  isGuest: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  isGuest: false,
});

const VNR_CACHED_USER_KEY = "vnr_cached_user";

function getInitialUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VNR_CACHED_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/**
 * Mount this ONCE in the root Providers tree.
 * It creates a single `onAuthStateChange` listener instead of one per component.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    isGuest: false,
  });

  const applySession = (session: Session | null) => {
    setState({
      session,
      user: session?.user ?? null,
      loading: false,
      isGuest: !!session?.user?.is_anonymous,
    });
  };

  useEffect(() => {
    let mounted = true;

    // Fast client-side restore from localStorage after mount (safe from SSR hydration mismatch)
    try {
      const raw = localStorage.getItem(VNR_CACHED_USER_KEY);
      if (raw) {
        const cachedUser = JSON.parse(raw);
        setState((prev) => ({
          ...prev,
          user: cachedUser,
          loading: false,
          isGuest: !!cachedUser?.is_anonymous,
        }));
      }
    } catch {}

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
          try {
            localStorage.removeItem(VNR_CACHED_USER_KEY);
            localStorage.removeItem("vnr_is_admin");
            localStorage.removeItem("vnr_is_mod");
            localStorage.removeItem("vnr_is_uploader");
          } catch {}
          setState({ session: null, user: null, loading: false, isGuest: false });
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
        setState({ session: null, user: null, loading: false, isGuest: false });
        try {
          localStorage.removeItem(VNR_CACHED_USER_KEY);
        } catch {}
        return;
      }

      applySession(data.session);

      if (data.session?.user) {
        try {
          localStorage.setItem(VNR_CACHED_USER_KEY, JSON.stringify(data.session.user));
        } catch {}
        checkBan(data.session);
      } else {
        try {
          localStorage.removeItem(VNR_CACHED_USER_KEY);
        } catch {}
      }
    }

    hydrateSession();

    // Single global listener handles initial session hydration as well (via INITIAL_SESSION)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("useAuth: onAuthStateChange fired event:", event, "session present:", !!session);
      
      // Update state synchronously to prevent race conditions and blockages
      applySession(session);

      // Run ban check in the background without blocking the UI state transition
      if (session?.user) {
        try {
          localStorage.setItem(VNR_CACHED_USER_KEY, JSON.stringify(session.user));
        } catch {}
        checkBan(session);
      } else if (event === "SIGNED_OUT" || !session) {
        try {
          localStorage.removeItem(VNR_CACHED_USER_KEY);
          localStorage.removeItem("vnr_is_admin");
          localStorage.removeItem("vnr_is_mod");
          localStorage.removeItem("vnr_is_uploader");
        } catch {}
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

/**
 * Sign in as a one-click anonymous guest (Supabase anonymous sign-in).
 * Creates a real auth.users row with is_anonymous=true so reading progress,
 * follows and settings attach to a session that can later be upgraded to a
 * full account without losing data. Returns an error message on failure.
 */
export async function signInAsGuest(): Promise<string | null> {
  try {
    const { error } = await supabase.auth.signInAnonymously({
      options: { data: { guest: true } },
    });
    if (error) {
      // Common case: "Anonymous sign-ins are disabled" (422)
      return error.message;
    }
    return null;
  } catch (err: any) {
    return err?.message || "Guest sign-in failed";
  }
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
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMod, setIsMod] = useState(false);
  const [isUploader, setIsUploader] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore cached roles on client mount without causing SSR hydration mismatch
  useEffect(() => {
    try {
      const cachedAdmin = localStorage.getItem("vnr_is_admin") === "true";
      const cachedMod = localStorage.getItem("vnr_is_mod") === "true";
      const cachedUploader = localStorage.getItem("vnr_is_uploader") === "true";
      if (cachedAdmin) setIsAdmin(true);
      if (cachedMod) setIsMod(true);
      if (cachedUploader) setIsUploader(true);
      if (localStorage.getItem("vnr_is_admin") !== null) {
        setLoading(false);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // If auth is done and truly no user, reset in-memory state
      if (!authLoading) {
        setIsAdmin(false);
        setIsMod(false);
        setIsUploader(false);
        setLoading(false);
      }
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (error) {
          console.error("useIsAdmin roles fetch error:", error);
          setLoading(false);
          return;
        }
        const roles = (data ?? []).map((r) => r.role);
        const adminRole = roles.includes("admin") || (roles as string[]).includes("creator");
        const modRole = roles.includes("moderator");
        const uploaderRole = roles.includes("uploader");

        setIsAdmin(adminRole);
        setIsMod(modRole);
        setIsUploader(uploaderRole);
        setLoading(false);

        try {
          localStorage.setItem("vnr_is_admin", String(adminRole));
          localStorage.setItem("vnr_is_mod", String(modRole));
          localStorage.setItem("vnr_is_uploader", String(uploaderRole));
        } catch {}
      });
  }, [user, authLoading]);

  return { isAdmin, isMod, isUploader, user, loading };
}
