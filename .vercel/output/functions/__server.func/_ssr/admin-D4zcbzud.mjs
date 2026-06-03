import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link, O as Outlet } from "../_libs/tanstack__react-router.mjs";
import { $ as LayoutDashboard, q as TrendingUp, a0 as Megaphone, a1 as Image, L as Library, p as Tag, a2 as Gavel, j as MessageSquare, a3 as Flag, k as Users, c as ShieldCheck, T as Trophy, I as Shield } from "../_libs/lucide-react.mjs";
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
function AdminLayout() {
  const items = [{
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true
  }, {
    to: "/admin/analytics",
    label: "Analytics",
    icon: TrendingUp
  }, {
    to: "/admin/announcements",
    label: "Announcements",
    icon: Megaphone
  }, {
    to: "/admin/banners",
    label: "Banners",
    icon: Image
  }, {
    to: "/admin/series",
    label: "Titles",
    icon: Library
  }, {
    to: "/admin/tags",
    label: "Genres",
    icon: Tag
  }, {
    to: "/admin/moderation",
    label: "Moderation",
    icon: Gavel
  }, {
    to: "/admin/comments",
    label: "Comments",
    icon: MessageSquare
  }, {
    to: "/admin/reports",
    label: "Reports",
    icon: Flag
  }, {
    to: "/admin/users",
    label: "Users",
    icon: Users
  }, {
    to: "/admin/permissions",
    label: "Roles",
    icon: ShieldCheck
  }, {
    to: "/admin/gamification",
    label: "Gamification",
    icon: Trophy
  }, {
    to: "/admin/logs",
    label: "Security Logs",
    icon: Shield
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto grid gap-6 px-8 md:px-12 lg:px-16 py-6 md:grid-cols-[220px_1fr]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:self-start md:overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "rounded-lg border border-border/40 bg-card p-2", children: items.map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: it.to, activeProps: {
      className: "bg-primary/15 text-primary"
    }, activeOptions: {
      exact: it.exact
    }, className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(it.icon, { className: "h-4 w-4" }),
      it.label
    ] }, it.to)) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) })
  ] });
}
export {
  AdminLayout as component
};
