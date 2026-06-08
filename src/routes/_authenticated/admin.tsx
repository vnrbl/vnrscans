import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Library,
  MessageSquare,
  Flag,
  Users,
  TrendingUp,
  Tag,
  Megaphone,
  Image,
  Shield,
  ShieldCheck,
  Trophy,
  Gavel,
  Award,
TerminalSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { requireAuthenticatedUser } from "@/lib/auth-guards";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ location }) => {
    const user = await requireAuthenticatedUser();
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const userRoles = (roles ?? []).map((r) => r.role);
    const ok = userRoles.some((role) => role === "admin" || role === "moderator" || role === "uploader");
    if (!ok) throw redirect({ to: "/" });

    // Restrict subroutes based on role permissions
    const path = location.pathname;
    const isAdmin = userRoles.includes("admin");
    const isModerator = userRoles.includes("moderator");

    const adminOnlyPaths = ["/admin/analytics", "/admin/logs"];
    const staffOnlyPaths = [
      "/admin/announcements",
      "/admin/banners",
      "/admin/moderation",
      "/admin/comments",
      "/admin/reports",
      "/admin/users",
      "/admin/gamification",
      "/admin/badges"
    ];

    if (adminOnlyPaths.some(p => path.startsWith(p)) && !isAdmin) {
      throw redirect({ to: "/admin" });
    }

    if (staffOnlyPaths.some(p => path.startsWith(p)) && !isAdmin && !isModerator) {
      throw redirect({ to: "/admin" });
    }

    return {
      userRoles,
    };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { userRoles } = Route.useRouteContext() as { userRoles: string[] };
  const isAdmin = userRoles.includes("admin");
  const isModerator = userRoles.includes("moderator");
  const isUploader = userRoles.includes("uploader");

  let panelTitle = "Admin Panel";
  if (isAdmin) {
    panelTitle = "Admin Panel";
  } else if (isModerator) {
    panelTitle = "Moderator Panel";
  } else if (isUploader) {
    panelTitle = "Uploader Panel";
  }

  const items = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, roles: ["admin", "moderator", "uploader"] },
    { to: "/admin/analytics", label: "Analytics", icon: TrendingUp, roles: ["admin"] },
    { to: "/admin/scrape-terminal", label: "Scrape Terminal", icon: TerminalSquare, roles: ["admin", "moderator", "uploader"] },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone, roles: ["admin", "moderator"] },
    { to: "/admin/banners", label: "Banners", icon: Image, roles: ["admin", "moderator"] },
    { to: "/admin/series", label: "Titles", icon: Library, roles: ["admin", "moderator", "uploader"] },
    { to: "/admin/tags", label: "Genres & Tags", icon: Tag, roles: ["admin", "moderator", "uploader"] },
    { to: "/admin/moderation", label: "Moderation", icon: Gavel, roles: ["admin", "moderator"] },
    { to: "/admin/comments", label: "Comments", icon: MessageSquare, roles: ["admin", "moderator"] },
    { to: "/admin/reports", label: "Reports", icon: Flag, roles: ["admin", "moderator"] },
    { to: "/admin/users", label: "Users", icon: Users, roles: ["admin", "moderator"] },
    { to: "/admin/permissions", label: "Roles", icon: ShieldCheck, roles: ["admin", "moderator", "uploader"] },
    { to: "/admin/gamification", label: "Gamification", icon: Trophy, roles: ["admin", "moderator"] },
    { to: "/admin/badges", label: "Realms & Badges", icon: Award, roles: ["admin", "moderator"] },
    { to: "/admin/logs", label: "Security Logs", icon: Shield, roles: ["admin"] },
  ];

  const visibleItems = items.filter((item) =>
    item.roles.some((r) => userRoles.includes(r))
  );

  return (
    <div className="container mx-auto grid gap-4 px-4 py-4 sm:px-6 md:grid-cols-[220px_1fr] md:gap-6 md:px-8 md:py-6 lg:px-12 xl:px-16">
      <aside className="min-w-0 md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:self-start md:overflow-y-auto">
        <div className="mb-3 px-3 py-1 text-2xs font-extrabold text-primary uppercase tracking-widest bg-primary/10 rounded-md border border-primary/20 w-fit">
          {panelTitle}
        </div>
        <nav className="flex gap-2 overflow-x-auto rounded-lg border border-border/40 bg-card p-2 md:block md:space-y-1 md:overflow-visible">
          {visibleItems.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeProps={{ className: "bg-primary/15 text-primary" }}
              activeOptions={{ exact: it.exact }}
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground md:shrink"
            >
              <it.icon className="h-4 w-4" />{it.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0"><Outlet /></main>
    </div>
  );
}



