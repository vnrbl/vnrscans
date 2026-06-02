import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Admin · Users" }] }),
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [form, setForm] = useState({ username: "", bio: "", avatar_url: "" });

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

  const updateUser = useMutation({
    mutationFn: async () => {
      if (!editingUser) throw new Error("No user selected");
      const { error } = await supabase
        .from("profiles")
        .update({
          username: form.username,
          bio: form.bio || null,
          avatar_url: form.avatar_url || null,
        })
        .eq("id", editingUser.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User updated");
      setEditingUser(null);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Users</h1>
      <div className="mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card">
        {q.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading...</div>}
        {(q.data ?? []).map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-3">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-sm">{u.username?.[0]?.toUpperCase()}</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{u.username}</div>
              <div className="text-xs text-muted-foreground truncate">{u.bio || u.user_id}</div>
            </div>
            <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingUser(u);
                setForm({ username: u.username ?? "", bio: u.bio ?? "", avatar_url: u.avatar_url ?? "" });
              }}
              title="Edit user"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!editingUser} onOpenChange={(v) => { if (!v) setEditingUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit user data</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <Label>Avatar URL</Label>
              <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => updateUser.mutate()} disabled={!form.username || updateUser.isPending}>
              {updateUser.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
