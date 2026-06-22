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

export async function $listUserEmails(args: {
  data: {
    targetUserIds: string[];
    accessToken: string;
  };
}) {
  const { data } = args;
  const validated = z
    .object({
      targetUserIds: z.array(z.string().uuid()).max(1000),
      accessToken: z.string().min(1),
    })
    .parse(data);

  // Only admins may read emails (PII).
  await verifyAdmin(validated.accessToken);

  const supabaseAdmin = getAdminSupabase();
  const wanted = new Set(validated.targetUserIds);
  const emailMap: Record<string, string> = {};

  // The admin API only supports paginated listing, so page through until we've
  // matched everyone we care about (or run out of users).
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) return { success: false as const, error: error.message };

    for (const u of list.users) {
      if (wanted.has(u.id) && u.email) emailMap[u.id] = u.email;
    }

    if (list.users.length < perPage) break;
    if (Object.keys(emailMap).length >= wanted.size) break;
  }

  return { success: true as const, emails: emailMap };
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

export async function $generateResetPasswordLink(args: {
  data: {
    targetEmail: string;
    redirectTo: string;
    accessToken: string;
  };
}) {
  const { data } = args;
  const validated = z
    .object({
      targetEmail: z.string().email(),
      redirectTo: z.string().min(1),
      accessToken: z.string().min(1),
    })
    .parse(data);

  // 1. Verify caller is admin
  await verifyAdmin(validated.accessToken);

  // 2. Generate the recovery link via admin API
  const supabaseAdmin = getAdminSupabase();
  const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: validated.targetEmail,
    options: {
      redirectTo: validated.redirectTo,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    actionLink: linkData.properties.action_link,
  };
}
