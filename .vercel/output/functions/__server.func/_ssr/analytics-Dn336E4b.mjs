import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { C as Card, a as CardContent, b as CardHeader, c as CardTitle, d as CardDescription } from "./card-DC5_xYQQ.mjs";
import { B as Badge } from "./router-DeJJK2lY.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-RvT0_-WW.mjs";
import "../_libs/sonner.mjs";
import { k as Users, B as BookOpen, E as Eye, q as TrendingUp, K as Flame, r as Star, v as Clock } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-tabs.mjs";
function AdminAnalytics() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const todayStats = useQuery({
    queryKey: ["analytics", "today"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("daily_analytics").select("*").eq("date", today).single();
      if (error && error.code !== "PGRST116") throw error;
      if (!data) {
        const [users, series, chapters, sessions] = await Promise.all([supabase.from("profiles").select("id", {
          count: "exact",
          head: true
        }), supabase.from("series").select("id", {
          count: "exact",
          head: true
        }), supabase.from("chapters").select("id", {
          count: "exact",
          head: true
        }), supabase.from("reading_sessions").select("id", {
          count: "exact",
          head: true
        }).gte("started_at", today)]);
        return {
          total_users: users.count || 0,
          total_series: series.count || 0,
          total_chapters: chapters.count || 0,
          chapters_read: sessions.count || 0,
          new_users: 0,
          new_series: 0,
          new_chapters: 0
        };
      }
      return data;
    },
    refetchInterval: 6e4
    // Refresh every minute
  });
  const trendingSeries = useQuery({
    queryKey: ["analytics", "trending-series"],
    queryFn: async () => {
      const sevenDaysAgo = /* @__PURE__ */ new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const {
        data,
        error
      } = await supabase.from("series").select("id, title, slug, cover_url, type, view_count").gte("updated_at", sevenDaysAgo.toISOString()).order("view_count", {
        ascending: false
      }).limit(10);
      if (error) throw error;
      return data || [];
    }
  });
  const activeUsers = useQuery({
    queryKey: ["analytics", "active-users"],
    queryFn: async () => {
      const sevenDaysAgo = /* @__PURE__ */ new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const {
        data,
        error
      } = await supabase.from("reading_sessions").select("user_id, profiles!inner(username, avatar_url, reading_streak)").gte("started_at", sevenDaysAgo.toISOString()).not("user_id", "is", null);
      if (error) throw error;
      const userSessions = (data || []).reduce((acc, session) => {
        const userId = session.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            username: session.profiles?.username || "Anonymous",
            avatar_url: session.profiles?.avatar_url,
            reading_streak: session.profiles?.reading_streak || 0,
            session_count: 0
          };
        }
        acc[userId].session_count++;
        return acc;
      }, {});
      return Object.values(userSessions).sort((a, b) => b.session_count - a.session_count).slice(0, 10);
    }
  });
  const recentChapters = useQuery({
    queryKey: ["analytics", "recent-chapters"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("chapters").select("id, chapter_number, title, created_at, series!inner(title, slug)").order("created_at", {
        ascending: false
      }).limit(10);
      if (error) throw error;
      return data || [];
    }
  });
  const popularTags = useQuery({
    queryKey: ["analytics", "popular-genres"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tags").select("id, name, slug, color, icon, usage_count").order("usage_count", {
        ascending: false
      }).limit(15);
      if (error) throw error;
      return data || [];
    }
  });
  const quickStats = [{
    label: "Total Users",
    value: todayStats.data?.total_users || 0,
    change: todayStats.data?.new_users || 0,
    icon: Users,
    color: "text-blue-600"
  }, {
    label: "Total Titles",
    value: todayStats.data?.total_series || 0,
    change: todayStats.data?.new_series || 0,
    icon: BookOpen,
    color: "text-violet-600"
  }, {
    label: "Total Chapters",
    value: todayStats.data?.total_chapters || 0,
    change: todayStats.data?.new_chapters || 0,
    icon: BookOpen,
    color: "text-green-600"
  }, {
    label: "Chapters Read Today",
    value: todayStats.data?.chapters_read || 0,
    icon: Eye,
    color: "text-orange-600"
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Analytics Dashboard" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Platform performance and insights" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: quickStats.map((stat) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: stat.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold", children: stat.value.toLocaleString() }),
        stat.change !== void 0 && stat.change > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-green-600 flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-3 w-3" }),
          "+",
          stat.change,
          " today"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(stat.icon, { className: `h-8 w-8 ${stat.color}` })
    ] }) }) }, stat.label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "trending", className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "trending", children: "Trending Content" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "users", children: "Active Users" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "tags", children: "Popular Genres" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "recent", children: "Recent Uploads" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "trending", className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { className: "h-5 w-5 text-orange-600" }),
            "Trending Titles (Last 7 Days)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Most viewed titles this week" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          trendingSeries.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
          (trendingSeries.data || []).map((series, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-border/40 bg-card p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white", children: idx + 1 }),
            series.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: series.cover_url, alt: "", className: "h-14 w-10 rounded object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-10 rounded bg-secondary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-semibold", children: series.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "uppercase", children: series.type }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
                  series.view_count.toLocaleString(),
                  " views"
                ] })
              ] })
            ] })
          ] }, series.id))
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "users", className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-5 w-5 text-blue-600" }),
            "Most Active Readers (Last 7 Days)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Users with the most reading sessions" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          activeUsers.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
          (activeUsers.data || []).map((user, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-border/40 bg-card p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-sm font-bold text-white", children: idx + 1 }),
            user.avatar_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: user.avatar_url, alt: "", className: "h-10 w-10 rounded-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold", children: user.username?.[0]?.toUpperCase() || "?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-semibold", children: user.username }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-3 w-3" }),
                  user.session_count,
                  " chapters read"
                ] }),
                user.reading_streak > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { className: "h-3 w-3 text-orange-600" }),
                  user.reading_streak,
                  " day streak"
                ] })
              ] })
            ] })
          ] }, user.user_id))
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "tags", className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-5 w-5 text-yellow-600" }),
            "Most Used Genres"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Popular genres and categories" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          popularTags.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
          (popularTags.data || []).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "gap-1 px-3 py-1.5 text-sm", style: {
            borderColor: tag.color,
            color: tag.color
          }, children: [
            tag.icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tag.icon }),
            tag.name,
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 rounded-full bg-secondary px-1.5 py-0.5 text-xs", children: tag.usage_count })
          ] }, tag.id))
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "recent", className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5 text-green-600" }),
            "Recently Uploaded Chapters"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Latest content additions" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          recentChapters.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." }),
          (recentChapters.data || []).map((chapter) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border/40 bg-card p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-semibold", children: chapter.series?.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
                "Chapter ",
                chapter.chapter_number,
                chapter.title && ` - ${chapter.title}`
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: new Date(chapter.created_at).toLocaleDateString() })
          ] }, chapter.id))
        ] }) })
      ] }) })
    ] })
  ] });
}
export {
  AdminAnalytics as component
};
