import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { u as useAuth, D as Dialog, k as DialogTrigger, a as Button, l as DialogContent, m as DialogHeader, n as DialogTitle, p as DialogFooter, I as Input, S as Select, b as SelectTrigger, d as SelectValue, e as SelectContent, f as SelectItem, B as Badge, L as Label, T as Textarea } from "./router-1xbLZGbP.mjs";
import { a as createServerFn, T as TSS_SERVER_FUNCTION, g as getServerFnById } from "./server-Bpwg88Kk.mjs";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-DznKw9Wr.mjs";
import "../_libs/seroval.mjs";
import { V as Plus, X, R as Upload, ad as Pencil, E as Eye, ae as EyeOff, W as Trash2, af as Layers, ag as Download, ah as ExternalLink } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
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
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_libs/radix-ui__react-alert-dialog.mjs";
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const $extractChaptersFromUrl = createServerFn({
  method: "POST"
}).inputValidator(objectType({
  url: stringType().url()
})).handler(createSsrRpc("8d447e795f623d885b1641fa727ec02e5d9d52a0c5d865fe4e835a94e7be9d3f"));
const $extractImagesFromUrl = createServerFn({
  method: "POST"
}).inputValidator(objectType({
  url: stringType().url()
})).handler(createSsrRpc("2a2c8d7a9b0346fc1b4a261ed3bf46d16a8edec9b9183bbdab6cbc028283eb72"));
function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
const seriesTypes = ["manga", "manhwa", "manhua", "novel"];
const seriesStatuses = ["ongoing", "completed", "hiatus"];
const chapterStatuses = ["draft", "published", "scheduled"];
const emptySeriesForm = {
  title: "",
  type: "manga",
  status: "ongoing",
  author: "",
  artist: "",
  description: "",
  cover_url: "",
  release_year: "",
  alternative_titles: "",
  is_featured: false,
  is_trending: false,
  is_hidden: false,
  chapter_count: ""
};
function seriesToForm(series) {
  return {
    title: series.title ?? "",
    type: series.type ?? "manga",
    status: series.status ?? "ongoing",
    author: series.author ?? "",
    artist: series.artist ?? "",
    description: series.description ?? "",
    cover_url: series.cover_url ?? "",
    release_year: series.release_year ? String(series.release_year) : "",
    alternative_titles: series.alternative_titles ?? "",
    is_featured: Boolean(series.is_featured),
    is_trending: Boolean(series.is_trending),
    is_hidden: Boolean(series.is_hidden),
    chapter_count: String(series.chapter_count || 0)
  };
}
function seriesPayloadFromForm(form) {
  return {
    title: form.title,
    slug: slugify(form.title),
    type: form.type,
    status: form.status,
    author: form.author || null,
    artist: form.artist || null,
    description: form.description || null,
    cover_url: form.cover_url || null,
    release_year: form.release_year ? parseInt(form.release_year, 10) : null,
    alternative_titles: form.alternative_titles || null,
    is_featured: form.is_featured,
    is_trending: form.is_trending,
    is_hidden: form.is_hidden,
    chapter_count: form.chapter_count ? parseInt(form.chapter_count, 10) : null,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function AdminSeries() {
  const qc = useQueryClient();
  useAuth();
  const [selectedSeries, setSelectedSeries] = reactExports.useState(null);
  const [editingSeries, setEditingSeries] = reactExports.useState(null);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [typeFilter, setTypeFilter] = reactExports.useState("all");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [visibilityFilter, setVisibilityFilter] = reactExports.useState("all");
  const [currentPage, setCurrentPage] = reactExports.useState(1);
  const itemsPerPage = 20;
  const list = useQuery({
    queryKey: ["admin", "series", currentPage, searchQuery, typeFilter, statusFilter, visibilityFilter],
    queryFn: async () => {
      let query = supabase.from("series").select("*", {
        count: "exact"
      }).order("updated_at", {
        ascending: false
      });
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,alternative_titles.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%`);
      }
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (visibilityFilter === "visible") {
        query = query.eq("is_hidden", false);
      } else if (visibilityFilter === "hidden") {
        query = query.eq("is_hidden", true);
      }
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);
      const {
        data: seriesData,
        error,
        count
      } = await query;
      if (error) throw error;
      return {
        series: seriesData ?? [],
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / itemsPerPage)
      };
    },
    staleTime: 2 * 60 * 1e3
    // Cache for 2 minutes
  });
  const [open, setOpen] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState(emptySeriesForm);
  const create = useMutation({
    mutationFn: async () => {
      const {
        error
      } = await supabase.from("series").insert(seriesPayloadFromForm(form));
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Series created");
      setOpen(false);
      setForm(emptySeriesForm);
      qc.invalidateQueries({
        queryKey: ["admin", "series"]
      });
      setCurrentPage(1);
    },
    onError: (e) => toast.error(e.message)
  });
  const updateSeries = useMutation({
    mutationFn: async () => {
      if (!editingSeries) throw new Error("No series selected");
      const {
        error
      } = await supabase.from("series").update(seriesPayloadFromForm(form)).eq("id", editingSeries.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Series updated");
      setEditingSeries(null);
      setForm(emptySeriesForm);
      qc.invalidateQueries({
        queryKey: ["admin", "series"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const toggleHidden = useMutation({
    mutationFn: async (s) => {
      const {
        error
      } = await supabase.from("series").update({
        is_hidden: !s.is_hidden
      }).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["admin", "series"]
    })
  });
  const del = useMutation({
    mutationFn: async (id) => {
      const {
        error
      } = await supabase.from("series").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Series deleted");
      qc.invalidateQueries({
        queryKey: ["admin", "series"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  if (selectedSeries) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ChapterManager, { seriesId: selectedSeries, onBack: () => setSelectedSeries(null) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Titles" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
          "New title"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[90vh] max-w-2xl overflow-y-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create title" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesFormFields, { form, setForm }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => create.mutate(), disabled: !form.title || create.isPending, children: "Create" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "text", placeholder: "Search by title, alternative titles, author, or artist...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "h-11 pl-4 pr-10" }),
        searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2", onClick: () => setSearchQuery(""), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: typeFilter, onValueChange: setTypeFilter, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[140px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Type" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Types" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "manga", children: "MANGA" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "manhwa", children: "MANHWA" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "manhua", children: "MANHUA" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "novel", children: "NOVEL" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[140px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Status" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ongoing", children: "Ongoing" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "completed", children: "Completed" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "hiatus", children: "Hiatus" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: visibilityFilter, onValueChange: setVisibilityFilter, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[140px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Visibility" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "visible", children: "Visible" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "hidden", children: "Hidden" })
          ] })
        ] }),
        (searchQuery || typeFilter !== "all" || statusFilter !== "all" || visibilityFilter !== "all") && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => {
          setSearchQuery("");
          setTypeFilter("all");
          setStatusFilter("all");
          setVisibilityFilter("all");
          setCurrentPage(1);
        }, className: "text-muted-foreground", children: "Clear Filters" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto text-sm text-muted-foreground", children: [
          "Showing ",
          list.data?.series.length || 0,
          " of ",
          list.data?.totalCount || 0,
          " titles",
          list.data && list.data.totalPages > 1 && ` (Page ${currentPage} of ${list.data.totalPages})`
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card", children: [
      list.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 text-sm text-muted-foreground", children: "Loading…" }),
      list.data?.series.length === 0 && !list.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground", children: searchQuery || typeFilter !== "all" || statusFilter !== "all" || visibilityFilter !== "all" ? "No titles match your filters" : "No titles found" }),
      (list.data?.series || []).map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3", children: [
        s.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: s.cover_url, alt: "", className: "h-14 w-10 rounded object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-10 rounded bg-secondary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setSelectedSeries(s.id), className: "truncate text-left font-medium hover:text-primary", children: s.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "uppercase", children: s.type }),
            s.is_hidden && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "Hidden" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
            s.status,
            " · ",
            Number(s.rating_average || 0).toFixed(1),
            "★ · ",
            s.view_count,
            " views · ",
            s.chapter_count || 0,
            " chapters"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => setSelectedSeries(s.id), title: "Manage Chapters", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4 text-violet-600" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => {
          setEditingSeries(s);
          setForm(seriesToForm(s));
        }, title: "Edit Title", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => toggleHidden.mutate(s), title: s.is_hidden ? "Show" : "Hide", children: s.is_hidden ? /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-destructive" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { children: [
                'Delete "',
                s.title,
                '"?'
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "This also removes all chapters and pages. This cannot be undone." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => del.mutate(s.id), children: "Delete" })
            ] })
          ] })
        ] })
      ] }, s.id))
    ] }),
    list.data && list.data.totalPages > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => setCurrentPage((p) => Math.max(1, p - 1)), disabled: currentPage === 1 || list.isLoading, children: "Previous" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1", children: Array.from({
        length: Math.min(5, list.data.totalPages)
      }, (_, i) => {
        let pageNum;
        if (list.data.totalPages <= 5) {
          pageNum = i + 1;
        } else if (currentPage <= 3) {
          pageNum = i + 1;
        } else if (currentPage >= list.data.totalPages - 2) {
          pageNum = list.data.totalPages - 4 + i;
        } else {
          pageNum = currentPage - 2 + i;
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: currentPage === pageNum ? "default" : "outline", size: "sm", className: "w-10", onClick: () => setCurrentPage(pageNum), disabled: list.isLoading, children: pageNum }, pageNum);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => setCurrentPage((p) => Math.min(list.data.totalPages, p + 1)), disabled: currentPage === list.data.totalPages || list.isLoading, children: "Next" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editingSeries, onOpenChange: (v) => {
      if (!v) {
        setEditingSeries(null);
        setForm(emptySeriesForm);
      }
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[90vh] max-w-2xl overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Edit title" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesFormFields, { form, setForm }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => updateSeries.mutate(), disabled: !form.title || updateSeries.isPending, children: updateSeries.isPending ? "Saving..." : "Save changes" }) })
    ] }) })
  ] });
}
function SeriesFormFields({
  form,
  setForm
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Title *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.title, onChange: (e) => setForm({
        ...form,
        title: e.target.value
      }), placeholder: "Enter series title" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.type, onValueChange: (v) => setForm({
          ...form,
          type: v
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: seriesTypes.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t, children: t.toUpperCase() }, t)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.status, onValueChange: (v) => setForm({
          ...form,
          status: v
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: seriesStatuses.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t, children: t.charAt(0).toUpperCase() + t.slice(1) }, t)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Author" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.author, onChange: (e) => setForm({
          ...form,
          author: e.target.value
        }), placeholder: "Author name" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Artist" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.artist, onChange: (e) => setForm({
          ...form,
          artist: e.target.value
        }), placeholder: "Artist name" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Release Year" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: form.release_year, onChange: (e) => setForm({
          ...form,
          release_year: e.target.value
        }), placeholder: "2024" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Chapter Count" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: form.chapter_count, onChange: (e) => setForm({
          ...form,
          chapter_count: e.target.value
        }), placeholder: "0" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Cover URL" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.cover_url, onChange: (e) => setForm({
        ...form,
        cover_url: e.target.value
      }), placeholder: "https://example.com/cover.jpg" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Alternative Titles" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.alternative_titles, onChange: (e) => setForm({
        ...form,
        alternative_titles: e.target.value
      }), placeholder: "Alt title 1, Alt title 2" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Description" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 4, value: form.description, onChange: (e) => setForm({
        ...form,
        description: e.target.value
      }), placeholder: "Enter title description..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 rounded-md border border-border/40 p-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: form.is_featured, onChange: (e) => setForm({
          ...form,
          is_featured: e.target.checked
        }) }),
        "Featured"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: form.is_trending, onChange: (e) => setForm({
          ...form,
          is_trending: e.target.checked
        }) }),
        "Trending"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: form.is_hidden, onChange: (e) => setForm({
          ...form,
          is_hidden: e.target.checked
        }) }),
        "Hidden"
      ] })
    ] })
  ] });
}
function ChapterManager({
  seriesId,
  onBack
}) {
  const qc = useQueryClient();
  const {
    user
  } = useAuth();
  const series = useQuery({
    queryKey: ["admin", "series", seriesId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("series").select("*").eq("id", seriesId).single();
      if (error) throw error;
      return data;
    }
  });
  const chapters = useQuery({
    queryKey: ["admin", "chapters", seriesId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("chapters").select("*").eq("series_id", seriesId).order("chapter_number", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  const scanlationGroups = useQuery({
    queryKey: ["admin", "scanlation-groups", seriesId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("chapters").select("scanlation_group").eq("series_id", seriesId).not("scanlation_group", "is", null);
      if (error) throw error;
      const uniqueGroups = [...new Set(data?.map((c) => c.scanlation_group).filter(Boolean) ?? [])];
      return uniqueGroups.sort();
    }
  });
  const [open, setOpen] = reactExports.useState(false);
  const [editingChapter, setEditingChapter] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({
    chapter_number: "",
    title: "",
    image_urls: "",
    chapter_url: "",
    status: "published",
    scheduled_at: "",
    uploaded_by: "",
    scanlation_group: ""
  });
  const [extracting, setExtracting] = reactExports.useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = reactExports.useState(false);
  const [seriesUrl, setSeriesUrl] = reactExports.useState("");
  const [discoveredChapters, setDiscoveredChapters] = reactExports.useState([]);
  const [selectedChapters, setSelectedChapters] = reactExports.useState(/* @__PURE__ */ new Set());
  const [bulkUploading, setBulkUploading] = reactExports.useState(false);
  const userProfile = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const {
        data,
        error
      } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      if (error) return null;
      return data;
    },
    enabled: !!user
  });
  reactExports.useEffect(() => {
    if (open && userProfile.data?.username && !form.uploaded_by) {
      setForm((prev) => ({
        ...prev,
        uploaded_by: userProfile.data.username || ""
      }));
    }
  }, [open, userProfile.data?.username]);
  reactExports.useEffect(() => {
    if (bulkUploadOpen && userProfile.data?.username && !form.uploaded_by) {
      setForm((prev) => ({
        ...prev,
        uploaded_by: userProfile.data.username || ""
      }));
    }
  }, [bulkUploadOpen, userProfile.data?.username]);
  const create = useMutation({
    mutationFn: async () => {
      const chapterNum = parseFloat(form.chapter_number);
      if (isNaN(chapterNum)) throw new Error("Invalid chapter number");
      const {
        data: chapter,
        error: chapterError
      } = await supabase.from("chapters").insert({
        series_id: seriesId,
        chapter_number: chapterNum,
        title: form.title || null,
        slug: `chapter-${chapterNum}${form.title ? `-${slugify(form.title)}` : ""}`,
        chapter_type: "image",
        status: form.status,
        scheduled_at: form.status === "scheduled" && form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        uploaded_by: form.uploaded_by || null,
        scanlation_group: form.scanlation_group || null
      }).select().single();
      if (chapterError) throw chapterError;
      const urls = form.image_urls.split("\n").filter((u) => u.trim());
      if (urls.length === 0) throw new Error("At least one image URL is required");
      const pages = urls.map((url, idx) => ({
        chapter_id: chapter.id,
        page_number: idx + 1,
        image_url: url.trim()
      }));
      const {
        error: pagesError
      } = await supabase.from("chapter_pages").insert(pages);
      if (pagesError) throw pagesError;
    },
    onSuccess: () => {
      toast.success("Chapter uploaded");
      setOpen(false);
      setForm({
        chapter_number: "",
        title: "",
        image_urls: "",
        chapter_url: "",
        status: "published",
        scheduled_at: "",
        uploaded_by: "",
        scanlation_group: ""
      });
      qc.invalidateQueries({
        queryKey: ["admin", "chapters", seriesId]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const openChapterEdit = async (chapter) => {
    const {
      data,
      error
    } = await supabase.from("chapter_pages").select("image_url").eq("chapter_id", chapter.id).order("page_number");
    if (error) {
      toast.error(error.message);
      return;
    }
    setEditingChapter(chapter);
    setForm({
      chapter_number: String(chapter.chapter_number ?? ""),
      title: chapter.title ?? "",
      image_urls: (data ?? []).map((p) => p.image_url).join("\n"),
      chapter_url: "",
      status: chapter.status ?? "published",
      scheduled_at: chapter.scheduled_at ? new Date(chapter.scheduled_at).toISOString().slice(0, 16) : "",
      uploaded_by: chapter.uploaded_by ?? "",
      scanlation_group: chapter.scanlation_group ?? ""
    });
  };
  const extractFromUrl = async () => {
    if (!form.chapter_url.trim()) {
      toast.error("Please enter a chapter URL");
      return;
    }
    try {
      setExtracting(true);
      const result = await $extractImagesFromUrl({
        data: {
          url: form.chapter_url
        }
      });
      if (result.success && result.images) {
        setForm({
          ...form,
          image_urls: result.images.join("\n")
        });
        toast.success(`Extracted ${result.images.length} images from chapter URL`);
      } else {
        toast.error(result.error || "Failed to extract images");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to extract images");
    } finally {
      setExtracting(false);
    }
  };
  const discoverChapters = async () => {
    if (!seriesUrl.trim()) {
      toast.error("Please enter a series URL");
      return;
    }
    try {
      setExtracting(true);
      const result = await $extractChaptersFromUrl({
        data: {
          url: seriesUrl
        }
      });
      if (result.success && result.chapters) {
        setDiscoveredChapters(result.chapters);
        setSelectedChapters(new Set(result.chapters.map((_, i) => i)));
        toast.success(`Discovered ${result.chapters.length} chapters`);
      } else {
        toast.error(result.error || "Failed to discover chapters");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to discover chapters");
    } finally {
      setExtracting(false);
    }
  };
  const toggleChapterSelection = (index) => {
    const newSelected = new Set(selectedChapters);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedChapters(newSelected);
  };
  const bulkUploadChapters = async () => {
    if (selectedChapters.size === 0) {
      toast.error("Please select at least one chapter");
      return;
    }
    try {
      setBulkUploading(true);
      let successCount = 0;
      let failCount = 0;
      for (const index of Array.from(selectedChapters).sort((a, b) => a - b)) {
        const chapter = discoveredChapters[index];
        try {
          const result = await $extractImagesFromUrl({
            data: {
              url: chapter.url
            }
          });
          if (!result.success || !result.images) {
            throw new Error(result.error || "Failed to extract images");
          }
          const {
            data: newChapter,
            error: chapterError
          } = await supabase.from("chapters").insert({
            series_id: seriesId,
            chapter_number: chapter.chapterNumber,
            title: chapter.title || null,
            slug: `chapter-${chapter.chapterNumber}${chapter.title ? `-${slugify(chapter.title)}` : ""}`,
            chapter_type: "image",
            status: "published",
            uploaded_by: form.uploaded_by || null,
            scanlation_group: form.scanlation_group || null
          }).select().single();
          if (chapterError) throw chapterError;
          const pages = result.images.map((url, idx) => ({
            chapter_id: newChapter.id,
            page_number: idx + 1,
            image_url: url
          }));
          const {
            error: pagesError
          } = await supabase.from("chapter_pages").insert(pages);
          if (pagesError) throw pagesError;
          successCount++;
          toast.success(`Uploaded Chapter ${chapter.chapterNumber}`);
        } catch (error) {
          failCount++;
          console.error(`Failed to upload Chapter ${chapter.chapterNumber}:`, error);
          toast.error(`Failed: Chapter ${chapter.chapterNumber}`);
        }
      }
      toast.success(`Bulk upload complete: ${successCount} succeeded, ${failCount} failed`);
      setBulkUploadOpen(false);
      setSeriesUrl("");
      setDiscoveredChapters([]);
      setSelectedChapters(/* @__PURE__ */ new Set());
      qc.invalidateQueries({
        queryKey: ["admin", "chapters", seriesId]
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk upload failed");
    } finally {
      setBulkUploading(false);
    }
  };
  const updateChapter = useMutation({
    mutationFn: async () => {
      if (!editingChapter) throw new Error("No chapter selected");
      const chapterNum = parseFloat(form.chapter_number);
      if (isNaN(chapterNum)) throw new Error("Invalid chapter number");
      const {
        error: chapterError
      } = await supabase.from("chapters").update({
        chapter_number: chapterNum,
        title: form.title || null,
        slug: `chapter-${chapterNum}${form.title ? `-${slugify(form.title)}` : ""}`,
        status: form.status,
        scheduled_at: form.status === "scheduled" && form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        uploaded_by: form.uploaded_by || null,
        scanlation_group: form.scanlation_group || null,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", editingChapter.id);
      if (chapterError) throw chapterError;
      const urls = form.image_urls.split("\n").map((u) => u.trim()).filter(Boolean);
      if (urls.length === 0) throw new Error("At least one image URL is required");
      const {
        error: deleteError
      } = await supabase.from("chapter_pages").delete().eq("chapter_id", editingChapter.id);
      if (deleteError) throw deleteError;
      const {
        error: pagesError
      } = await supabase.from("chapter_pages").insert(urls.map((url, idx) => ({
        chapter_id: editingChapter.id,
        page_number: idx + 1,
        image_url: url
      })));
      if (pagesError) throw pagesError;
    },
    onSuccess: () => {
      toast.success("Chapter updated");
      setEditingChapter(null);
      setForm({
        chapter_number: "",
        title: "",
        image_urls: "",
        chapter_url: "",
        status: "published",
        scheduled_at: "",
        uploaded_by: "",
        scanlation_group: ""
      });
      qc.invalidateQueries({
        queryKey: ["admin", "chapters", seriesId]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const deleteChapter = useMutation({
    mutationFn: async (chapterId) => {
      await supabase.from("chapter_pages").delete().eq("chapter_id", chapterId);
      const {
        error
      } = await supabase.from("chapters").delete().eq("id", chapterId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Chapter deleted");
      qc.invalidateQueries({
        queryKey: ["admin", "chapters", seriesId]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: onBack, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: series.data?.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Manage chapters" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-semibold", children: [
        "Chapters (",
        chapters.data?.length || 0,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: bulkUploadOpen, onOpenChange: setBulkUploadOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "mr-1 h-4 w-4" }),
            "Bulk Upload from Series URL"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Bulk Upload Chapters from Series URL" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Uploaded By" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Uploader name", value: form.uploaded_by, onChange: (e) => setForm({
                    ...form,
                    uploaded_by: e.target.value
                  }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Auto-filled with your username" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Scanlation Group (Optional)" }),
                  scanlationGroups.data && scanlationGroups.data.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.scanlation_group, onValueChange: (v) => setForm({
                    ...form,
                    scanlation_group: v === "custom" ? "" : v
                  }), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select or add new" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      scanlationGroups.data.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: group, children: group }, group)),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "custom", children: "+ Add New Group" })
                    ] })
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Group/Team name", value: form.scanlation_group, onChange: (e) => setForm({
                    ...form,
                    scanlation_group: e.target.value
                  }) }),
                  scanlationGroups.data && scanlationGroups.data.length > 0 && form.scanlation_group === "" && /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Enter new group name", value: form.scanlation_group, onChange: (e) => setForm({
                    ...form,
                    scanlation_group: e.target.value
                  }), className: "mt-2" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-violet-600 font-semibold", children: "Series URL" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "https://example.com/manga/title-name", value: seriesUrl, onChange: (e) => setSeriesUrl(e.target.value), className: "flex-1" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: discoverChapters, disabled: !seriesUrl.trim() || extracting, className: "bg-violet-600 hover:bg-violet-700", children: extracting ? "Discovering..." : "Discover Chapters" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Paste the series main page URL. We'll automatically discover all available chapters." })
              ] }),
              discoveredChapters.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "font-semibold", children: [
                    "Select Chapters to Upload (",
                    selectedChapters.size,
                    "/",
                    discoveredChapters.length,
                    ")"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => setSelectedChapters(new Set(discoveredChapters.map((_, i) => i))), children: "Select All" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => setSelectedChapters(/* @__PURE__ */ new Set()), children: "Deselect All" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-96 overflow-y-auto border border-border/40 rounded-lg divide-y divide-border/40", children: discoveredChapters.map((chapter, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 p-3 hover:bg-secondary/40 cursor-pointer", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: selectedChapters.has(index), onChange: () => toggleChapterSelection(index), className: "h-4 w-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium", children: [
                      "Chapter ",
                      chapter.chapterNumber
                    ] }),
                    chapter.title && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground truncate", children: chapter.title }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground truncate", children: chapter.url })
                  ] })
                ] }, index)) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: bulkUploadChapters, disabled: selectedChapters.size === 0 || bulkUploading, className: "bg-violet-600 hover:bg-violet-700", children: bulkUploading ? "Uploading..." : `Upload ${selectedChapters.size} Chapter${selectedChapters.size !== 1 ? "s" : ""}` }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "bg-violet-600 hover:bg-violet-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
            "Upload Chapter"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Upload Chapter from URLs" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Chapter Number *" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "0.1", placeholder: "1 or 1.5", value: form.chapter_number, onChange: (e) => setForm({
                    ...form,
                    chapter_number: e.target.value
                  }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Status" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.status, onValueChange: (v) => setForm({
                    ...form,
                    status: v
                  }), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: chapterStatuses.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s, children: s.charAt(0).toUpperCase() + s.slice(1) }, s)) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Scheduled At" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "datetime-local", value: form.scheduled_at, onChange: (e) => setForm({
                    ...form,
                    scheduled_at: e.target.value
                  }), disabled: form.status !== "scheduled" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Chapter Title (Optional)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "e.g., The Beginning", value: form.title, onChange: (e) => setForm({
                  ...form,
                  title: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Uploaded By" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Uploader name", value: form.uploaded_by, onChange: (e) => setForm({
                    ...form,
                    uploaded_by: e.target.value
                  }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Auto-filled with your username" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Scanlation Group (Optional)" }),
                  scanlationGroups.data && scanlationGroups.data.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.scanlation_group, onValueChange: (v) => setForm({
                    ...form,
                    scanlation_group: v === "custom" ? "" : v
                  }), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select or add new" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      scanlationGroups.data.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: group, children: group }, group)),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "custom", children: "+ Add New Group" })
                    ] })
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Group/Team name", value: form.scanlation_group, onChange: (e) => setForm({
                    ...form,
                    scanlation_group: e.target.value
                  }) }),
                  scanlationGroups.data && scanlationGroups.data.length > 0 && form.scanlation_group === "" && /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Enter new group name", value: form.scanlation_group, onChange: (e) => setForm({
                    ...form,
                    scanlation_group: e.target.value
                  }), className: "mt-2" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-violet-600 font-semibold", children: "Option 1: Extract from Chapter URL" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 text-violet-600" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "https://example.com/manga/title/chapter-1", value: form.chapter_url, onChange: (e) => setForm({
                    ...form,
                    chapter_url: e.target.value
                  }), className: "flex-1" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: extractFromUrl, disabled: !form.chapter_url.trim() || extracting, variant: "outline", className: "border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white", children: extracting ? "Extracting..." : "Extract" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Paste a chapter URL from any manga/manhwa site and we'll automatically extract all images." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Option 2: Manual Image URLs (one per line) *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 10, placeholder: "https://example.com/page1.jpg\nhttps://example.com/page2.jpg\nhttps://example.com/page3.jpg", value: form.image_urls, onChange: (e) => setForm({
                  ...form,
                  image_urls: e.target.value
                }), className: "font-mono text-sm" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Or paste image URLs directly, one URL per line. Supports direct image links from any website." })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => create.mutate(), disabled: !form.chapter_number || !form.image_urls.trim() || create.isPending, className: "bg-violet-600 hover:bg-violet-700", children: create.isPending ? "Uploading..." : "Upload Chapter" }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card", children: [
      chapters.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 text-sm text-muted-foreground", children: "Loading..." }),
      chapters.data?.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 text-center text-sm text-muted-foreground", children: "No chapters yet." }),
      (chapters.data ?? []).map((ch) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded bg-violet-600/10 text-sm font-bold text-violet-600", children: ch.chapter_number }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/title/$titleSlug/$chapterSlug", params: {
              titleSlug: series.data?.slug || "",
              chapterSlug: ch.slug
            }, className: "truncate font-medium hover:text-violet-600", target: "_blank", children: [
              "Chapter ",
              ch.chapter_number,
              ch.title && `: ${ch.title}`
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(ch.created_at).toLocaleDateString() }),
            ch.scanlation_group && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-violet-600", children: ch.scanlation_group })
            ] }),
            ch.uploaded_by && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "by ",
                ch.uploaded_by
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => openChapterEdit(ch), title: "Edit Chapter", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-destructive" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { children: [
                "Delete Chapter ",
                ch.chapter_number,
                "?"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "This will permanently delete the chapter and all its pages." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => deleteChapter.mutate(ch.id), children: "Delete" })
            ] })
          ] })
        ] })
      ] }, ch.id))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editingChapter, onOpenChange: (v) => {
      if (!v) {
        setEditingChapter(null);
        setForm({
          chapter_number: "",
          title: "",
          image_urls: "",
          chapter_url: "",
          status: "published",
          scheduled_at: "",
          uploaded_by: "",
          scanlation_group: ""
        });
      }
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Edit Chapter" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Chapter Number *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "0.1", value: form.chapter_number, onChange: (e) => setForm({
              ...form,
              chapter_number: e.target.value
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.status, onValueChange: (v) => setForm({
              ...form,
              status: v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: chapterStatuses.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s, children: s.charAt(0).toUpperCase() + s.slice(1) }, s)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Scheduled At" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "datetime-local", value: form.scheduled_at, onChange: (e) => setForm({
              ...form,
              scheduled_at: e.target.value
            }), disabled: form.status !== "scheduled" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Chapter Title" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.title, onChange: (e) => setForm({
            ...form,
            title: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Uploaded By" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.uploaded_by, onChange: (e) => setForm({
              ...form,
              uploaded_by: e.target.value
            }), placeholder: "Uploader name" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Scanlation Group" }),
            scanlationGroups.data && scanlationGroups.data.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.scanlation_group, onValueChange: (v) => setForm({
              ...form,
              scanlation_group: v === "custom" ? "" : v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select or add new" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                scanlationGroups.data.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: group, children: group }, group)),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "custom", children: "+ Add New Group" })
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.scanlation_group, onChange: (e) => setForm({
              ...form,
              scanlation_group: e.target.value
            }), placeholder: "Group/Team name" }),
            scanlationGroups.data && scanlationGroups.data.length > 0 && form.scanlation_group === "" && /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Enter new group name", value: form.scanlation_group, onChange: (e) => setForm({
              ...form,
              scanlation_group: e.target.value
            }), className: "mt-2" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Image URLs (one per line) *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 12, value: form.image_urls, onChange: (e) => setForm({
            ...form,
            image_urls: e.target.value
          }), className: "font-mono text-sm" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => updateChapter.mutate(), disabled: !form.chapter_number || !form.image_urls.trim() || updateChapter.isPending, children: updateChapter.isPending ? "Saving..." : "Save changes" }) })
    ] }) })
  ] });
}
export {
  AdminSeries as component
};
