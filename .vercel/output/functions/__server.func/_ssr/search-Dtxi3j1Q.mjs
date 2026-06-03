import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { S as SeriesGrid } from "./SeriesGrid-B1qGxXhz.mjs";
import { R as Route$u, I as Input } from "./router-DABr79Tj.mjs";
import "../_libs/sonner.mjs";
import { b as Search } from "../_libs/lucide-react.mjs";
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
import "./SeriesCard-CjhVqp4w.mjs";
import "./titleCardStyles-wF_NUguc.mjs";
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
function SearchPage() {
  const {
    q
  } = Route$u.useSearch();
  const navigate = useNavigate({
    from: "/search"
  });
  const [value, setValue] = reactExports.useState(q || "");
  reactExports.useEffect(() => {
    const t = setTimeout(() => navigate({
      search: {
        q: value
      }
    }), 250);
    return () => clearTimeout(t);
  }, [value, navigate]);
  const results = useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      if (!q || q.length < 2) return [];
      const {
        data,
        error
      } = await supabase.from("series").select("id,slug,title,cover_url,type,rating_average,status,view_count").or(`title.ilike.%${q}%,alternative_titles.ilike.%${q}%,author.ilike.%${q}%`).limit(30);
      if (error) throw error;
      return data ?? [];
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight md:text-3xl", children: "Search" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative my-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { autoFocus: true, value, onChange: (e) => setValue(e.target.value), placeholder: "Search by title, author, or alt title...", className: "pl-10 h-12 text-base" })
    ] }),
    q && q.length >= 2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesGrid, { items: results.data, loading: results.isLoading, emptyMessage: `No results for "${q}"` }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Type at least 2 characters to search." })
  ] });
}
export {
  SearchPage as component
};
