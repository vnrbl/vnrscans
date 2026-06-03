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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    const ok = (roles ?? []).some((r) => r.role === "admin" || r.role === "moderator");
    if (!ok) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const items = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { to: "/admin/banners", label: "Banners", icon: Image },
    { to: "/admin/series", label: "Titles", icon: Library },
    { to: "/admin/tags", label: "Genres", icon: Tag },
    { to: "/admin/moderation", label: "Moderation", icon: Gavel },
    { to: "/admin/comments", label: "Comments", icon: MessageSquare },
    { to: "/admin/reports", label: "Reports", icon: Flag },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/permissions", label: "Roles", icon: ShieldCheck },
    { to: "/admin/gamification", label: "Gamification", icon: Trophy },
    { to: "/admin/logs", label: "Security Logs", icon: Shield },
  ];
  return (
    <div className="container mx-auto grid gap-6 px-8 md:px-12 lg:px-16 py-6 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:self-start md:overflow-y-auto">
        <nav className="rounded-lg border border-border/40 bg-card p-2">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeProps={{ className: "bg-primary/15 text-primary" }}
              activeOptions={{ exact: it.exact }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
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