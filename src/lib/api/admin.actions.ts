"use server";

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

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

export async function $deleteUser(args: {
  data: {
    targetUserId: string;
    accessToken: string;
  };
}) {
  const { data } = args;
  const validated = z
    .object({
      targetUserId: z.string().uuid(),
      accessToken: z.string().min(1),
    })
    .parse(data);

  // 1. Verify the caller is an admin
  const admin = await verifyAdmin(validated.accessToken);

  // Prevent self-deletion
  if (admin.id === validated.targetUserId) {
    return { success: false, error: "You cannot delete your own account" };
  }

  // 2. Use admin client to delete the auth user
  const supabaseAdmin = getAdminSupabase();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(validated.targetUserId);

  if (error) {
    return { success: false, error: error.message };
  }

  // 3. Also clean up the profile row (in case no DB trigger handles it)
  await supabaseAdmin.from("profiles").delete().eq("user_id", validated.targetUserId);
  // Clean up user_roles
  await supabaseAdmin.from("user_roles").delete().eq("user_id", validated.targetUserId);

  return { success: true };
}
