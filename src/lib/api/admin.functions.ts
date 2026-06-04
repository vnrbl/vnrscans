import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import process from "node:process";

/**
 * Create a Supabase admin client with the service role key.
 * Must only run server-side — the .functions.ts file + createServerFn
 * guarantee this never ships to the browser.
 */
function getAdminSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on server");
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Verify the requesting user is an admin by checking the user_roles table.
 */
async function verifyAdmin(requestUserToken: string) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) throw new Error("Missing Supabase env vars");

  const userClient = createClient(url, anonKey);
  const { data: { user }, error } = await userClient.auth.getUser(requestUserToken);
  if (error || !user) throw new Error("Unauthorized: invalid token");

  const admin = getAdminSupabase();
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) throw new Error("Forbidden: admin role required");

  return user;
}

/**
 * Delete a user from Supabase Auth (and cascade to profiles via DB triggers/RLS).
 * Only callable by admins.
 */
export const $deleteUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      targetUserId: z.string().uuid(),
      accessToken: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    // 1. Verify the caller is an admin
    const admin = await verifyAdmin(data.accessToken);

    // Prevent self-deletion
    if (admin.id === data.targetUserId) {
      return { success: false, error: "You cannot delete your own account" };
    }

    // 2. Use admin client to delete the auth user
    const supabaseAdmin = getAdminSupabase();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.targetUserId);

    if (error) {
      return { success: false, error: error.message };
    }

    // 3. Also clean up the profile row (in case no DB trigger handles it)
    await supabaseAdmin.from("profiles").delete().eq("user_id", data.targetUserId);
    // Clean up user_roles
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.targetUserId);

    return { success: true };
  });
