import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "Admin · Reports" }] }),
  component: AdminReports,
});

function AdminReports() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("reports").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
      <div className="mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card/50">
        {(q.data ?? []).length === 0 && <div className="p-6 text-sm text-muted-foreground">No reports.</div>}
        {(q.data ?? []).map((r) => (
          <div key={r.id} className="flex items-start gap-3 p-3">
            <div className="flex-1">
              <div className="text-sm">{r.reason}</div>
              <div className="text-xs text-muted-foreground">{r.target_type} · {new Date(r.created_at).toLocaleString()}</div>
            </div>
            <Badge variant="outline">{r.status}</Badge>
            {r.status === "open" && (
              <>
                <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: r.id, status: "resolved" })}>Resolve</Button>
                <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: r.id, status: "dismissed" })}>Dismiss</Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}