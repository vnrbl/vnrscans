"use client";

import { Link, useNavigate } from "@/lib/router-compat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Trash2, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { $deleteUser } from "@/lib/api/admin.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


export default function AdminUsers() {
  const qc = useQueryClient();
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  const deleteUser = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const result = await $deleteUser({
        data: { targetUserId, accessToken: token },
      });
      if (!result.success) throw new Error(result.error || "Failed to delete user");
      return result;
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      setDeletingUser(null);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Filter users by search query
  const filteredUsers = (q.data ?? []).filter((u) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.username?.toLowerCase().includes(query) ||
      u.user_id?.toLowerCase().includes(query) ||
      u.bio?.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {q.data?.length ?? 0} total users
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card">
        {q.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading...</div>}
        {!q.isLoading && filteredUsers.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground text-center">
            {searchQuery ? "No users match your search" : "No users found"}
          </div>
        )}
        {filteredUsers.map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-sm">{u.username?.[0]?.toUpperCase()}</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{u.username}</div>
              <div className="text-xs text-muted-foreground truncate">{u.bio || u.user_id}</div>
            </div>
            <div className="text-xs text-muted-foreground hidden sm:block">{new Date(u.created_at).toLocaleDateString()}</div>
            <div className="flex items-center gap-1">
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeletingUser(u)}
                title="Delete user"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit user dialog */}
      <Dialog open={!!editingUser} onOpenChange={(v) => { if (!v) setEditingUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit user data</DialogTitle>
            <DialogDescription>Update the user's profile information.</DialogDescription>
          </DialogHeader>
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(v) => { if (!v) setDeletingUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete user permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will permanently delete the user{" "}
                <strong className="text-foreground">{deletingUser?.username}</strong> and all their data including:
              </span>
              <span className="block text-sm text-muted-foreground">
                • Auth account (they can no longer sign in)<br />
                • Profile data<br />
                • Role assignments<br />
                • Reading history and library
              </span>
              <span className="block font-medium text-destructive">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deletingUser?.user_id) {
                  deleteUser.mutate(deletingUser.user_id);
                }
              }}
              disabled={deleteUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? "Deleting..." : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
