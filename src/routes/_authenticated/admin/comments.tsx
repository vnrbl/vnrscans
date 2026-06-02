import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EyeOff, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/comments")({
  head: () => ({ meta: [{ title: "Admin · Comments" }] }),
  component: AdminComments,
});

function AdminComments() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "comments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("comments").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  const toggle = useMutation({
    mutationFn: async (c: any) => {
      const { error } = await supabase.from("comments").update({ is_hidden: !c.is_hidden }).eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "comments"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "comments"] }); },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Comments</h1>
      <div className="mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card">
        {(q.data ?? []).length === 0 && <div className="p-6 text-sm text-muted-foreground">No comments yet.</div>}
        {(q.data ?? []).map((c) => (
          <div key={c.id} className="flex items-start gap-3 p-3">
            <div className="flex-1">
              <div className="text-sm whitespace-pre-wrap">{c.content}</div>
              <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}{c.is_hidden ? " · hidden" : ""}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => toggle.mutate(c)}>{c.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button>
            <Button variant="ghost" size="icon" onClick={() => del.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}