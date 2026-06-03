import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { D as Dialog, k as DialogTrigger, a as Button, l as DialogContent, m as DialogHeader, n as DialogTitle, p as DialogFooter, B as Badge, L as Label, I as Input, T as Textarea, S as Select, b as SelectTrigger, d as SelectValue, e as SelectContent, f as SelectItem, C as Checkbox } from "./router-DABr79Tj.mjs";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-BBRpTqHQ.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BV6Pu7lT.mjs";
import { V as Plus, ad as Pencil, W as Trash2, al as Zap, r as Star } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-tabs.mjs";
const emptyAchievementForm = {
  name: "",
  description: "",
  icon: "🏆",
  category: "general",
  requirement_type: "chapters_read",
  requirement_value: "1",
  xp_reward: "10",
  badge_color: "#8B5CF6",
  rarity: "common",
  is_secret: false
};
const emptyXPEventForm = {
  name: "",
  description: "",
  xp_multiplier: "2.0",
  starts_at: "",
  ends_at: "",
  applies_to: "all"
};
function AdminGamification() {
  const qc = useQueryClient();
  const [achievementDialog, setAchievementDialog] = reactExports.useState(false);
  const [xpEventDialog, setXPEventDialog] = reactExports.useState(false);
  const [editingAchievement, setEditingAchievement] = reactExports.useState(null);
  const [editingXPEvent, setEditingXPEvent] = reactExports.useState(null);
  const [achievementForm, setAchievementForm] = reactExports.useState(emptyAchievementForm);
  const [xpEventForm, setXPEventForm] = reactExports.useState(emptyXPEventForm);
  const achievements = useQuery({
    queryKey: ["admin", "achievements"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("achievements").select("*, unlocks:user_achievements(count)").order("rarity").order("requirement_value");
      if (error) {
        console.error("Error fetching achievements:", error);
        if (error.code === "42P01") {
          return [];
        }
        throw error;
      }
      return data || [];
    },
    retry: false,
    staleTime: 3 * 60 * 1e3
    // Cache for 3 minutes
  });
  const xpEvents = useQuery({
    queryKey: ["admin", "xp_events"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("xp_events").select("*").order("starts_at", {
        ascending: false
      });
      if (error) {
        console.error("Error fetching XP events:", error);
        if (error.code === "42P01") {
          return [];
        }
        throw error;
      }
      return data || [];
    },
    retry: false,
    staleTime: 3 * 60 * 1e3
    // Cache for 3 minutes
  });
  const createAchievement = useMutation({
    mutationFn: async () => {
      const {
        error
      } = await supabase.from("achievements").insert({
        name: achievementForm.name.trim(),
        description: achievementForm.description?.trim() || null,
        icon: achievementForm.icon || null,
        category: achievementForm.category,
        requirement_type: achievementForm.requirement_type,
        requirement_value: parseInt(achievementForm.requirement_value, 10) || 1,
        xp_reward: parseInt(achievementForm.xp_reward, 10) || 10,
        badge_color: achievementForm.badge_color,
        rarity: achievementForm.rarity,
        is_secret: achievementForm.is_secret,
        is_active: true
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Achievement created");
      setAchievementDialog(false);
      setAchievementForm(emptyAchievementForm);
      qc.invalidateQueries({
        queryKey: ["admin", "achievements"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const updateAchievement = useMutation({
    mutationFn: async () => {
      if (!editingAchievement) throw new Error("No achievement selected");
      const {
        error
      } = await supabase.from("achievements").update({
        name: achievementForm.name,
        description: achievementForm.description,
        icon: achievementForm.icon || null,
        category: achievementForm.category,
        requirement_type: achievementForm.requirement_type,
        requirement_value: parseInt(achievementForm.requirement_value),
        xp_reward: parseInt(achievementForm.xp_reward),
        badge_color: achievementForm.badge_color,
        rarity: achievementForm.rarity,
        is_secret: achievementForm.is_secret
      }).eq("id", editingAchievement.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Achievement updated");
      setEditingAchievement(null);
      setAchievementForm(emptyAchievementForm);
      qc.invalidateQueries({
        queryKey: ["admin", "achievements"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const deleteAchievement = useMutation({
    mutationFn: async (id) => {
      const {
        error
      } = await supabase.from("achievements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Achievement deleted");
      qc.invalidateQueries({
        queryKey: ["admin", "achievements"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const createXPEvent = useMutation({
    mutationFn: async () => {
      const {
        error
      } = await supabase.from("xp_events").insert({
        name: xpEventForm.name.trim(),
        description: xpEventForm.description?.trim() || null,
        xp_multiplier: parseFloat(xpEventForm.xp_multiplier) || 2,
        starts_at: xpEventForm.starts_at ? new Date(xpEventForm.starts_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
        ends_at: xpEventForm.ends_at ? new Date(xpEventForm.ends_at).toISOString() : null,
        applies_to: xpEventForm.applies_to,
        is_active: true
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("XP Event created");
      setXPEventDialog(false);
      setXPEventForm(emptyXPEventForm);
      qc.invalidateQueries({
        queryKey: ["admin", "xp_events"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const toggleXPEvent = useMutation({
    mutationFn: async (item) => {
      const {
        error
      } = await supabase.from("xp_events").update({
        is_active: !item.is_active
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["admin", "xp_events"]
    })
  });
  const deleteXPEvent = useMutation({
    mutationFn: async (id) => {
      const {
        error
      } = await supabase.from("xp_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("XP Event deleted");
      qc.invalidateQueries({
        queryKey: ["admin", "xp_events"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const rarityColors = {
    common: "secondary",
    rare: "default",
    epic: "destructive",
    legendary: "outline"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Gamification Manager" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Manage achievements, XP events, and rewards" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "achievements", className: "mt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "achievements", children: "Achievements" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "xp_events", children: "XP Events" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "achievements", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
            achievements.data?.length || 0,
            " achievements"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: achievementDialog, onOpenChange: setAchievementDialog, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
              "New Achievement"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create Achievement" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AchievementFormFields, { form: achievementForm, setForm: setAchievementForm }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => createAchievement.mutate(), disabled: !achievementForm.name || createAchievement.isPending, children: "Create" }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
          achievements.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
          (achievements.data || []).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border/40 bg-card p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-lg text-2xl", style: {
                backgroundColor: item.badge_color + "20"
              }, children: item.icon }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: item.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: rarityColors[item.rarity], children: item.rarity }),
                  item.is_secret && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: "🔒 Secret" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: item.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: item.category }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "• ",
                    item.requirement_type.replace("_", " "),
                    ": ",
                    item.requirement_value
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "• +",
                    item.xp_reward,
                    " XP"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "• ",
                    Array.isArray(item.unlocks) ? item.unlocks.length : 0,
                    " unlocked"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => {
                setEditingAchievement(item);
                setAchievementForm({
                  name: item.name,
                  description: item.description,
                  icon: item.icon || "🏆",
                  category: item.category,
                  requirement_type: item.requirement_type,
                  requirement_value: String(item.requirement_value),
                  xp_reward: String(item.xp_reward),
                  badge_color: item.badge_color,
                  rarity: item.rarity,
                  is_secret: item.is_secret
                });
              }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-destructive" }) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { children: [
                      'Delete "',
                      item.name,
                      '"?'
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "This will permanently remove this achievement. Users who have unlocked it will lose it." })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => deleteAchievement.mutate(item.id), children: "Delete" })
                  ] })
                ] })
              ] })
            ] })
          ] }) }, item.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "xp_events", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
            xpEvents.data?.length || 0,
            " events"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: xpEventDialog, onOpenChange: setXPEventDialog, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
              "New XP Event"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create XP Event" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(XPEventFormFields, { form: xpEventForm, setForm: setXPEventForm }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => createXPEvent.mutate(), disabled: !xpEventForm.name || createXPEvent.isPending, children: "Create" }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          xpEvents.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
          (xpEvents.data || []).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border/40 bg-card p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-5 w-5 text-violet-500" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: item.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: item.is_active ? "default" : "outline", children: item.is_active ? "Active" : "Inactive" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
                    item.xp_multiplier,
                    "x XP"
                  ] })
                ] }),
                item.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: item.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "Starts: ",
                    new Date(item.starts_at).toLocaleString()
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "Ends: ",
                    new Date(item.ends_at).toLocaleString()
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: item.applies_to })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => toggleXPEvent.mutate(item), title: item.is_active ? "Deactivate" : "Activate", children: item.is_active ? /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-4 w-4 fill-yellow-500 text-yellow-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-destructive" }) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { children: [
                      'Delete "',
                      item.name,
                      '"?'
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "This will permanently remove this XP event." })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => deleteXPEvent.mutate(item.id), children: "Delete" })
                  ] })
                ] })
              ] })
            ] })
          ] }) }, item.id))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editingAchievement, onOpenChange: (v) => {
      if (!v) {
        setEditingAchievement(null);
        setAchievementForm(emptyAchievementForm);
      }
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Edit Achievement" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AchievementFormFields, { form: achievementForm, setForm: setAchievementForm }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => updateAchievement.mutate(), disabled: !achievementForm.name || updateAchievement.isPending, children: updateAchievement.isPending ? "Saving..." : "Save changes" }) })
    ] }) })
  ] });
}
function AchievementFormFields({
  form,
  setForm
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Name *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.name, onChange: (e) => setForm({
          ...form,
          name: e.target.value
        }), placeholder: "Achievement name" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Icon" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.icon, onChange: (e) => setForm({
          ...form,
          icon: e.target.value
        }), placeholder: "🏆", maxLength: 2 })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Description *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 2, value: form.description, onChange: (e) => setForm({
        ...form,
        description: e.target.value
      }), placeholder: "Achievement description..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Category" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.category, onValueChange: (v) => setForm({
          ...form,
          category: v
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "general", children: "General" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "reading", children: "Reading" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "social", children: "Social" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "milestone", children: "Milestone" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "special", children: "Special" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Rarity" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.rarity, onValueChange: (v) => setForm({
          ...form,
          rarity: v
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "common", children: "Common" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "rare", children: "Rare" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "epic", children: "Epic" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "legendary", children: "Legendary" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Requirement Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.requirement_type, onValueChange: (v) => setForm({
          ...form,
          requirement_type: v
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "chapters_read", children: "Chapters Read" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "streak_days", children: "Streak Days" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "comments", children: "Comments" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ratings", children: "Ratings" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "follows", children: "Follows" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Requirement Value" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: form.requirement_value, onChange: (e) => setForm({
          ...form,
          requirement_value: e.target.value
        }), placeholder: "1" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "XP Reward" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: form.xp_reward, onChange: (e) => setForm({
          ...form,
          xp_reward: e.target.value
        }), placeholder: "10" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Badge Color" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "color", value: form.badge_color, onChange: (e) => setForm({
          ...form,
          badge_color: e.target.value
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { id: "is_secret", checked: form.is_secret, onCheckedChange: (v) => setForm({
        ...form,
        is_secret: !!v
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "is_secret", className: "cursor-pointer font-normal", children: "Secret achievement (hidden until unlocked)" })
    ] })
  ] });
}
function XPEventFormFields({
  form,
  setForm
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Event Name *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.name, onChange: (e) => setForm({
        ...form,
        name: e.target.value
      }), placeholder: "Double XP Weekend" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Description" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 2, value: form.description, onChange: (e) => setForm({
        ...form,
        description: e.target.value
      }), placeholder: "Event description..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "XP Multiplier" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "0.1", value: form.xp_multiplier, onChange: (e) => setForm({
          ...form,
          xp_multiplier: e.target.value
        }), placeholder: "2.0" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Applies To" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.applies_to, onValueChange: (v) => setForm({
          ...form,
          applies_to: v
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Titles" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "specific_series", children: "Specific Titles" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "specific_tags", children: "Specific Genres" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Starts At *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "datetime-local", value: form.starts_at, onChange: (e) => setForm({
          ...form,
          starts_at: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Ends At *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "datetime-local", value: form.ends_at, onChange: (e) => setForm({
          ...form,
          ends_at: e.target.value
        }) })
      ] })
    ] })
  ] });
}
export {
  AdminGamification as component
};
