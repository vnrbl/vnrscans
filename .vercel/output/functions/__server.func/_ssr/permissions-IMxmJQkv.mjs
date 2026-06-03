import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { l as logAdminAction } from "./adminLog-FkQiQmmY.mjs";
import { D as Dialog, k as DialogTrigger, a as Button, l as DialogContent, m as DialogHeader, n as DialogTitle, p as DialogFooter, B as Badge, L as Label, S as Select, b as SelectTrigger, d as SelectValue, e as SelectContent, f as SelectItem, I as Input, C as Checkbox } from "./router-1xbLZGbP.mjs";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-DznKw9Wr.mjs";
import { V as Plus, I as Shield, ad as Pencil, W as Trash2, y as UserPlus } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/vercel__analytics.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-dropdown-menu.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-menu.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-scroll-area.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/radix-ui__react-checkbox.mjs";
import "../_libs/date-fns.mjs";
import "../_libs/radix-ui__react-alert-dialog.mjs";
const emptyForm = {
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
  can_manage_settings: false
};
function AdminPermissions() {
  const qc = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = reactExports.useState(false);
  const [assignUserId, setAssignUserId] = reactExports.useState("");
  const [assignRole, setAssignRole] = reactExports.useState("moderator");
  const [editingItem, setEditingItem] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState(emptyForm);
  const permissions = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("role_permissions").select("*").order("role_name").order("resource_type");
      if (error) throw error;
      return data || [];
    }
  });
  const userRoles = useQuery({
    queryKey: ["admin", "user_roles"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("user_roles").select("*, profile:profiles!user_id(username, avatar_url)").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data || [];
    }
  });
  const createPermission = useMutation({
    mutationFn: async () => {
      const {
        error
      } = await supabase.from("role_permissions").insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Permission created");
      setOpen(false);
      setForm(emptyForm);
      qc.invalidateQueries({
        queryKey: ["admin", "permissions"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const updatePermission = useMutation({
    mutationFn: async () => {
      if (!editingItem) throw new Error("No permission selected");
      const {
        error
      } = await supabase.from("role_permissions").update({
        can_read: form.can_read,
        can_write: form.can_write,
        can_delete: form.can_delete,
        can_publish: form.can_publish,
        can_moderate: form.can_moderate,
        can_manage_users: form.can_manage_users,
        can_manage_roles: form.can_manage_roles,
        can_view_analytics: form.can_view_analytics,
        can_manage_settings: form.can_manage_settings,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", editingItem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Permission updated");
      setEditingItem(null);
      setForm(emptyForm);
      qc.invalidateQueries({
        queryKey: ["admin", "permissions"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const profiles = useQuery({
    queryKey: ["admin", "profiles-list"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("profiles").select("id, username").order("username").limit(500);
      if (error) throw error;
      return data ?? [];
    }
  });
  const assignUserRole = useMutation({
    mutationFn: async () => {
      const {
        error
      } = await supabase.from("user_roles").insert({
        user_id: assignUserId,
        role: assignRole
      });
      if (error) throw error;
      await logAdminAction("assign_role", "user_role", assignUserId, {
        role: assignRole
      });
    },
    onSuccess: () => {
      toast.success("Role assigned");
      setRoleDialogOpen(false);
      setAssignUserId("");
      qc.invalidateQueries({
        queryKey: ["admin", "user_roles"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const revokeRole = useMutation({
    mutationFn: async (row) => {
      const {
        error
      } = await supabase.from("user_roles").delete().eq("id", row.id);
      if (error) throw error;
      await logAdminAction("revoke_role", "user_role", row.user_id, {
        role: row.role
      });
    },
    onSuccess: () => {
      toast.success("Role removed");
      qc.invalidateQueries({
        queryKey: ["admin", "user_roles"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const deletePermission = useMutation({
    mutationFn: async (id) => {
      const {
        error
      } = await supabase.from("role_permissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Permission deleted");
      qc.invalidateQueries({
        queryKey: ["admin", "permissions"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const roleColors = {
    admin: "destructive",
    moderator: "default",
    uploader: "secondary",
    user: "outline"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Roles & Permissions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Manage user roles and access control" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
          "New Permission"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create Permission" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PermissionForm, { form, setForm }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => createPermission.mutate(), disabled: !form.role_name || createPermission.isPending, children: "Create" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-semibold", children: "Permission Rules" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          permissions.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
          (permissions.data || []).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border/40 bg-card p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-4 w-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: roleColors[item.role_name] || "outline", children: item.role_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "→" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: item.resource_type })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap gap-1", children: [
                item.can_read && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Read" }),
                item.can_write && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Write" }),
                item.can_delete && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Delete" }),
                item.can_publish && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Publish" }),
                item.can_moderate && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Moderate" }),
                item.can_manage_users && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Manage Users" }),
                item.can_manage_roles && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Manage Roles" }),
                item.can_view_analytics && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Analytics" }),
                item.can_manage_settings && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Settings" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => {
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
                  can_manage_settings: item.can_manage_settings
                });
              }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-destructive" }) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Delete this permission?" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
                      "This will remove the permission rule for ",
                      item.role_name,
                      " on ",
                      item.resource_type,
                      "."
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => deletePermission.mutate(item.id), children: "Delete" })
                  ] })
                ] })
              ] })
            ] })
          ] }) }, item.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "User Role Assignments" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: roleDialogOpen, onOpenChange: setRoleDialogOpen, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "mr-1 h-4 w-4" }),
              "Assign role"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Assign role to user" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "User" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: assignUserId, onValueChange: setAssignUserId, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select user..." }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: (profiles.data ?? []).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: p.id, children: [
                      "@",
                      p.username
                    ] }, p.id)) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Role" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: assignRole, onValueChange: (v) => setAssignRole(v), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "admin", children: "Admin" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "moderator", children: "Moderator" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "user", children: "User" })
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => assignUserRole.mutate(), disabled: !assignUserId || assignUserRole.isPending, children: "Assign" }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          userRoles.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
          (userRoles.data || []).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border/40 bg-card p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              item.profile?.avatar_url && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.profile.avatar_url, alt: item.profile.username, className: "h-8 w-8 rounded-full" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium", children: [
                  "@",
                  item.profile?.username
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: roleColors[item.role] || "outline", className: "text-xs", children: item.role })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: new Date(item.created_at).toLocaleDateString() }),
              item.role !== "user" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-destructive", onClick: () => revokeRole.mutate(item), children: "Revoke" })
            ] })
          ] }, item.id))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editingItem, onOpenChange: (v) => {
      if (!v) {
        setEditingItem(null);
        setForm(emptyForm);
      }
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Edit Permission" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PermissionForm, { form, setForm, isEdit: true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => updatePermission.mutate(), disabled: updatePermission.isPending, children: updatePermission.isPending ? "Saving..." : "Save changes" }) })
    ] }) })
  ] });
}
function PermissionForm({
  form,
  setForm,
  isEdit
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Role Name *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.role_name, onChange: (e) => setForm({
          ...form,
          role_name: e.target.value
        }), placeholder: "e.g., editor", disabled: isEdit })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Resource Type *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.resource_type, onValueChange: (v) => setForm({
          ...form,
          resource_type: v
        }), disabled: isEdit, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Resources" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "series", children: "Titles" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "chapter", children: "Chapters" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "comment", children: "Comments" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "user", children: "Users" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Permissions" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { id: "can_read", checked: form.can_read, onCheckedChange: (v) => setForm({
            ...form,
            can_read: !!v
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "can_read", className: "cursor-pointer font-normal", children: "Read - View content" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { id: "can_write", checked: form.can_write, onCheckedChange: (v) => setForm({
            ...form,
            can_write: !!v
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "can_write", className: "cursor-pointer font-normal", children: "Write - Create and edit content" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { id: "can_delete", checked: form.can_delete, onCheckedChange: (v) => setForm({
            ...form,
            can_delete: !!v
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "can_delete", className: "cursor-pointer font-normal", children: "Delete - Remove content" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { id: "can_publish", checked: form.can_publish, onCheckedChange: (v) => setForm({
            ...form,
            can_publish: !!v
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "can_publish", className: "cursor-pointer font-normal", children: "Publish - Make content public" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { id: "can_moderate", checked: form.can_moderate, onCheckedChange: (v) => setForm({
            ...form,
            can_moderate: !!v
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "can_moderate", className: "cursor-pointer font-normal", children: "Moderate - Review reports and flags" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { id: "can_manage_users", checked: form.can_manage_users, onCheckedChange: (v) => setForm({
            ...form,
            can_manage_users: !!v
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "can_manage_users", className: "cursor-pointer font-normal", children: "Manage Users - Ban, warn, edit users" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { id: "can_manage_roles", checked: form.can_manage_roles, onCheckedChange: (v) => setForm({
            ...form,
            can_manage_roles: !!v
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "can_manage_roles", className: "cursor-pointer font-normal", children: "Manage Roles - Assign roles to users" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { id: "can_view_analytics", checked: form.can_view_analytics, onCheckedChange: (v) => setForm({
            ...form,
            can_view_analytics: !!v
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "can_view_analytics", className: "cursor-pointer font-normal", children: "View Analytics - Access statistics" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { id: "can_manage_settings", checked: form.can_manage_settings, onCheckedChange: (v) => setForm({
            ...form,
            can_manage_settings: !!v
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "can_manage_settings", className: "cursor-pointer font-normal", children: "Manage Settings - Modify site configuration" })
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminPermissions as component
};
