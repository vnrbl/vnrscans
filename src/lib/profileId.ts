import { supabase } from "@/integrations/supabase/client";

/** profiles.id for the current auth user (not auth.users.id). */
export async function getCurrentProfileId(): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    console.warn("getCurrentProfileId:", error.message);
    return null;
  }
  return data?.id ?? null;
}
