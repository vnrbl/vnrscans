import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { D as Dialog, k as DialogTrigger, a as Button, l as DialogContent, m as DialogHeader, n as DialogTitle, p as DialogFooter, B as Badge, L as Label, I as Input, T as Textarea } from "./router-DeJJK2lY.mjs";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-BrcYtSjB.mjs";
import { V as Plus, ad as Pencil, W as Trash2 } from "../_libs/lucide-react.mjs";
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
function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
const emptyTagForm = {
  name: "",
  description: "",
  color: "#8B5CF6",
  icon: ""
};
function AdminTags() {
  const qc = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const [editingTag, setEditingTag] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState(emptyTagForm);
  const tags = useQuery({
    queryKey: ["admin", "tags"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tags").select("*").order("usage_count", {
        ascending: false
      });
      if (error) throw error;
      return data || [];
    }
  });
  const createTag = useMutation({
    mutationFn: async () => {
      const {
        error
      } = await supabase.from("tags").insert({
        name: form.name,
        slug: slugify(form.name),
        description: form.description || null,
        color: form.color,
        icon: form.icon || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tag created");
      setOpen(false);
      setForm(emptyTagForm);
      qc.invalidateQueries({
        queryKey: ["admin", "tags"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const updateTag = useMutation({
    mutationFn: async () => {
      if (!editingTag) throw new Error("No tag selected");
      const {
        error
      } = await supabase.from("tags").update({
        name: form.name,
        slug: slugify(form.name),
        description: form.description || null,
        color: form.color,
        icon: form.icon || null,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", editingTag.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tag updated");
      setEditingTag(null);
      setForm(emptyTagForm);
      qc.invalidateQueries({
        queryKey: ["admin", "tags"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const deleteTag = useMutation({
    mutationFn: async (id) => {
      const {
        error
      } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tag deleted");
      qc.invalidateQueries({
        queryKey: ["admin", "tags"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const predefinedColors = ["#EF4444", "#F97316", "#F59E0B", "#10B981", "#14B8A6", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#EC4899", "#000000", "#6B7280", "#DC2626", "#059669", "#2563EB"];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Genres Management" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Create and manage content genres" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
          "New Genre"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create Genre" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TagFormFields, { form, setForm, predefinedColors }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => createTag.mutate(), disabled: !form.name || createTag.isPending, children: "Create" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4", children: [
      tags.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: (tags.data || []).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group relative overflow-hidden rounded-lg border border-border/40 bg-card p-4 transition-all hover:border-primary/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-3 flex items-start justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          tag.icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: tag.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", style: {
              color: tag.color
            }, children: tag.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Used ",
              tag.usage_count,
              " times"
            ] })
          ] })
        ] }) }),
        tag.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-sm text-muted-foreground line-clamp-2", children: tag.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", style: {
            borderColor: tag.color,
            backgroundColor: `${tag.color}10`,
            color: tag.color
          }, children: tag.slug }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => {
              setEditingTag(tag);
              setForm({
                name: tag.name,
                description: tag.description || "",
                color: tag.color,
                icon: tag.icon || ""
              });
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 text-destructive" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { children: [
                    'Delete "',
                    tag.name,
                    '"?'
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "This will remove the genre from all titles. This cannot be undone." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => deleteTag.mutate(tag.id), children: "Delete" })
                ] })
              ] })
            ] })
          ] })
        ] })
      ] }, tag.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editingTag, onOpenChange: (v) => {
      if (!v) {
        setEditingTag(null);
        setForm(emptyTagForm);
      }
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Edit Genre" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TagFormFields, { form, setForm, predefinedColors }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => updateTag.mutate(), disabled: !form.name || updateTag.isPending, children: updateTag.isPending ? "Saving..." : "Save changes" }) })
    ] }) })
  ] });
}
function TagFormFields({
  form,
  setForm,
  predefinedColors
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Genre Name *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.name, onChange: (e) => setForm({
        ...form,
        name: e.target.value
      }), placeholder: "e.g., Action, Romance, Fantasy" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Description" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 3, value: form.description, onChange: (e) => setForm({
        ...form,
        description: e.target.value
      }), placeholder: "Brief description of this genre..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Icon/Emoji (Optional)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.icon, onChange: (e) => setForm({
        ...form,
        icon: e.target.value
      }), placeholder: "e.g., ⚔️ 🎭 ✨", maxLength: 2 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Add an emoji or leave empty" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Color" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: predefinedColors.map((color) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setForm({
        ...form,
        color
      }), className: `h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${form.color === color ? "border-foreground ring-2 ring-offset-2" : "border-border"}`, style: {
        backgroundColor: color
      }, title: color }, color)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "color", value: form.color, onChange: (e) => setForm({
          ...form,
          color: e.target.value
        }), className: "h-10 w-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "text", value: form.color, onChange: (e) => setForm({
          ...form,
          color: e.target.value
        }), placeholder: "#8B5CF6", className: "flex-1 font-mono text-sm" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border/40 bg-secondary/20 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: "Preview" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "gap-1", style: {
        borderColor: form.color,
        backgroundColor: `${form.color}15`,
        color: form.color
      }, children: [
        form.icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: form.icon }),
        form.name || "Genre Name"
      ] }) })
    ] })
  ] });
}
export {
  AdminTags as component
};
