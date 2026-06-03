import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { u as useAuth, a as Button, B as Badge } from "./router-DeJJK2lY.mjs";
import { C as Card } from "./card-DC5_xYQQ.mjs";
import "../_libs/sonner.mjs";
import { S as Sparkles, B as BookOpen, r as Star } from "../_libs/lucide-react.mjs";
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
function RecommendationsPage() {
  const {
    user
  } = useAuth();
  const recommendations = useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const {
        data: existing,
        error: existingError
      } = await supabase.from("user_recommendations").select("series:series_id(id,slug,title,cover_url,type,rating_average,description,status)").eq("user_id", user.id).order("score", {
        ascending: false
      }).limit(20);
      if (existingError) throw existingError;
      if (!existing || existing.length === 0) {
        await supabase.rpc("generate_user_recommendations", {
          target_user_id: user.id
        });
        const {
          data: newData,
          error: newError
        } = await supabase.from("user_recommendations").select("series:series_id(id,slug,title,cover_url,type,rating_average,description,status)").eq("user_id", user.id).order("score", {
          ascending: false
        }).limit(20);
        if (newError) throw newError;
        return newData ?? [];
      }
      return existing ?? [];
    },
    enabled: !!user,
    staleTime: 1e3 * 60 * 30
  });
  const basedOnGenres = useQuery({
    queryKey: ["recommendations-by-genre", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const {
        data: historyData,
        error: historyError
      } = await supabase.from("reading_history").select("series:series_id(series_genres(genre:genres(slug)))").eq("user_id", user.id).limit(50);
      if (historyError) throw historyError;
      const genreSlugs = /* @__PURE__ */ new Set();
      historyData?.forEach((h) => {
        h.series?.series_genres?.forEach((sg) => {
          if (sg.genre?.slug) genreSlugs.add(sg.genre.slug);
        });
      });
      if (genreSlugs.size === 0) return [];
      const {
        data: readSeries
      } = await supabase.from("reading_history").select("series_id").eq("user_id", user.id);
      const readSeriesIds = (readSeries ?? []).map((r) => r.series_id);
      const {
        data,
        error
      } = await supabase.from("series").select("id,slug,title,cover_url,type,rating_average,description,status,series_genres(genre:genres(slug))").not("id", "in", `(${readSeriesIds.join(",") || "'00000000-0000-0000-0000-000000000000'"})`).order("rating_average", {
        ascending: false
      }).limit(100);
      if (error) throw error;
      const scored = (data ?? []).map((series) => {
        const matches = series.series_genres?.filter((sg) => genreSlugs.has(sg.genre?.slug)).length || 0;
        return {
          ...series,
          genreMatches: matches
        };
      });
      return scored.filter((s) => s.genreMatches > 0).sort((a, b) => b.genreMatches - a.genreMatches || (b.rating_average || 0) - (a.rating_average || 0)).slice(0, 20);
    },
    enabled: !!user,
    staleTime: 1e3 * 60 * 30
  });
  if (!user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "max-w-md p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mx-auto mb-4 h-12 w-12 text-violet-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-2 text-2xl font-bold", children: "Sign In for Recommendations" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-6 text-muted-foreground", children: "Get personalized series recommendations based on your reading history" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { children: "Sign In" }) })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-8 w-8 text-violet-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Recommendations" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "Personalized suggestions based on your reading history" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-4 text-xl font-semibold", children: "For You" }),
      recommendations.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6", children: [...Array(12)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-lg border border-border/40 bg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[2/3] animate-pulse bg-secondary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-3/4 animate-pulse rounded bg-secondary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-1/2 animate-pulse rounded bg-secondary" })
        ] })
      ] }, i)) }) : recommendations.data && recommendations.data.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6", children: recommendations.data.map((rec) => {
        const series = rec.series;
        if (!series) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesCard, { series }, series.id);
      }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-8 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Start reading some series to get personalized recommendations!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/browse", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "mt-4", children: "Browse Series" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-4 text-xl font-semibold", children: "Based on Your Favorite Genres" }),
      basedOnGenres.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6", children: [...Array(12)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-lg border border-border/40 bg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[2/3] animate-pulse bg-secondary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-3/4 animate-pulse rounded bg-secondary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-1/2 animate-pulse rounded bg-secondary" })
        ] })
      ] }, i)) }) : basedOnGenres.data && basedOnGenres.data.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6", children: basedOnGenres.data.map((series) => /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesCard, { series }, series.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Read more series to get genre-based recommendations!" }) })
    ] })
  ] }) });
}
function SeriesCard({
  series
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/title/$slug", params: {
    slug: series.slug
  }, className: "group overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "aspect-[2/3] overflow-hidden bg-secondary", children: [
      series.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: series.cover_url, alt: series.title, className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110", loading: "lazy" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-10 w-10" }) }),
      series.rating_average && Number(series.rating_average) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-2 top-2 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs backdrop-blur", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3 w-3 fill-violet-600 text-violet-600" }),
        Number(series.rating_average).toFixed(1)
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "line-clamp-2 text-sm font-semibold leading-tight group-hover:text-primary", children: series.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs uppercase", children: series.type }) })
    ] })
  ] });
}
export {
  RecommendationsPage as component
};
