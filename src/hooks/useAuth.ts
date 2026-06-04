import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}

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
        console.log("useIsAdmin roles fetched for", user.email, ":", roles);
        setIsAdmin(roles.includes("admin"));
        setIsMod(roles.includes("moderator"));
        setIsUploader(roles.includes("uploader"));
      });
  }, [user]);

  return { isAdmin, isMod, isUploader, user };
}