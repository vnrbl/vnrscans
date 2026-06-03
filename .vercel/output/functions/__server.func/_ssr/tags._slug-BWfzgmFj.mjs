import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { S as SeriesCard } from "./SeriesCard-Bjjcgwe0.mjs";
import { i as Route$i, a as Button, B as Badge } from "./router-DeJJK2lY.mjs";
import "../_libs/sonner.mjs";
import { F as ArrowLeft, p as Tag } from "../_libs/lucide-react.mjs";
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
import "./titleCardStyles-wF_NUguc.mjs";
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
function TagDetailPage() {
  const {
    slug
  } = Route$i.useParams();
  const tag = useQuery({
    queryKey: ["tag", slug],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tags").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data;
    }
  });
  const series = useQuery({
    queryKey: ["tag-series", slug],
    queryFn: async () => {
      if (!tag.data?.id) return [];
      const {
        data,
        error
      } = await supabase.from("series_tags").select(`
          series:series_id (
            id,
            slug,
            title,
            cover_url,
            type,
            status,
            rating_average,
            view_count,
            chapter_count,
            description
          )
        `).eq("tag_id", tag.data.id);
      if (error) throw error;
      return (data || []).map((item) => item.series).filter((s) => s !== null);
    },
    enabled: !!tag.data?.id
  });
  if (tag.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Loading..." }) });
  }
  if (!tag.data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Tag not found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "This tag doesn't exist" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/tags", className: "mt-4 inline-block", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", children: "Browse All Tags" }) })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/tags", className: "mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
      "Back to All Tags"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        tag.data.icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl", children: tag.data.icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", style: {
            color: tag.data.color
          }, children: tag.data.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", style: {
            borderColor: tag.data.color,
            backgroundColor: `${tag.data.color}15`,
            color: tag.data.color
          }, children: [
            tag.data.usage_count,
            " titles"
          ] }) })
        ] })
      ] }),
      tag.data.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-muted-foreground", children: tag.data.description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      series.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Loading titles..." }),
      series.data && series.data.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border/40 bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "mx-auto h-12 w-12 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 text-lg font-semibold", children: "No titles yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
          'No titles have been tagged with "',
          tag.data.name,
          '" yet.'
        ] })
      ] }),
      series.data && series.data.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", children: series.data.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesCard, { series: s }, s.id)) })
    ] })
  ] }) });
}
export {
  TagDetailPage as component
};
