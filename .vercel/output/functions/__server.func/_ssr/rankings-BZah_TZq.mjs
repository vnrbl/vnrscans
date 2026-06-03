import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { B as Badge } from "./router-DABr79Tj.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BV6Pu7lT.mjs";
import { C as Card } from "./card-00PypCa5.mjs";
import "../_libs/sonner.mjs";
import { T as Trophy, r as Star, q as TrendingUp, E as Eye, s as Heart, B as BookOpen } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-tabs.mjs";
function RankingsPage() {
  const topRated = useQuery({
    queryKey: ["rankings", "top-rated"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("series").select("id,slug,title,cover_url,type,rating_average,view_count,status").not("rating_average", "is", null).order("rating_average", {
        ascending: false
      }).order("view_count", {
        ascending: false
      }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1e3 * 60 * 15
  });
  const mostViewed = useQuery({
    queryKey: ["rankings", "most-viewed"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("series").select("id,slug,title,cover_url,type,rating_average,view_count,status").order("view_count", {
        ascending: false
      }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1e3 * 60 * 15
  });
  const mostFollowed = useQuery({
    queryKey: ["rankings", "most-followed"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.rpc("get_most_followed_series", {
        limit_count: 50
      });
      if (error) {
        const {
          data: fallback,
          error: fallbackError
        } = await supabase.from("series").select("id,slug,title,cover_url,type,rating_average,view_count,status").order("view_count", {
          ascending: false
        }).limit(50);
        if (fallbackError) throw fallbackError;
        return fallback ?? [];
      }
      return data ?? [];
    },
    staleTime: 1e3 * 60 * 15
  });
  const trending = useQuery({
    queryKey: ["rankings", "trending"],
    queryFn: async () => {
      const sevenDaysAgo = /* @__PURE__ */ new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const {
        data,
        error
      } = await supabase.from("chapters").select("series_id, series:series(id,slug,title,cover_url,type,rating_average,view_count,status)").gte("created_at", sevenDaysAgo.toISOString()).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      const seriesMap = /* @__PURE__ */ new Map();
      (data ?? []).forEach((chapter) => {
        const series = chapter.series;
        if (!series) return;
        if (seriesMap.has(series.id)) {
          seriesMap.get(series.id).recentChapters++;
        } else {
          seriesMap.set(series.id, {
            ...series,
            recentChapters: 1
          });
        }
      });
      return Array.from(seriesMap.values()).sort((a, b) => b.recentChapters - a.recentChapters).slice(0, 50);
    },
    staleTime: 1e3 * 60 * 5
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-8 w-8 text-violet-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Rankings" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "Discover the top-rated and most popular series on VNRScans" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "top-rated", className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-2 lg:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "top-rated", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "mr-2 h-4 w-4" }),
          "Top Rated"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "trending", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "mr-2 h-4 w-4" }),
          "Trending"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "most-viewed", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "mr-2 h-4 w-4" }),
          "Most Viewed"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "most-followed", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "mr-2 h-4 w-4" }),
          "Most Followed"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "top-rated", className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RankingList, { data: topRated.data ?? [], loading: topRated.isLoading, type: "rating" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "trending", className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RankingList, { data: trending.data ?? [], loading: trending.isLoading, type: "trending" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "most-viewed", className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RankingList, { data: mostViewed.data ?? [], loading: mostViewed.isLoading, type: "views" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "most-followed", className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RankingList, { data: mostFollowed.data ?? [], loading: mostFollowed.isLoading, type: "followers" }) })
    ] })
  ] }) });
}
function RankingList({
  data,
  loading,
  type
}) {
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [...Array(10)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 rounded-lg border border-border/40 bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 animate-pulse rounded bg-secondary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-14 animate-pulse rounded bg-secondary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-3/4 animate-pulse rounded bg-secondary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-1/2 animate-pulse rounded bg-secondary" })
      ] })
    ] }, i)) });
  }
  if (data.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "No rankings available yet." }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: data.map((series, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/title/$slug", params: {
    slug: series.slug
  }, className: "group flex items-center gap-4 rounded-lg border border-border/40 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white", children: index < 3 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: `h-5 w-5 ${index === 0 ? "text-yellow-300" : index === 1 ? "text-gray-300" : "text-orange-300"}` }) : index + 1 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-14 shrink-0 overflow-hidden rounded bg-secondary", children: series.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: series.cover_url, alt: series.title, className: "h-full w-full object-cover transition-transform group-hover:scale-110", loading: "lazy" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-6 w-6" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "truncate text-base font-semibold group-hover:text-primary", children: series.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs uppercase", children: series.type }),
        series.status && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs capitalize", children: series.status })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden shrink-0 text-right sm:block", children: [
      type === "rating" && series.rating_average && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-lg font-bold text-violet-600", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-5 w-5 fill-violet-600" }),
        Number(series.rating_average).toFixed(2)
      ] }),
      type === "views" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }),
        Number(series.view_count || 0).toLocaleString()
      ] }),
      type === "followers" && series.follower_count && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "h-4 w-4" }),
        Number(series.follower_count).toLocaleString()
      ] }),
      type === "trending" && series.recentChapters && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm font-semibold text-violet-600", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" }),
        series.recentChapters,
        " new"
      ] }),
      series.rating_average && type !== "rating" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-1 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3 w-3 fill-current" }),
        Number(series.rating_average).toFixed(1)
      ] })
    ] })
  ] }, series.id)) });
}
export {
  RankingsPage as component
};
