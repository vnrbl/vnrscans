import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { B as Badge } from "./router-DABr79Tj.mjs";
import { C as Card, a as CardContent } from "./card-00PypCa5.mjs";
import "../_libs/sonner.mjs";
import { p as Tag, q as TrendingUp } from "../_libs/lucide-react.mjs";
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
function TagsPage() {
  const tags = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tags").select("*").order("usage_count", {
        ascending: false
      });
      if (error) throw error;
      return data || [];
    }
  });
  const trendingTags = useQuery({
    queryKey: ["tags", "trending"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.rpc("get_trending_tags", {
        limit_count: 10
      });
      if (error) throw error;
      return data || [];
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "h-8 w-8 text-violet-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Browse by Tags" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "Discover titles by genre, theme, and category" })
    ] }),
    trendingTags.data && trendingTags.data.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-4 flex items-center gap-2 text-xl font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-5 w-5 text-orange-600" }),
        "Trending This Month"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-3", children: trendingTags.data.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/tags/$slug", params: {
        slug: tag.tag_slug
      }, className: "transition-transform hover:scale-105", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "cursor-pointer gap-1 px-4 py-2 text-base", style: {
        borderColor: tag.tag_color,
        backgroundColor: `${tag.tag_color}15`,
        color: tag.tag_color
      }, children: [
        tag.tag_name,
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 rounded-full bg-background px-2 py-0.5 text-xs", children: tag.usage_count })
      ] }) }, tag.tag_id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-4 text-xl font-semibold", children: "All Tags" }),
      tags.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Loading tags..." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: (tags.data || []).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/tags/$slug", params: {
        slug: tag.slug
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "group h-full transition-all hover:border-primary/50 hover:shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            tag.icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: tag.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", style: {
              color: tag.color
            }, children: tag.name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: tag.usage_count })
        ] }),
        tag.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground line-clamp-2", children: tag.description })
      ] }) }) }, tag.id)) })
    ] })
  ] }) });
}
export {
  TagsPage as component
};
