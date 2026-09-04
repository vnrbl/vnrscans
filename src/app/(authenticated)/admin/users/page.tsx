"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
  Shield,
  Ban,
  ShieldOff,
  Crown,
  Download,
  Flame,
  ChevronDown,
  KeyRound,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { $deleteUser, $listUserEmails, $generateResetPasswordLink, $setUserBan } from "@/lib/api/admin.actions";
import { logAdminAction } from "@/lib/adminLog";
import { Button } from "@/components/ui/button";
import { formatAppDate } from "@/lib/date";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type ProfileRow = {
  id: string;
  user_id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  is_banned: boolean | null;
  ban_reason: string | null;
  is_vip: boolean | null;
  user_level: number | null;
  reading_streak: number | null;
  last_read_date: string | null;
};

const ASSIGNABLE_ROLES = ["admin", "moderator", "uploader", "user"] as const;
type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

const roleBadgeVariant: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  admin: "destructive",
  moderator: "default",
  uploader: "secondary",
  user: "outline",
};

type StatusFilter = "all" | "admin" | "moderator" | "vip" | "banned";

export default function AdminUsers() {
  const qc = useQueryClient();
  const [editingUser, setEditingUser] = useState<ProfileRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<ProfileRow | null>(null);
  const [banningUser, setBanningUser] = useState<ProfileRow | null>(null);
  const [resettingUser, setResettingUser] = useState<ProfileRow | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [form, setForm] = useState({ username: "", bio: "", avatar_url: "" });

  /* ---------------------------------------------------------------- */
  /*  Data: profiles, roles, and (admin-only) emails                  */
  /* ---------------------------------------------------------------- */

  const q = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,username,bio,avatar_url,created_at,user_id,is_banned,ban_reason,is_vip,user_level,reading_streak,last_read_date"
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });

  const rolesQuery = useQuery({
    queryKey: ["admin", "users", "roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("id,user_id,role");
      if (error) throw error;
      const map = new Map<string, Array<{ id: string; role: string }>>();
      (data ?? []).forEach((r) => {
        const list = map.get(r.user_id) ?? [];
        list.push({ id: r.id, role: r.role });
        map.set(r.user_id, list);
      });
      return map;
    },
  });

  const emailsQuery = useQuery({
    queryKey: ["admin", "users", "emails", q.data?.length ?? 0],
    enabled: !!q.data && q.data.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const targetUserIds = (q.data ?? []).map((u) => u.user_id).filter(Boolean);
      const result = await $listUserEmails({ data: { targetUserIds, accessToken: token } });
      if (!result.success) throw new Error(result.error || "Failed to load emails");
      return result.emails as Record<string, string>;
    },
  });

  const rolesFor = (userId: string) => rolesQuery.data?.get(userId) ?? [];
  const emailFor = (userId: string) => emailsQuery.data?.[userId] ?? "";

  /* ---------------------------------------------------------------- */
  /*  Mutations                                                        */
  /* ---------------------------------------------------------------- */

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
      await logAdminAction("update", "user", editingUser.id, { username: form.username });
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
      await logAdminAction("delete", "user", targetUserId);
      return result;
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      setDeletingUser(null);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Add or remove a role for a user, then refresh the role map.
  const toggleRole = useMutation({
    mutationFn: async ({
      user,
      role,
      hasRole,
    }: {
      user: ProfileRow;
      role: AssignableRole;
      hasRole: boolean;
    }) => {
      if (hasRole) {
        const existing = rolesFor(user.user_id).find((r) => r.role === role);
        if (!existing) return;
        const { error } = await supabase.from("user_roles").delete().eq("id", existing.id);
        if (error) throw error;
        await logAdminAction("revoke_role", "user_role", user.user_id, { role });
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: user.user_id, role });
        if (error) throw error;
        await logAdminAction("assign_role", "user_role", user.user_id, { role });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users", "roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Ban (with reason) or unban a user via the is_banned flag.
  const setBan = useMutation({
    mutationFn: async ({ user, banned, reason }: { user: ProfileRow; banned: boolean; reason?: string }) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("No active session");

      const res = await $setUserBan({
        data: {
          targetUserId: user.user_id,
          banned,
          reason: banned ? reason : undefined,
          accessToken: token,
        },
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to update user ban status");
      }

      await logAdminAction(banned ? "ban_user" : "unban_user", "profile", user.user_id, {
        reason: banned ? reason : undefined,
      });
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.banned ? "User banned" : "User unbanned");
      setBanningUser(null);
      setBanReason("");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSendResetEmail = async () => {
    if (!resettingUser) return;
    setIsSending(true);
    try {
      const userEmail = emailFor(resettingUser.user_id);
      if (!userEmail) {
        toast.error("User email not found");
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Password reset email sent to ${userEmail}`);
        setResettingUser(null);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateResetLink = async () => {
    if (!resettingUser) return;
    setIsGenerating(true);
    setGeneratedLink(null);
    try {
      const userEmail = emailFor(resettingUser.user_id);
      if (!userEmail) {
        toast.error("User email not found");
        return;
      }
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      const res = await $generateResetPasswordLink({
        data: {
          targetEmail: userEmail,
          redirectTo: `${window.location.origin}/auth/reset-password`,
          accessToken: token,
        },
      });
      if (!res.success) {
        toast.error(res.error || "Failed to generate link");
      } else {
        setGeneratedLink(res.actionLink ?? null);
        toast.success("Password reset link generated successfully");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Filtering                                                        */
  /* ---------------------------------------------------------------- */

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (q.data ?? []).filter((u) => {
      if (query) {
        const matches =
          u.username?.toLowerCase().includes(query) ||
          u.user_id?.toLowerCase().includes(query) ||
          u.bio?.toLowerCase().includes(query) ||
          emailFor(u.user_id).toLowerCase().includes(query);
        if (!matches) return false;
      }
      switch (statusFilter) {
        case "admin":
          return rolesFor(u.user_id).some((r) => r.role === "admin");
        case "moderator":
          return rolesFor(u.user_id).some((r) => r.role === "moderator");
        case "vip":
          return !!u.is_vip;
        case "banned":
          return !!u.is_banned;
        default:
          return true;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, searchQuery, statusFilter, rolesQuery.data, emailsQuery.data]);

  /* ---------------------------------------------------------------- */
  /*  CSV export (respects current filter)                            */
  /* ---------------------------------------------------------------- */

  const exportCsv = () => {
    const rows = filteredUsers;
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const header = [
      "username",
      "email",
      "user_id",
      "roles",
      "level",
      "reading_streak",
      "is_vip",
      "is_banned",
      "ban_reason",
      "last_read_date",
      "created_at",
    ];
    const escape = (val: unknown) => {
      const s = val == null ? "" : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = rows.map((u) =>
      [
        u.username ?? "",
        emailFor(u.user_id),
        u.user_id,
        rolesFor(u.user_id)
          .map((r) => r.role)
          .join("|"),
        u.user_level ?? "",
        u.reading_streak ?? "",
        u.is_vip ? "yes" : "no",
        u.is_banned ? "yes" : "no",
        u.ban_reason ?? "",
        u.last_read_date ?? "",
        u.created_at,
      ]
        .map(escape)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} users`);
  };

  const filterTabs: Array<{ key: StatusFilter; label: string }> = [
    { key: "all", label: "All" },
    { key: "admin", label: "Admins" },
    { key: "moderator", label: "Moderators" },
    { key: "vip", label: "VIP" },
    { key: "banned", label: "Banned" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {q.data?.length ?? 0} total users
            {statusFilter !== "all" && ` · ${filteredUsers.length} shown`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filteredUsers.length === 0}>
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
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
      </div>

      {/* Filter chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filterTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatusFilter(t.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === t.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/40 text-muted-foreground hover:bg-secondary/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 divide-y divide-border/40 rounded-lg border border-border/40 bg-card">
        {q.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading...</div>}
        {!q.isLoading && filteredUsers.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all" ? "No users match your filters" : "No users found"}
          </div>
        )}
        {filteredUsers.map((u) => {
          const userRoles = rolesFor(u.user_id);
          const email = emailFor(u.user_id);
          return (
            <div key={u.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-secondary/30">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-sm">
                  {u.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{u.username}</span>
                  {u.is_vip && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-label="VIP" />}
                  {u.is_banned && (
                    <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                      Banned
                    </Badge>
                  )}
                  {userRoles
                    .filter((r) => r.role !== "user")
                    .map((r) => (
                      <Badge
                        key={r.id}
                        variant={roleBadgeVariant[r.role] ?? "outline"}
                        className="h-4 px-1.5 text-[10px]"
                      >
                        {r.role}
                      </Badge>
                    ))}
                </div>
                <div className="truncate text-xs text-muted-foreground">{email || u.bio || u.user_id}</div>
              </div>

              {/* Stats */}
              <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
                <span title="Level">Lv {u.user_level ?? 1}</span>
                {(u.reading_streak ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5" title="Reading streak">
                    <Flame className="h-3 w-3 text-orange-400" />
                    {u.reading_streak}
                  </span>
                )}
                <span title="Last read">
                  {u.last_read_date ? formatAppDate(u.last_read_date) : "—"}
                </span>
              </div>

              <div className="hidden text-xs text-muted-foreground sm:block">
                {formatAppDate(u.created_at)}
              </div>

              <div className="flex items-center gap-1">
                {/* Role management */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" title="Manage roles">
                      <Shield className="h-4 w-4" />
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Roles</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ASSIGNABLE_ROLES.map((role) => {
                      const hasRole = userRoles.some((r) => r.role === role);
                      return (
                        <DropdownMenuCheckboxItem
                          key={role}
                          checked={hasRole}
                          disabled={toggleRole.isPending}
                          onSelect={(e) => {
                            e.preventDefault();
                            toggleRole.mutate({ user: u, role, hasRole });
                          }}
                          className="capitalize"
                        >
                          {role}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Ban / unban */}
                {u.is_banned ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setBan.mutate({ user: u, banned: false })}
                    disabled={setBan.isPending}
                    title="Unban user"
                    className="text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
                  >
                    <ShieldOff className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setBanningUser(u);
                      setBanReason("");
                    }}
                    title="Ban user"
                    className="text-amber-500 hover:bg-amber-500/10 hover:text-amber-500"
                  >
                    <Ban className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setResettingUser(u);
                    setGeneratedLink(null);
                  }}
                  title="Reset Password"
                  className="text-indigo-400 hover:bg-indigo-400/10 hover:text-indigo-400"
                >
                  <KeyRound className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingUser(u);
                    setForm({
                      username: u.username ?? "",
                      bio: u.bio ?? "",
                      avatar_url: u.avatar_url ?? "",
                    });
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
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit user dialog */}
      <Dialog open={!!editingUser} onOpenChange={(v) => { if (!v) setEditingUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit user data</DialogTitle>
            <DialogDescription>Update the user&apos;s profile information.</DialogDescription>
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

      {/* Ban dialog (with reason) */}
      <Dialog open={!!banningUser} onOpenChange={(v) => { if (!v) { setBanningUser(null); setBanReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-amber-500" />
              Ban {banningUser?.username}
            </DialogTitle>
            <DialogDescription>
              The user will be signed out and blocked from using the site. You can unban them later.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Reason (optional)</Label>
            <Textarea
              rows={3}
              placeholder="e.g. Repeated spam in comments"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBanningUser(null); setBanReason(""); }}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-600/90"
              disabled={setBan.isPending}
              onClick={() => banningUser && setBan.mutate({ user: banningUser, banned: true, reason: banReason })}
            >
              {setBan.isPending ? "Banning..." : "Ban user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resettingUser} onOpenChange={(v) => { if (!v) { setResettingUser(null); setGeneratedLink(null); } }}>
        <DialogContent className="max-w-md border border-border/40 bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <KeyRound className="h-5 w-5 text-indigo-400" />
              Reset Password: {resettingUser?.username}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose how you would like to reset the password for {resettingUser ? (emailFor(resettingUser.user_id) || resettingUser.username) : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Option 1: Send email */}
            <div className="rounded border border-border/40 p-4 space-y-3 bg-secondary/10">
              <div>
                <h4 className="text-sm font-semibold text-white">Option 1: Send Reset Email</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Supabase will send an automated password reset link directly to the user&apos;s email address.
                </p>
              </div>
              <Button
                className="w-full text-xs font-semibold uppercase tracking-wider cursor-pointer"
                variant="outline"
                disabled={isSending || isGenerating}
                onClick={handleSendResetEmail}
              >
                {isSending ? "Sending..." : "Send Reset Email"}
              </Button>
            </div>

            {/* Option 2: Generate link */}
            <div className="rounded border border-border/40 p-4 space-y-3 bg-secondary/10">
              <div>
                <h4 className="text-sm font-semibold text-white">Option 2: Generate Manual Link</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a manual password recovery link. Useful if email delivery is slow or disabled.
                </p>
              </div>
              <Button
                className="w-full text-xs font-semibold uppercase tracking-wider cursor-pointer"
                variant="outline"
                disabled={isSending || isGenerating}
                onClick={handleGenerateResetLink}
              >
                {isGenerating ? "Generating..." : "Generate Link"}
              </Button>

              {generatedLink && (
                <div className="mt-3 space-y-2">
                  <Label className="text-[10px] uppercase tracking-wider font-semibold text-neutral-300">Recovery Link</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={generatedLink}
                      className="text-xs h-9 bg-neutral-950 font-mono text-white border-neutral-800"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shrink-0 h-9 cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        toast.success("Link copied to clipboard!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button className="cursor-pointer" variant="ghost" onClick={() => { setResettingUser(null); setGeneratedLink(null); }}>
              Close
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
              <span className="block font-medium text-destructive">This action cannot be undone.</span>
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
