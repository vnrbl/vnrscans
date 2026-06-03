import { R as React, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { T as notFound } from "../_libs/tanstack__router-core.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { h as Route$j, u as useAuth, a as Button, S as Select, b as SelectTrigger, d as SelectValue, e as SelectContent, f as SelectItem, B as Badge, I as Input } from "./router-1xbLZGbP.mjs";
import { u as useDragScroll, D as DRAG_SCROLL_CONTAINER_CLASS } from "./useDragScroll-C5XUCbiC.mjs";
import { T as TITLE_CARD_WIDTH, a as TITLE_COVER_CLASS } from "./titleCardStyles-wF_NUguc.mjs";
import { B as BookOpen, y as UserPlus, z as Bookmark, A as UserCheck, r as Star, T as Trophy, k as Users, D as ArrowUpDown, b as Search, u as ChevronLeft, n as ChevronRight } from "../_libs/lucide-react.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
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
function SeriesDetail() {
  const {
    slug
  } = Route$j.useParams();
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const [selectedGroup, setSelectedGroup] = React.useState("all");
  const [sortOrder, setSortOrder] = React.useState("desc");
  const [searchQuery, setSearchQuery] = React.useState("");
  const seriesQ = useQuery({
    queryKey: ["series", "detail", slug],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("series").select("*,series_genres(genre:genres(id,name,slug)),series_tags(tag:tags(id,name,slug,color,icon))").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    }
  });
  const chaptersQ = useQuery({
    queryKey: ["chapters", slug, selectedGroup, sortOrder],
    queryFn: async () => {
      if (!seriesQ.data) return [];
      let query = supabase.from("chapters").select("id,slug,chapter_number,title,chapter_type,created_at,status,scheduled_at,uploaded_by,scanlation_group").eq("series_id", seriesQ.data.id).eq("status", "published");
      if (selectedGroup !== "all") {
        query = query.eq("scanlation_group", selectedGroup);
      }
      query = query.order("chapter_number", {
        ascending: sortOrder === "asc"
      });
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      return (data ?? []).filter((c) => !c.scheduled_at || new Date(c.scheduled_at) <= /* @__PURE__ */ new Date());
    },
    enabled: !!seriesQ.data
  });
  const filteredChapters = React.useMemo(() => {
    if (!chaptersQ.data) return [];
    if (!searchQuery.trim()) return chaptersQ.data;
    const query = searchQuery.toLowerCase();
    return chaptersQ.data.filter((c) => {
      const chapterNum = c.chapter_number?.toString() || "";
      const chapterTitle = c.title?.toLowerCase() || "";
      const uploader = (c.uploaded_by || "").toLowerCase();
      const group = (c.scanlation_group || "").toLowerCase();
      return chapterNum.includes(query) || chapterTitle.includes(query) || uploader.includes(query) || group.includes(query);
    });
  }, [chaptersQ.data, searchQuery]);
  const uniqueChapterCount = React.useMemo(() => {
    if (!chaptersQ.data) return 0;
    const uniqueChapters = new Set(chaptersQ.data.map((ch) => Math.floor(ch.chapter_number)));
    return uniqueChapters.size;
  }, [chaptersQ.data]);
  const scanlationGroups = useQuery({
    queryKey: ["scanlation-groups", slug],
    queryFn: async () => {
      if (!seriesQ.data) return [];
      const {
        data,
        error
      } = await supabase.from("chapters").select("scanlation_group").eq("series_id", seriesQ.data.id).eq("status", "published").not("scanlation_group", "is", null);
      if (error) throw error;
      const uniqueGroups = [...new Set(data?.map((c) => c.scanlation_group).filter(Boolean) ?? [])];
      return uniqueGroups.sort();
    },
    enabled: !!seriesQ.data
  });
  const followersCount = useQuery({
    queryKey: ["followers-count", slug],
    queryFn: async () => {
      if (!seriesQ.data) return 0;
      const {
        count,
        error
      } = await supabase.from("user_library").select("*", {
        count: "exact",
        head: true
      }).eq("series_id", seriesQ.data.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!seriesQ.data
  });
  const isFollowing = useQuery({
    queryKey: ["following", slug, user?.id],
    queryFn: async () => {
      if (!user || !seriesQ.data) return false;
      const {
        data
      } = await supabase.from("user_library").select("id").eq("user_id", user.id).eq("series_id", seriesQ.data.id).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!seriesQ.data
  });
  const myRating = useQuery({
    queryKey: ["rating", slug, user?.id],
    queryFn: async () => {
      if (!user || !seriesQ.data) return null;
      const {
        data
      } = await supabase.from("ratings").select("rating").eq("user_id", user.id).eq("series_id", seriesQ.data.id).maybeSingle();
      return data?.rating ?? null;
    },
    enabled: !!user && !!seriesQ.data
  });
  const libraryStatus = useQuery({
    queryKey: ["library-status", slug, user?.id],
    queryFn: async () => {
      if (!user || !seriesQ.data) return null;
      const {
        data
      } = await supabase.from("user_library").select("reading_status").eq("user_id", user.id).eq("series_id", seriesQ.data.id).maybeSingle();
      return data?.reading_status ?? null;
    },
    enabled: !!user && !!seriesQ.data
  });
  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user || !seriesQ.data) throw new Error("Sign in to follow");
      if (isFollowing.data) {
        await supabase.from("user_library").delete().eq("user_id", user.id).eq("series_id", seriesQ.data.id);
      } else {
        await supabase.from("user_library").insert({
          user_id: user.id,
          series_id: seriesQ.data.id,
          reading_status: "reading"
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["following", slug]
      });
      qc.invalidateQueries({
        queryKey: ["library-status", slug]
      });
      qc.invalidateQueries({
        queryKey: ["library"]
      });
      qc.invalidateQueries({
        queryKey: ["followers-count", slug]
      });
      toast.success(isFollowing.data ? "Unfollowed" : "Following");
    },
    onError: (e) => toast.error(e.message)
  });
  const rate = useMutation({
    mutationFn: async (rating) => {
      if (!user || !seriesQ.data) throw new Error("Sign in to rate");
      const {
        error
      } = await supabase.from("ratings").upsert({
        user_id: user.id,
        series_id: seriesQ.data.id,
        rating
      }, {
        onConflict: "user_id,series_id"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["rating", slug]
      });
      qc.invalidateQueries({
        queryKey: ["series", "detail", slug]
      });
      toast.success("Rating saved");
    },
    onError: (e) => toast.error(e.message)
  });
  const seriesRank = useQuery({
    queryKey: ["series-rank", slug],
    queryFn: async () => {
      if (!seriesQ.data) return null;
      const {
        data,
        error
      } = await supabase.from("series").select("id").order("view_count", {
        ascending: false
      });
      if (error) throw error;
      const rank = data?.findIndex((s2) => s2.id === seriesQ.data.id);
      return rank !== void 0 && rank >= 0 ? rank + 1 : null;
    },
    enabled: !!seriesQ.data
  });
  const readingHistory = useQuery({
    queryKey: ["reading-history", slug, user?.id],
    queryFn: async () => {
      if (!user || !seriesQ.data) return null;
      const {
        data
      } = await supabase.from("reading_history").select("chapter_id,chapters(slug,chapter_number)").eq("user_id", user.id).eq("series_id", seriesQ.data.id).order("updated_at", {
        ascending: false
      }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!user && !!seriesQ.data
  });
  const readChapters = useQuery({
    queryKey: ["read-chapters", slug, user?.id],
    queryFn: async () => {
      if (!user || !seriesQ.data) return /* @__PURE__ */ new Set();
      const {
        data
      } = await supabase.from("reading_history").select("chapter_id").eq("user_id", user.id).eq("series_id", seriesQ.data.id);
      return new Set(data?.map((r) => r.chapter_id) ?? []);
    },
    enabled: !!user && !!seriesQ.data
  });
  const ratingsCount = useQuery({
    queryKey: ["ratings-count", slug],
    queryFn: async () => {
      if (!seriesQ.data) return 0;
      const {
        count,
        error
      } = await supabase.from("ratings").select("*", {
        count: "exact",
        head: true
      }).eq("series_id", seriesQ.data.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!seriesQ.data
  });
  const setStatus = useMutation({
    mutationFn: async (status) => {
      if (!user || !seriesQ.data) throw new Error("Sign in to set status");
      const {
        error
      } = await supabase.from("user_library").update({
        reading_status: status,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("user_id", user.id).eq("series_id", seriesQ.data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["library-status", slug]
      });
      qc.invalidateQueries({
        queryKey: ["library"]
      });
      toast.success("Status updated");
    },
    onError: (e) => toast.error(e.message)
  });
  if (seriesQ.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-8 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-96 animate-pulse rounded-lg bg-secondary" }) });
  }
  if (!seriesQ.data) return null;
  const s = seriesQ.data;
  const lastReadChapter = readingHistory.data?.chapters;
  const firstChapter = chaptersQ.data?.[chaptersQ.data.length - 1];
  const isContinue = libraryStatus.data === "reading" && lastReadChapter;
  const readChapterSlug = isContinue ? lastReadChapter.slug : firstChapter?.slug;
  const readChapterNumber = isContinue ? lastReadChapter.chapter_number : firstChapter?.chapter_number;
  const readButtonLabel = isContinue ? "Resume" : "Start reading";
  const readButtonText = readChapterNumber != null ? `${readButtonLabel} Ch. ${readChapterNumber}` : readButtonLabel;
  const genres = (s.series_genres ?? []).map((sg) => sg.genre).filter(Boolean);
  const tags = (s.series_tags ?? []).map((st) => st.tag).filter(Boolean);
  const authors = splitNames(s.author);
  const artists = splitNames(s.artist);
  const contentRating = s.content_rating;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-6 lg:py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-8 lg:flex-row lg:gap-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "mx-auto w-full max-w-[220px] shrink-0 lg:mx-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border/50 bg-secondary shadow-xl", children: s.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: s.cover_url, alt: s.title, className: "aspect-[2/3] w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex aspect-[2/3] items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-12 w-12" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
          chaptersQ.data && chaptersQ.data.length > 0 && readChapterSlug && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/title/$titleSlug/$chapterSlug", params: {
            titleSlug: slug,
            chapterSlug: readChapterSlug
          }, className: "block", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "h-11 w-full bg-violet-600 text-base font-semibold hover:bg-violet-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "mr-2 h-4 w-4" }),
            readButtonText
          ] }) }),
          user && !isFollowing.data && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "h-11 w-full bg-violet-600/90 font-semibold hover:bg-violet-700", onClick: () => toggleFollow.mutate(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "mr-2 h-4 w-4" }),
            "Follow"
          ] }),
          user && isFollowing.data && /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: libraryStatus.data ?? "reading", onValueChange: (v) => setStatus.mutate(v), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-11 w-full border-violet-600/40 bg-violet-600/10 font-semibold text-violet-400", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Reading" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "reading", children: "Reading" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "completed", children: "Completed" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "plan_to_read", children: "Plan to Read" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "dropped", children: "Dropped" })
            ] })
          ] }),
          user && isFollowing.data && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "h-10 w-full border-border/60", onClick: () => toggleFollow.mutate(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { className: "mr-2 h-4 w-4" }),
            "Following"
          ] })
        ] }),
        user && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 flex justify-center gap-1", children: [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => rate.mutate(n), "aria-label": `Rate ${n}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: `h-5 w-5 transition ${(myRating.data ?? 0) >= n ? "fill-violet-500 text-violet-500" : "text-muted-foreground hover:text-violet-400"}` }) }, n)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "mb-3 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/home", className: "hover:text-violet-400", children: "Home" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "/" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/browse", search: {
            type: s.type
          }, className: "hover:text-violet-400", children: s.type })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "rounded-md uppercase", children: s.type }),
          contentRating && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `rounded-md uppercase ${contentRating === "safe" ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30" : contentRating === "suggestive" ? "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30" : "bg-red-600/20 text-red-400 hover:bg-red-600/30"}`, children: contentRating }),
          s.release_year && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-md", children: s.release_year }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "gap-1.5 rounded-md capitalize", children: [
            s.status === "ongoing" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-500" }),
            statusLabel(s.status)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.75rem] lg:leading-tight", children: s.title }),
        s.alternative_titles && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: s.alternative_titles }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm", children: [
          seriesRank.data && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-md bg-violet-600/15 px-2.5 py-1 font-semibold text-violet-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-4 w-4" }),
            "#",
            seriesRank.data.toLocaleString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-4 w-4 fill-violet-500 text-violet-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: Number(s.rating_average || 0).toFixed(1) }),
            "by ",
            ratingsCount.data?.toLocaleString() ?? 0,
            " users"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: followersCount.data?.toLocaleString() ?? 0 }),
            " ",
            "followed"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: Number(s.view_count || 0).toLocaleString() }),
            " views"
          ] })
        ] }),
        s.description && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 max-w-3xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExpandableSynopsis, { text: s.description }) }),
        genres.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(MetaSection, { label: "Genres", children: genres.map((genre) => /* @__PURE__ */ jsxRuntimeExports.jsx(MetaPill, { href: "/browse", search: {
          genre: genre.slug
        }, children: genre.name }, genre.id)) }),
        tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(MetaSection, { label: "Genres", children: tags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "cursor-default gap-1", style: {
          borderColor: tag.color,
          backgroundColor: `${tag.color}15`,
          color: tag.color
        }, children: [
          tag.icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tag.icon }),
          tag.name
        ] }, tag.id)) }),
        authors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(MetaSection, { label: "Authors", children: authors.map((name) => /* @__PURE__ */ jsxRuntimeExports.jsx(MetaPill, { children: name }, name)) }),
        artists.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(MetaSection, { label: "Artists", children: artists.map((name) => /* @__PURE__ */ jsxRuntimeExports.jsx(MetaPill, { children: name }, name)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(MetaSection, { label: "Info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(MetaPill, { children: [
            "Updated ",
            new Date(s.updated_at).toLocaleDateString()
          ] }),
          uniqueChapterCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
            const chaptersSection = document.getElementById("chapters-section");
            chaptersSection?.scrollIntoView({
              behavior: "smooth"
            });
          }, className: "inline-flex items-center rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground", children: [
            uniqueChapterCount,
            " chapters"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MetaPill, { className: "capitalize", children: s.type })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 grid gap-8 xl:grid-cols-[1fr_340px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "chapters-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xl font-bold", children: [
              "Chapters ",
              uniqueChapterCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                "(",
                uniqueChapterCount,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
              scanlationGroups.data && scanlationGroups.data.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedGroup, onValueChange: setSelectedGroup, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "All Groups" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Groups" }),
                  scanlationGroups.data.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: group, children: group }, group))
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setSortOrder((prev) => prev === "desc" ? "asc" : "desc"), className: "gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpDown, { className: "h-4 w-4" }),
                sortOrder === "desc" ? "Newest First" : "Oldest First"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "text", placeholder: "Search chapters by number, title, uploader, or group...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-9" })
          ] })
        ] }),
        chaptersQ.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: Array.from({
          length: 6
        }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 animate-pulse rounded bg-secondary/50" }, i)) }) : !filteredChapters || filteredChapters.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed border-border/50 p-8 text-center text-sm text-muted-foreground", children: searchQuery ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          'No chapters found matching "',
          searchQuery,
          '"'
        ] }) : selectedGroup !== "all" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "No chapters from ",
          selectedGroup,
          '. Try selecting "All Groups".'
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "No chapters yet. Check back soon." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-lg border border-border/40 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-border/40 bg-secondary/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-semibold", children: "Chapter" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "hidden px-4 py-3 text-left text-sm font-semibold md:table-cell", children: "Uploaded By" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "hidden px-4 py-3 text-left text-sm font-semibold md:table-cell", children: "Group" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-semibold", children: "Upload Date" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "hidden px-4 py-3 text-right text-sm font-semibold sm:table-cell", children: "Type" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border/40", children: filteredChapters.map((c) => {
            const isRead = readChapters.data?.has(c.id) ?? false;
            const isNew = new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
            const showNewBadge = isNew && !isRead;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "transition hover:bg-secondary/40", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/title/$titleSlug/$chapterSlug", params: {
                titleSlug: slug,
                chapterSlug: c.slug
              }, className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", style: isRead ? {
                  color: "#7f22fe"
                } : void 0, children: [
                  "Chapter ",
                  c.chapter_number,
                  c.title ? ` — ${c.title}` : ""
                ] }),
                showNewBadge && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-violet-600 text-xs uppercase text-white hover:bg-violet-700", children: "NEW" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "hidden px-4 py-3 md:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: c.uploaded_by || "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "hidden px-4 py-3 md:table-cell", children: c.scanlation_group ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-violet-600", children: c.scanlation_group }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: new Date(c.created_at).toLocaleDateString() }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "hidden px-4 py-3 text-right sm:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs uppercase", children: c.chapter_type === "novel" ? "Novel" : "Pages" }) })
            ] }, c.id);
          }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RecommendationsSidebar, { currentSeriesId: s.id, genres: s.series_genres })
    ] })
  ] }) });
}
function RecommendationsSidebar({
  currentSeriesId,
  genres
}) {
  const genreSlugs = genres?.map((sg) => sg.genre?.slug).filter(Boolean) || [];
  const {
    scrollRef,
    scrollBy,
    dragHandlers
  } = useDragScroll();
  const recommendations = useQuery({
    queryKey: ["recommendations", currentSeriesId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("series").select("id,slug,title,cover_url,type,rating_average,status,series_genres(genre:genres(slug))").neq("id", currentSeriesId).order("rating_average", {
        ascending: false
      }).limit(50);
      if (error) throw error;
      const scored = (data || []).map((title) => {
        const titleGenres = title.series_genres?.map((sg) => sg.genre?.slug).filter(Boolean) || [];
        const commonGenres = titleGenres.filter((g) => genreSlugs.includes(g));
        return {
          ...title,
          score: commonGenres.length
        };
      });
      return scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score || (b.rating_average || 0) - (a.rating_average || 0)).slice(0, 12);
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "min-w-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold", children: "Recommendations" }),
      (recommendations.data?.length ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden gap-1 md:flex", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", className: "h-8 w-8", onClick: () => scrollBy("left"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", className: "h-8 w-8", onClick: () => scrollBy("right"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }) })
      ] })
    ] }),
    recommendations.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-3 overflow-hidden", children: Array.from({
      length: 4
    }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${TITLE_CARD_WIDTH} shrink-0`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${TITLE_COVER_CLASS} animate-pulse bg-secondary` }) }, i)) }) : !recommendations.data || recommendations.data.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No similar titles found." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: scrollRef, ...dragHandlers, className: DRAG_SCROLL_CONTAINER_CLASS, style: {
      scrollbarWidth: "none",
      msOverflowStyle: "none"
    }, children: recommendations.data.map((title) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/title/$slug", params: {
      slug: title.slug
    }, className: `group ${TITLE_CARD_WIDTH} overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: TITLE_COVER_CLASS, children: [
        title.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: title.cover_url, alt: title.title, loading: "lazy", className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", draggable: false }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-8 w-8" }) }),
        title.rating_average && Number(title.rating_average) > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs backdrop-blur", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3 w-3 fill-violet-500 text-violet-500" }),
          Number(title.rating_average).toFixed(1)
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "line-clamp-2 text-xs font-semibold leading-tight group-hover:text-violet-400", children: title.title }) })
    ] }, title.id)) })
  ] });
}
function MetaSection({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children })
  ] });
}
function MetaPill({
  children,
  href,
  search,
  className = ""
}) {
  const pillClass = `inline-flex rounded-md bg-secondary/70 px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary ${className}`;
  if (href) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: href, search, className: pillClass, children });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: pillClass, children });
}
function ExpandableSynopsis({
  text
}) {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = text.length > 320;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm leading-relaxed text-muted-foreground", children: [
    expanded || !isLong ? text : `${text.slice(0, 320).trim()}…`,
    isLong && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setExpanded((prev) => !prev), className: "ml-1 font-medium text-violet-400 hover:text-violet-300 hover:underline", children: [
      "[",
      expanded ? "view less" : "view more",
      "]"
    ] })
  ] });
}
function splitNames(value) {
  if (!value) return [];
  return value.split(/[,;/|]/).map((part) => part.trim()).filter(Boolean);
}
function statusLabel(status) {
  switch (status) {
    case "ongoing":
      return "Releasing";
    case "completed":
      return "Completed";
    case "hiatus":
      return "Hiatus";
    default:
      return status;
  }
}
export {
  SeriesDetail as component
};
