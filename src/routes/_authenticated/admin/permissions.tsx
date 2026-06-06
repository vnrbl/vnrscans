import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/admin/permissions")({
  head: () => ({ meta: [{ title: "Admin · Permissions" }] }),
  component: AdminPermissions,
});

type PermissionForm = {
  role_name: string;
  resource_type: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_publish: boolean;
  can_moderate: boolean;
  can_manage_users: boolean;
  can_manage_roles: boolean;
  can_view_analytics: boolean;
  can_manage_settings: boolean;
};

const emptyForm: PermissionForm = {
  role_name: "",
  resource_type: "all",
  can_read: true,
  can_write: false,
  can_delete: false,
  can_publish: false,
  can_moderate: false,
  can_manage_users: false,
  can_manage_roles: false,
  can_view_analytics: false,
  can_manage_settings: false,
};

function AdminPermissions() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState<"admin" | "moderator" | "user">("moderator");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState<PermissionForm>(emptyForm);

  const permissions = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .order("role_name")
        .order("resource_type");
      if (error) throw error;
      return data || [];
    },
  });

  const userRoles = useQuery({
    queryKey: ["admin", "user_roles"],
    queryFn: async () => {
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (rolesError) throw rolesError;
      if (!rolesData || rolesData.length === 0) return [];

      const userIds = rolesData.map((r) => r.user_id).filter(Boolean);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(
        (profilesData ?? []).map((p) => [p.user_id, p])
      );

      return rolesData.map((r) => ({
        ...r,
        profile: profilesMap.get(r.user_id) || null,
      }));
    },
  });

  const groupedUserRoles = useMemo(() => {
    const groups: Record<string, {
      user_id: string;
      profile: { username: string; avatar_url?: string } | null;
      roles: Array<{ id: string; role: string; created_at: string }>;
    }> = {};

    (userRoles.data || []).forEach((item: any) => {
      if (!groups[item.user_id]) {
        groups[item.user_id] = {
          user_id: item.user_id,
          profile: item.profile,
          roles: [],
        };
      }
      groups[item.user_id].roles.push({
        id: item.id,
        role: item.role,
        created_at: item.created_at,
      });
    });

    return Object.values(groups).sort((a, b) => {
      const hasHigherRole = (user: typeof a) => user.roles.some((r) => r.role !== "user");
      if (hasHigherRole(a) && !hasHigherRole(b)) return -1;
      if (!hasHigherRole(a) && hasHigherRole(b)) return 1;
      return (a.profile?.username || "").localeCompare(b.profile?.username || "");
    });
  }, [userRoles.data]);

  const createPermission = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("role_permissions").insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Permission created");
      setOpen(false);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["admin", "permissions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePermission = useMutation({
    mutationFn: async () => {
      if (!editingItem) throw new Error("No permission selected");
      const { error } = await supabase
        .from("role_permissions")
        .update({
          can_read: form.can_read,
          can_write: form.can_write,
          can_delete: form.can_delete,
          can_publish: form.can_publish,
          can_moderate: form.can_moderate,
          can_manage_users: form.can_manage_users,
          can_manage_roles: form.can_manage_roles,
          can_view_analytics: form.can_view_analytics,
          can_manage_settings: form.can_manage_settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingItem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Permission updated");
      setEditingItem(null);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["admin", "permissions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const profiles = useQuery({
    queryKey: ["admin", "profiles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, username")
        .order("username")
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const assignUserRole = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_roles").insert({
        user_id: assignUserId,
        role: assignRole,
      });
      if (error) throw error;
      await logAdminAction("assign_role", "user_role", assignUserId, { role: assignRole });
    },
    onSuccess: () => {
      toast.success("Role assigned");
      setRoleDialogOpen(false);
      setAssignUserId("");
      qc.invalidateQueries({ queryKey: ["admin", "user_roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeRole = useMutation({
    mutationFn: async (row: { id: string; user_id: string; role: string }) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", row.id);
      if (error) throw error;
      await logAdminAction("revoke_role", "user_role", row.user_id, { role: row.role });
    },
    onSuccess: () => {
      toast.success("Role removed");
      qc.invalidateQueries({ queryKey: ["admin", "user_roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePermission = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("role_permissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Permission deleted");
      qc.invalidateQueries({ queryKey: ["admin", "permissions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleColors: Record<string, string> = {
    admin: "destructive",
    moderator: "default",
    uploader: "secondary",
    user: "outline",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Manage user roles and access control</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              New Permission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Permission</DialogTitle>
            </DialogHeader>
            <PermissionForm form={form} setForm={setForm} />
            <DialogFooter>
              <Button onClick={() => createPermission.mutate()} disabled={!form.role_name || createPermission.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Permission Rules */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Permission Rules</h2>
          <div className="space-y-3">
            {permissions.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

            {(permissions.data || []).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/40 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <Badge variant={roleColors[item.role_name] as any || "outline"}>
                        {item.role_name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">→</span>
                      <Badge variant="outline">{item.resource_type}</Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.can_read && <Badge variant="secondary" className="text-xs">Read</Badge>}
                      {item.can_write && <Badge variant="secondary" className="text-xs">Write</Badge>}
                      {item.can_delete && <Badge variant="secondary" className="text-xs">Delete</Badge>}
                      {item.can_publish && <Badge variant="secondary" className="text-xs">Publish</Badge>}
                      {item.can_moderate && <Badge variant="secondary" className="text-xs">Moderate</Badge>}
                      {item.can_manage_users && <Badge variant="secondary" className="text-xs">Manage Users</Badge>}
                      {item.can_manage_roles && <Badge variant="secondary" className="text-xs">Manage Roles</Badge>}
                      {item.can_view_analytics && <Badge variant="secondary" className="text-xs">Analytics</Badge>}
                      {item.can_manage_settings && <Badge variant="secondary" className="text-xs">Settings</Badge>}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingItem(item);
                        setForm({
                          role_name: item.role_name,
                          resource_type: item.resource_type,
                          can_read: item.can_read,
                          can_write: item.can_write,
                          can_delete: item.can_delete,
                          can_publish: item.can_publish,
                          can_moderate: item.can_moderate,
                          can_manage_users: item.can_manage_users,
                          can_manage_roles: item.can_manage_roles,
                          can_view_analytics: item.can_view_analytics,
                          can_manage_settings: item.can_manage_settings,
                        });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this permission?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the permission rule for {item.role_name} on {item.resource_type}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePermission.mutate(item.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Roles */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">User Role Assignments</h2>
          </div>
          <div className="space-y-2">
            {userRoles.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

            {groupedUserRoles.map((group) => (
              <div
                key={group.user_id}
                className="flex items-center justify-between rounded-lg border border-border/40 bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  {group.profile?.avatar_url && (
                    <img 
                      src={group.profile.avatar_url} 
                      alt={group.profile.username} 
                      className="h-8 w-8 rounded-full border border-border/50"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold">@{group.profile?.username || "unknown"}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {group.roles.map((r) => (
                        <Badge key={r.id} variant={roleColors[r.role] as any || "outline"} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                          {r.role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1 items-end">
                    {group.roles
                      .filter((r) => r.role !== "user")
                      .map((r) => (
                        <Button
                          key={r.id}
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 font-bold uppercase tracking-wide transition-colors"
                          onClick={() => revokeRole.mutate({ id: r.id, user_id: group.user_id, role: r.role })}
                        >
                          Revoke {r.role}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!editingItem} onOpenChange={(v) => { if (!v) { setEditingItem(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
          </DialogHeader>
          <PermissionForm form={form} setForm={setForm} isEdit />
          <DialogFooter>
            <Button onClick={() => updatePermission.mutate()} disabled={updatePermission.isPending}>
              {updatePermission.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PermissionForm({ form, setForm, isEdit }: { form: PermissionForm; setForm: (form: PermissionForm) => void; isEdit?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Role Name *</Label>
          <Input
            value={form.role_name}
            onChange={(e) => setForm({ ...form, role_name: e.target.value })}
            placeholder="e.g., editor"
            disabled={isEdit}
          />
        </div>

        <div>
          <Label>Resource Type *</Label>
          <Select 
            value={form.resource_type} 
            onValueChange={(v) => setForm({ ...form, resource_type: v })}
            disabled={isEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="series">Titles</SelectItem>
              <SelectItem value="chapter">Chapters</SelectItem>
              <SelectItem value="comment">Comments</SelectItem>
              <SelectItem value="user">Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Permissions</Label>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="can_read"
              checked={form.can_read}
              onCheckedChange={(v) => setForm({ ...form, can_read: !!v })}
            />
            <Label htmlFor="can_read" className="cursor-pointer font-normal">
              Read - View content
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="can_write"
              checked={form.can_write}
              onCheckedChange={(v) => setForm({ ...form, can_write: !!v })}
            />
            <Label htmlFor="can_write" className="cursor-pointer font-normal">
              Write - Create and edit content
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="can_delete"
              checked={form.can_delete}
              onCheckedChange={(v) => setForm({ ...form, can_delete: !!v })}
            />
            <Label htmlFor="can_delete" className="cursor-pointer font-normal">
              Delete - Remove content
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="can_publish"
              checked={form.can_publish}
              onCheckedChange={(v) => setForm({ ...form, can_publish: !!v })}
            />
            <Label htmlFor="can_publish" className="cursor-pointer font-normal">
              Publish - Make content public
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="can_moderate"
              checked={form.can_moderate}
              onCheckedChange={(v) => setForm({ ...form, can_moderate: !!v })}
            />
            <Label htmlFor="can_moderate" className="cursor-pointer font-normal">
              Moderate - Review reports and flags
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="can_manage_users"
              checked={form.can_manage_users}
              onCheckedChange={(v) => setForm({ ...form, can_manage_users: !!v })}
            />
            <Label htmlFor="can_manage_users" className="cursor-pointer font-normal">
              Manage Users - Ban, warn, edit users
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="can_manage_roles"
              checked={form.can_manage_roles}
              onCheckedChange={(v) => setForm({ ...form, can_manage_roles: !!v })}
            />
            <Label htmlFor="can_manage_roles" className="cursor-pointer font-normal">
              Manage Roles - Assign roles to users
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="can_view_analytics"
              checked={form.can_view_analytics}
              onCheckedChange={(v) => setForm({ ...form, can_view_analytics: !!v })}
            />
            <Label htmlFor="can_view_analytics" className="cursor-pointer font-normal">
              View Analytics - Access statistics
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="can_manage_settings"
              checked={form.can_manage_settings}
              onCheckedChange={(v) => setForm({ ...form, can_manage_settings: !!v })}
            />
            <Label htmlFor="can_manage_settings" className="cursor-pointer font-normal">
              Manage Settings - Modify site configuration
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
