import { supabase } from "@/integrations/supabase/client";

export async function logAdminAction(
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const { error } = await supabase.from("admin_activity_logs").insert({
    actor_id: auth.user.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
    details: (details ?? {}) as any,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });

  if (error && error.code !== "42P01") {
    console.warn("logAdminAction:", error.message);
  }
}
