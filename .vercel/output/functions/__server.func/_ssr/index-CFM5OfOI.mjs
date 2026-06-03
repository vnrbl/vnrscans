import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { a as Button } from "./router-DABr79Tj.mjs";
import "../_libs/sonner.mjs";
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
import "../_libs/lucide-react.mjs";
import "../_libs/date-fns.mjs";
function Home() {
  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const {
        count: seriesCount
      } = await supabase.from("series").select("*", {
        count: "exact",
        head: true
      });
      const {
        count: chapterCount
      } = await supabase.from("chapters").select("*", {
        count: "exact",
        head: true
      });
      const {
        count: userCount
      } = await supabase.from("profiles").select("*", {
        count: "exact",
        head: true
      });
      return {
        chapters: chapterCount || 0,
        series: seriesCount || 0,
        readers: userCount || 0
      };
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative overflow-hidden bg-gradient-to-br from-background via-violet-950/10 to-background py-20 md:py-32", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)]" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container relative mx-auto px-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 animate-pulse rounded-full bg-violet-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-violet-400", children: "Welcome to VNRScans" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl", children: [
        "DISCOVER STORIES",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-violet-600", children: "DRAWN BY IMAGINATION" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl", children: "Follow your favorite manhwa series, track new chapters, and dive into worlds created by talented artists. Free, fast, and without interruptions." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/home", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "lg", className: "h-12 bg-violet-600 px-8 text-base font-semibold hover:bg-violet-700", children: "Start Reading" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-card p-6 backdrop-blur-sm transition-all hover:border-violet-500/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative text-3xl font-bold text-violet-600", children: stats.data?.chapters.toLocaleString() || "0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative mt-1 text-sm text-muted-foreground", children: "NEW CHAPTERS" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-card p-6 backdrop-blur-sm transition-all hover:border-violet-500/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative text-3xl font-bold text-violet-600", children: stats.data?.series.toLocaleString() || "0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative mt-1 text-sm text-muted-foreground", children: "MANHWA SERIES" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-card p-6 backdrop-blur-sm transition-all hover:border-violet-500/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative text-3xl font-bold text-violet-600", children: stats.data?.readers.toLocaleString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative mt-1 text-sm text-muted-foreground", children: "READERS" })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  Home as component
};
