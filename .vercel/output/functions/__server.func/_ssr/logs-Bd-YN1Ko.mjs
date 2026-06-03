import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { I as Input, S as Select, b as SelectTrigger, d as SelectValue, e as SelectContent, f as SelectItem, B as Badge } from "./router-DABr79Tj.mjs";
import "../_libs/sonner.mjs";
import { b as Search, I as Shield } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
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
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
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
function AdminLogs() {
  const [search, setSearch] = reactExports.useState("");
  const [resourceFilter, setResourceFilter] = reactExports.useState("all");
  const logs = useQuery({
    queryKey: ["admin", "activity-logs", resourceFilter],
    queryFn: async () => {
      let query = supabase.from("admin_activity_logs").select("*").order("created_at", {
        ascending: false
      }).limit(200);
      if (resourceFilter !== "all") {
        query = query.eq("resource_type", resourceFilter);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      return data ?? [];
    }
  });
  const filtered = (logs.data ?? []).filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return row.action?.toLowerCase().includes(q) || row.resource_type?.toLowerCase().includes(q) || row.resource_id?.toLowerCase().includes(q) || row.actor_id?.toLowerCase().includes(q);
  });
  const actionColors = {
    create: "default",
    update: "secondary",
    delete: "destructive",
    activate: "outline",
    deactivate: "outline",
    approve: "default",
    reject: "destructive"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Security & Activity Logs" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Track admin actions for accountability and auditing" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-[200px] flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "pl-9", placeholder: "Search action, resource, user...", value: search, onChange: (e) => setSearch(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: resourceFilter, onValueChange: setResourceFilter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Resource type" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All resources" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "announcement", children: "Announcements" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "banner", children: "Banners" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "moderation", children: "Moderation" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "user_role", children: "User roles" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "permission", children: "Permissions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "achievement", children: "Achievements" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
      logs.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
      filtered.length === 0 && !logs.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border/40 bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "mx-auto h-10 w-10 text-muted-foreground opacity-50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "No activity logged yet" })
      ] }),
      filtered.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border/40 bg-card p-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: actionColors[row.action?.split("_")[0] ?? ""] ?? "outline", children: row.action }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: row.resource_type }),
          row.resource_id && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-xs text-muted-foreground", children: [
            row.resource_id.slice(0, 8),
            "…"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto text-xs text-muted-foreground", children: new Date(row.created_at).toLocaleString() })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-muted-foreground", children: [
          row.actor_id ? `User ${row.actor_id.slice(0, 8)}…` : "System",
          row.details && Object.keys(row.details).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 font-mono text-xs", children: JSON.stringify(row.details) })
        ] })
      ] }, row.id))
    ] })
  ] });
}
export {
  AdminLogs as component
};
