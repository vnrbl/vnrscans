import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Admin · Users" }] }),
  component: AdminUsers,
});

function AdminUsers() {
  const q = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,username,bio,avatar_url,created_at,user_id")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Users</h1>
      <div className="mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card/50">
        {(q.data ?? []).map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-sm">{u.username?.[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{u.username}</div>
              <div className="text-xs text-muted-foreground truncate">{u.bio}</div>
            </div>
            <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}