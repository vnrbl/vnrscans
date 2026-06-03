import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { L as Library, B as BookOpen, k as Users, j as MessageSquare, a3 as Flag } from "../_libs/lucide-react.mjs";
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
function useCount(table, filter) {
  return useQuery({
    queryKey: ["count", table],
    queryFn: async () => {
      let q = supabase.from(table).select("*", {
        count: "exact",
        head: true
      });
      if (filter) q = filter(q);
      const {
        count,
        error
      } = await q;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1e3
    // Cache for 5 minutes
  });
}
function AdminHome() {
  const series = useCount("series");
  const chapters = useCount("chapters");
  const profiles = useCount("profiles");
  const comments = useCount("comments");
  const reports = useCount("reports", (q) => q.eq("status", "open"));
  const cards = [{
    label: "Series",
    value: series.data,
    icon: Library
  }, {
    label: "Chapters",
    value: chapters.data,
    icon: BookOpen
  }, {
    label: "Users",
    value: profiles.data,
    icon: Users
  }, {
    label: "Comments",
    value: comments.data,
    icon: MessageSquare
  }, {
    label: "Open reports",
    value: reports.data,
    icon: Flag
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Dashboard" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Overview of your platform." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: cards.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/40 bg-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: c.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(c.icon, { className: "h-4 w-4 text-primary" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-3xl font-bold", children: c.value ?? "—" })
    ] }, c.label)) })
  ] });
}
export {
  AdminHome as component
};
