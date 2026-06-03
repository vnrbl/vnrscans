import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { l as logAdminAction } from "./adminLog-FkQiQmmY.mjs";
import { D as Dialog, k as DialogTrigger, a as Button, l as DialogContent, m as DialogHeader, n as DialogTitle, p as DialogFooter, B as Badge, L as Label, I as Input, T as Textarea, S as Select, b as SelectTrigger, d as SelectValue, e as SelectContent, f as SelectItem, C as Checkbox } from "./router-1xbLZGbP.mjs";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-DznKw9Wr.mjs";
import { V as Plus, a0 as Megaphone, E as Eye, ae as EyeOff, ad as Pencil, W as Trash2 } from "../_libs/lucide-react.mjs";
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
async function getCurrentProfileId() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from("profiles").select("id").eq("user_id", auth.user.id).maybeSingle();
  if (error) {
    console.warn("getCurrentProfileId:", error.message);
    return null;
  }
  return data?.id ?? null;
}
const emptyForm = {
  title: "",
  content: "",
  type: "info",
  priority: "0",
  show_banner: true,
  banner_color: "#8B5CF6",
  icon: "📢",
  target_audience: "all",
  starts_at: "",
  expires_at: "",
  is_active: true
};
function AdminAnnouncements() {
  const qc = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState(emptyForm);
  const list = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("announcements").select("*").order("priority", {
        ascending: false
      }).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  const save = useMutation({
    mutationFn: async () => {
      const {
        data: auth
      } = await supabase.auth.getUser();
      const payload = {
        title: form.title,
        content: form.content,
        type: form.type,
        priority: parseInt(form.priority, 10),
        show_banner: form.show_banner,
        banner_color: form.banner_color,
        icon: form.icon || null,
        target_audience: form.target_audience,
        starts_at: form.starts_at || (/* @__PURE__ */ new Date()).toISOString(),
        expires_at: form.expires_at || null,
        is_active: form.is_active,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (editing?.id) {
        const {
          error
        } = await supabase.from("announcements").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAdminAction("update", "announcement", String(editing.id), {
          title: form.title
        });
      } else {
        const profileId = await getCurrentProfileId();
        const createdByCandidates = [auth.user?.id, profileId].filter((id) => Boolean(id));
        let data = null;
        let lastError = null;
        for (const createdBy of [...createdByCandidates, null]) {
          const insertPayload = createdBy ? {
            ...payload,
            created_by: createdBy
          } : payload;
          const result = await supabase.from("announcements").insert(insertPayload).select("id").single();
          if (!result.error) {
            data = result.data;
            lastError = null;
            break;
          }
          if (result.error.code === "23503") {
            lastError = result.error;
            continue;
          }
          throw result.error;
        }
        if (lastError || !data) throw lastError ?? new Error("Failed to create announcement");
        await logAdminAction("create", "announcement", data.id, {
          title: form.title
        });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Announcement updated" : "Announcement created");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      qc.invalidateQueries({
        queryKey: ["admin", "announcements"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const toggleActive = useMutation({
    mutationFn: async (item) => {
      const {
        error
      } = await supabase.from("announcements").update({
        is_active: !item.is_active,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", item.id);
      if (error) throw error;
      await logAdminAction(item.is_active ? "deactivate" : "activate", "announcement", item.id);
    },
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["admin", "announcements"]
    })
  });
  const remove = useMutation({
    mutationFn: async (id) => {
      const {
        error
      } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("delete", "announcement", id);
    },
    onSuccess: () => {
      toast.success("Announcement deleted");
      qc.invalidateQueries({
        queryKey: ["admin", "announcements"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: String(item.title ?? ""),
      content: String(item.content ?? ""),
      type: String(item.type ?? "info"),
      priority: String(item.priority ?? 0),
      show_banner: Boolean(item.show_banner),
      banner_color: String(item.banner_color ?? "#8B5CF6"),
      icon: String(item.icon ?? ""),
      target_audience: String(item.target_audience ?? "all"),
      starts_at: item.starts_at ? new Date(String(item.starts_at)).toISOString().slice(0, 16) : "",
      expires_at: item.expires_at ? new Date(String(item.expires_at)).toISOString().slice(0, 16) : "",
      is_active: Boolean(item.is_active)
    });
  };
  const typeColors = {
    info: "default",
    warning: "secondary",
    success: "outline",
    error: "destructive",
    event: "default"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Announcements" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Site-wide banners, maintenance notices, and events" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => {
          setEditing(null);
          setForm(emptyForm);
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
          "New Announcement"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[90vh] max-w-2xl overflow-y-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create Announcement" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AnnouncementFormFields, { form, setForm }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => save.mutate(), disabled: !form.title || !form.content || save.isPending, children: "Create" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-3", children: [
      list.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
      (list.data ?? []).length === 0 && !list.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border/40 bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "mx-auto h-10 w-10 text-muted-foreground opacity-50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "No announcements yet" })
      ] }),
      (list.data ?? []).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border/40 bg-card p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            item.icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: item.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: typeColors[item.type] ?? "outline", children: item.type }),
            !item.is_active && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: "Inactive" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
              "Priority ",
              item.priority
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: item.target_audience })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground line-clamp-2", children: item.content }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
            item.starts_at && `From ${new Date(item.starts_at).toLocaleString()}`,
            item.expires_at && ` · Until ${new Date(item.expires_at).toLocaleString()}`
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => toggleActive.mutate(item), children: item.is_active ? /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => openEdit(item), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-destructive" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Delete announcement?" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "This cannot be undone." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => remove.mutate(item.id), children: "Delete" })
              ] })
            ] })
          ] })
        ] })
      ] }) }, item.id))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editing, onOpenChange: (v) => {
      if (!v) {
        setEditing(null);
        setForm(emptyForm);
      }
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[90vh] max-w-2xl overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Edit Announcement" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AnnouncementFormFields, { form, setForm }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => save.mutate(), disabled: save.isPending, children: save.isPending ? "Saving..." : "Save changes" }) })
    ] }) })
  ] });
}
function AnnouncementFormFields({
  form,
  setForm
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Title *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.title, onChange: (e) => setForm({
        ...form,
        title: e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Content *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 4, value: form.content, onChange: (e) => setForm({
        ...form,
        content: e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.type, onValueChange: (v) => setForm({
          ...form,
          type: v
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "info", children: "Info" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "warning", children: "Warning" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "success", children: "Success" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "error", children: "Error" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "event", children: "Event" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Priority" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: form.priority, onChange: (e) => setForm({
          ...form,
          priority: e.target.value
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Target audience" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.target_audience, onValueChange: (v) => setForm({
          ...form,
          target_audience: v
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All users" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "vip", children: "VIP only" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "new_users", children: "New users (7 days)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "active_users", children: "Active readers" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Icon (emoji)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.icon, onChange: (e) => setForm({
          ...form,
          icon: e.target.value
        }), placeholder: "📢" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Banner color" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "color", value: form.banner_color, onChange: (e) => setForm({
        ...form,
        banner_color: e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Starts at" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "datetime-local", value: form.starts_at, onChange: (e) => setForm({
          ...form,
          starts_at: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Expires at (optional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "datetime-local", value: form.expires_at, onChange: (e) => setForm({
          ...form,
          expires_at: e.target.value
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { id: "show_banner", checked: form.show_banner, onCheckedChange: (v) => setForm({
        ...form,
        show_banner: !!v
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "show_banner", className: "cursor-pointer font-normal", children: "Show as site banner" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { id: "is_active", checked: form.is_active, onCheckedChange: (v) => setForm({
        ...form,
        is_active: !!v
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "is_active", className: "cursor-pointer font-normal", children: "Active" })
    ] })
  ] });
}
export {
  AdminAnnouncements as component
};
