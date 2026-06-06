import { redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

function isInvalidAuthSession(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String(error.message) : "";
  const name = "name" in error ? String(error.name) : "";

  return (
    name.includes("Auth") ||
    message.includes("Invalid Refresh Token") ||
    message.includes("Refresh Token Not Found") ||
    message.includes("Auth session missing")
  );
}

async function clearLocalAuthSession() {
  await supabase.auth.signOut({ scope: "local" } as any).catch(() => {});
}

export async function requireAuthenticatedUser() {
  let result: Awaited<ReturnType<typeof supabase.auth.getUser>>;

  try {
    result = await supabase.auth.getUser();
  } catch (error) {
    if (isInvalidAuthSession(error)) {
      await clearLocalAuthSession();
    }
    throw redirect({ to: "/auth" });
  }

  if (result.error || !result.data.user) {
    if (result.error && isInvalidAuthSession(result.error)) {
      await clearLocalAuthSession();
    }
    throw redirect({ to: "/auth" });
  }

  return result.data.user;
}
