"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  Gavel,
  Award,
  TerminalSquare,
  Globe2,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching admin roles:", error);
          router.push("/");
          return;
        }

        const roles = (data ?? []).map((r) => r.role);
        setUserRoles(roles);
        setRolesLoading(false);

        const ok = roles.some((role) => role === "admin" || role === "moderator" || role === "uploader");
        if (!ok) {
          router.push("/");
          return;
        }

        // Restrict subroutes based on role permissions
        const isAdmin = roles.includes("admin");
        const isModerator = roles.includes("moderator");

        const adminOnlyPaths = ["/admin/analytics", "/admin/logs"];
        const staffOnlyPaths = [
          "/admin/announcements",
          "/admin/banners",
          "/admin/moderation",
          "/admin/comments",
          "/admin/reports",
          "/admin/users",
          "/admin/badges"
        ];

        if (adminOnlyPaths.some(p => pathname.startsWith(p)) && !isAdmin) {
          router.push("/admin");
        }

        if (staffOnlyPaths.some(p => pathname.startsWith(p)) && !isAdmin && !isModerator) {
          router.push("/admin");
        }
      });
  }, [user, authLoading, pathname, router]);

  if (authLoading || rolesLoading || userRoles.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

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
    { to: "/admin/site-import", label: "Site Import", icon: Globe2, roles: ["admin"] },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone, roles: ["admin", "moderator"] },
    { to: "/admin/banners", label: "Banners", icon: Image, roles: ["admin", "moderator"] },
    { to: "/admin/series", label: "Titles", icon: Library, roles: ["admin", "moderator", "uploader"] },
    { to: "/admin/tags", label: "Genres & Tags", icon: Tag, roles: ["admin", "moderator", "uploader"] },
    { to: "/admin/moderation", label: "Moderation", icon: Gavel, roles: ["admin", "moderator"] },
    { to: "/admin/comments", label: "Comments", icon: MessageSquare, roles: ["admin", "moderator"] },
    { to: "/admin/reports", label: "Reports", icon: Flag, roles: ["admin", "moderator"] },
    { to: "/admin/users", label: "Users", icon: Users, roles: ["admin", "moderator"] },
    { to: "/admin/permissions", label: "Roles", icon: ShieldCheck, roles: ["admin", "moderator", "uploader"] },
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
      <main className="min-w-0">{children}</main>
    </div>
  );
}
