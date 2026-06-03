import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { S as SeriesGrid } from "./SeriesGrid-DIknv7Du.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CtINcI6N.mjs";
import { t as toast } from "../_libs/sonner.mjs";
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
import "./SeriesCard-reLvQmIK.mjs";
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
import "./router-1xbLZGbP.mjs";
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
import "./titleCardStyles-wF_NUguc.mjs";
import "../_libs/radix-ui__react-tabs.mjs";
function LibraryPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = reactExports.useState("reading");
  const library = useQuery({
    queryKey: ["library", "all"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("user_library").select("*,series:series(id,slug,title,cover_url,type,rating_average,status,view_count)").order("updated_at", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  useMutation({
    mutationFn: async ({
      seriesId,
      status
    }) => {
      const {
        error
      } = await supabase.from("user_library").upsert({
        series_id: seriesId,
        reading_status: status,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({
        queryKey: ["library"]
      });
    }
  });
  const filterByStatus = (status) => {
    return (library.data ?? []).filter((item) => item.reading_status === status).map((item) => item.series).filter(Boolean);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight md:text-3xl", children: "My Library" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "mt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full max-w-2xl grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "reading", children: "Reading" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "completed", children: "Completed" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "plan_to_read", children: "Plan to Read" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "dropped", children: "Dropped" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "reading", className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesGrid, { items: filterByStatus("reading"), loading: library.isLoading, emptyMessage: "No series in Reading. Start reading something!" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "completed", className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesGrid, { items: filterByStatus("completed"), loading: library.isLoading, emptyMessage: "No completed series yet." }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "plan_to_read", className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesGrid, { items: filterByStatus("plan_to_read"), loading: library.isLoading, emptyMessage: "No series planned. Add some from Browse!" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "dropped", className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesGrid, { items: filterByStatus("dropped"), loading: library.isLoading, emptyMessage: "No dropped series." }) })
    ] })
  ] });
}
export {
  LibraryPage as component
};
