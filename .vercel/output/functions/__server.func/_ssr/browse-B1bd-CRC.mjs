import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { S as SeriesGrid } from "./SeriesGrid-BsSk9FSB.mjs";
import { I as Input, a as Button, S as Select, b as SelectTrigger, d as SelectValue, e as SelectContent, f as SelectItem, c as cn, B as Badge } from "./router-DeJJK2lY.mjs";
import { R as Root2, T as Trigger, P as Portal, C as Content2 } from "../_libs/radix-ui__react-popover.mjs";
import { _ as _e } from "../_libs/cmdk.mjs";
import "../_libs/sonner.mjs";
import { b as Search, h as Check, w as LayoutGrid, x as List, B as BookOpen, r as Star } from "../_libs/lucide-react.mjs";
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
import "./SeriesCard-Bjjcgwe0.mjs";
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
const Popover = Root2;
const PopoverTrigger = Trigger;
const PopoverContent = reactExports.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = Content2.displayName;
const Command = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  _e,
  {
    ref,
    className: cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    ),
    ...props
  }
));
Command.displayName = _e.displayName;
const CommandInput = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center border-b px-3", "cmdk-input-wrapper": "", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    _e.Input,
    {
      ref,
      className: cn(
        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props
    }
  )
] }));
CommandInput.displayName = _e.Input.displayName;
const CommandList = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  _e.List,
  {
    ref,
    className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
    ...props
  }
));
CommandList.displayName = _e.List.displayName;
const CommandEmpty = reactExports.forwardRef((props, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(_e.Empty, { ref, className: "py-6 text-center text-sm", ...props }));
CommandEmpty.displayName = _e.Empty.displayName;
const CommandGroup = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  _e.Group,
  {
    ref,
    className: cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    ),
    ...props
  }
));
CommandGroup.displayName = _e.Group.displayName;
const CommandSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  _e.Separator,
  {
    ref,
    className: cn("-mx-1 h-px bg-border", className),
    ...props
  }
));
CommandSeparator.displayName = _e.Separator.displayName;
const CommandItem = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  _e.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    ),
    ...props
  }
));
CommandItem.displayName = _e.Item.displayName;
function BrowsePage() {
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [typeFilters, setTypeFilters] = reactExports.useState([]);
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [contentRating, setContentRating] = reactExports.useState("all");
  const [genreFilters, setGenreFilters] = reactExports.useState([]);
  const [sortBy, setSortBy] = reactExports.useState("latest");
  const [duration, setDuration] = reactExports.useState("all");
  const [viewMode, setViewMode] = reactExports.useState("grid");
  const genres = useQuery({
    queryKey: ["tags-as-genres"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tags").select("id,name,slug,color,icon").order("name");
      if (error) throw error;
      return data ?? [];
    }
  });
  const toggleType = (type) => {
    setTypeFilters((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };
  const toggleGenre = (slug) => {
    setGenreFilters((prev) => prev.includes(slug) ? prev.filter((g) => g !== slug) : [...prev, slug]);
  };
  const clearFilters = () => {
    setTypeFilters([]);
    setGenreFilters([]);
    setStatusFilter("all");
    setContentRating("all");
    setDuration("all");
  };
  const hasActiveFilters = typeFilters.length > 0 || genreFilters.length > 0 || statusFilter !== "all" || contentRating !== "all" || duration !== "all";
  const typeOptions = [{
    value: "manga",
    label: "MANGA"
  }, {
    value: "manhwa",
    label: "MANHWA"
  }, {
    value: "manhua",
    label: "MANHUA"
  }, {
    value: "novel",
    label: "NOVEL"
  }];
  const getDateFilter = () => {
    if (duration === "all") return null;
    const now = /* @__PURE__ */ new Date();
    switch (duration) {
      case "week":
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case "month":
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      case "year":
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      default:
        return null;
    }
  };
  const allManhwa = useQuery({
    queryKey: ["browse-manhwa", typeFilters, statusFilter, contentRating, genreFilters, sortBy, duration, searchQuery],
    queryFn: async () => {
      let query = supabase.from("series").select("id,slug,title,alternative_titles,description,cover_url,type,rating_average,status,author,artist,release_year,created_at,updated_at,view_count,content_rating,chapter_count,series_tags(tag:tags(id,name,slug,color,icon))");
      if (typeFilters.length > 0) {
        query = query.in("type", typeFilters);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (contentRating !== "all") {
        query = query.eq("content_rating", contentRating);
      }
      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte("updated_at", dateFilter);
      }
      switch (sortBy) {
        case "latest":
          query = query.order("updated_at", {
            ascending: false
          });
          break;
        case "popular":
          query = query.order("view_count", {
            ascending: false
          });
          break;
        case "rating":
          query = query.order("rating_average", {
            ascending: false
          });
          break;
        case "title":
          query = query.order("title", {
            ascending: true
          });
          break;
        case "oldest":
          query = query.order("created_at", {
            ascending: true
          });
          break;
        default:
          query = query.order("updated_at", {
            ascending: false
          });
      }
      query = query.limit(100);
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      const seriesWithChapters = await Promise.all((data ?? []).map(async (s) => {
        if (s.chapter_count && s.chapter_count > 0) {
          return s;
        }
        const {
          data: chapters
        } = await supabase.from("chapters").select("chapter_number").eq("series_id", s.id).eq("status", "published");
        const uniqueChapters = new Set((chapters ?? []).map((ch) => Math.floor(ch.chapter_number)));
        return {
          ...s,
          chapter_count: uniqueChapters.size
        };
      }));
      let filtered = seriesWithChapters;
      if (genreFilters.length > 0 && filtered.length > 0) {
        filtered = filtered.filter((series) => {
          const seriesGenres = series.series_tags?.map((st) => st.tag?.slug).filter(Boolean) || [];
          return genreFilters.every((selectedGenre) => seriesGenres.includes(selectedGenre));
        });
      }
      return filtered;
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-bold tracking-tight", children: "Browse Manga" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "Discover your next favorite series" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "text", placeholder: "Search manga by title...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "h-12 pl-10 pr-4" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "h-9 min-w-[140px] justify-start", children: typeFilters.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate", children: [
          "Type (",
          typeFilters.length,
          ")"
        ] }) : "Type" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverContent, { className: "w-[200px] p-0", align: "start", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Command, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CommandGroup, { children: typeOptions.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsx(CommandItem, { onSelect: () => toggleType(type.value), className: "cursor-pointer", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex h-4 w-4 items-center justify-center rounded border ${typeFilters.includes(type.value) ? "border-violet-600 bg-violet-600" : "border-input"}`, children: typeFilters.includes(type.value) && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3 text-white" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: type.label })
        ] }) }, type.value)) }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "h-9 min-w-[140px] justify-start", children: genreFilters.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate", children: [
          "Genre (",
          genreFilters.length,
          ")"
        ] }) : "Genre" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { className: "w-[700px] p-3", align: "start", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-sm font-medium", children: "Select Genres" }),
          genres.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 text-sm text-muted-foreground", children: "Loading..." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-5 gap-1", children: genres.data?.map((genre) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => toggleGenre(genre.slug), className: "flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-secondary cursor-pointer transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex h-4 w-4 shrink-0 items-center justify-center rounded border`, style: {
              borderColor: genreFilters.includes(genre.slug) ? genre.color : void 0,
              backgroundColor: genreFilters.includes(genre.slug) ? genre.color : void 0
            }, children: genreFilters.includes(genre.slug) && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3 text-white" }) }),
            genre.icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: genre.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs truncate", children: genre.name })
          ] }, genre.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-[140px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Status" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ongoing", children: "Ongoing" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "completed", children: "Completed" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "hiatus", children: "Hiatus" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: contentRating, onValueChange: setContentRating, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-[140px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Rating" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Ratings" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "safe", children: "Safe" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "suggestive", children: "Suggestive" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "nsfw", children: "NSFW" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pornographic", children: "Pornographic" })
        ] })
      ] }),
      "          ",
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: duration, onValueChange: setDuration, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-[140px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Duration" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Time" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "week", children: "This Week" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "month", children: "This Month" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "year", children: "This Year" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: sortBy, onValueChange: setSortBy, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-[140px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Sort By" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "latest", children: "Latest" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "popular", children: "Popular" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "rating", children: "Top Rated" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "title", children: "Title A-Z" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "oldest", children: "Oldest" })
        ] })
      ] }),
      hasActiveFilters && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: clearFilters, className: "h-9 text-muted-foreground hover:text-foreground", children: "Clear Filters" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          allManhwa.data?.length || 0,
          " manga found"
        ] }),
        (typeFilters.length > 0 || genreFilters.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
          typeFilters.length > 0 && `${typeFilters.length} type${typeFilters.length > 1 ? "s" : ""}`,
          typeFilters.length > 0 && genreFilters.length > 0 && " • ",
          genreFilters.length > 0 && `${genreFilters.length} genre${genreFilters.length > 1 ? "s" : ""}`,
          " selected"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: viewMode === "grid" ? "default" : "ghost", size: "icon", className: "h-8 w-8", onClick: () => setViewMode("grid"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: viewMode === "list" ? "default" : "ghost", size: "icon", className: "h-8 w-8", onClick: () => setViewMode("list"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "h-4 w-4" }) })
      ] })
    ] }),
    viewMode === "grid" ? /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesGrid, { items: allManhwa.data, loading: allManhwa.isLoading, emptyMessage: "No manga found. Try adjusting your filters or search query.", showRank: sortBy === "popular" || sortBy === "rating" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesList, { items: allManhwa.data, loading: allManhwa.isLoading })
  ] }) });
}
function SeriesList({
  items,
  loading
}) {
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: Array.from({
      length: 6
    }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 animate-pulse rounded-lg bg-secondary" }, i)) });
  }
  if (!items || items.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed border-border/50 p-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "No manga found. Try adjusting your filters." }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: items.map((s, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/title/$slug", params: {
    slug: s.slug
  }, className: "flex gap-4 rounded-lg border border-border/40 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex shrink-0 items-start", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-violet-600/20 text-lg font-bold text-violet-600", children: [
      "#",
      index + 1
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-32 shrink-0 overflow-hidden rounded-lg bg-secondary shadow-md lg:w-40", children: s.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: s.cover_url, alt: s.title, className: "h-48 w-full object-cover lg:h-60" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-48 lg:h-60 items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-10 w-10" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-lg line-clamp-1 hover:text-violet-600 transition-colors", children: s.title }),
          s.alternative_titles && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground line-clamp-1 mt-0.5", children: s.alternative_titles })
        ] }),
        s.rating_average && Number(s.rating_average) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 rounded-full bg-accent/20 px-2 py-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-4 w-4 fill-accent text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: Number(s.rating_average).toFixed(2) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs uppercase font-semibold", children: s.type }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: s.status }),
        s.content_rating && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: s.content_rating === "safe" ? "default" : s.content_rating === "suggestive" ? "secondary" : "destructive", className: "text-xs uppercase", children: s.content_rating }),
        s.release_year && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: s.release_year })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm text-muted-foreground", children: [
        s.chapter_count && s.chapter_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-3.5 w-3.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: s.chapter_count }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "chapters" })
        ] }),
        s.view_count && s.view_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Views:" }),
          " ",
          s.view_count.toLocaleString()
        ] })
      ] }),
      (s.author || s.artist) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm text-muted-foreground", children: [
        s.author && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Author:" }),
          " ",
          s.author
        ] }),
        s.artist && s.artist !== s.author && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Artist:" }),
          " ",
          s.artist
        ] })
      ] }),
      s.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground line-clamp-2 leading-relaxed", children: s.description }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: s.series_tags?.slice(0, 5).map((st) => st.tag ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "text-xs hover:bg-violet-600/20", style: {
        borderColor: st.tag.color,
        backgroundColor: `${st.tag.color}10`,
        color: st.tag.color
      }, children: [
        st.tag.icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mr-1", children: st.tag.icon }),
        st.tag.name
      ] }, st.tag.id) : null) })
    ] })
  ] }, s.id)) });
}
export {
  BrowsePage as component
};
