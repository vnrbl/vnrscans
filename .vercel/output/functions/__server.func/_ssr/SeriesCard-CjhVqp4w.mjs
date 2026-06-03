import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { B as Badge } from "./router-DABr79Tj.mjs";
import { a as TITLE_COVER_CLASS } from "./titleCardStyles-wF_NUguc.mjs";
import { B as BookOpen, r as Star } from "../_libs/lucide-react.mjs";
function SeriesCard({ s, rank }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to: "/title/$slug",
      params: { slug: s.slug },
      className: "group block overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: TITLE_COVER_CLASS, children: [
          s.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: s.cover_url,
              alt: s.title,
              loading: "lazy",
              className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-10 w-10" }) }),
          rank !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white shadow-lg", children: [
            "#",
            rank
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: rank !== void 0 ? "absolute right-2 top-2" : "absolute left-2 top-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "bg-background/80 text-xs uppercase backdrop-blur", children: s.type }) }),
          s.rating_average && Number(s.rating_average) > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs backdrop-blur", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3 w-3 fill-accent text-accent" }),
            Number(s.rating_average).toFixed(1)
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "line-clamp-2 text-sm font-semibold leading-tight text-foreground group-hover:text-primary", children: s.title }),
          s.chapter_count && s.chapter_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
            s.chapter_count,
            " chapters"
          ] })
        ] })
      ]
    }
  );
}
function SeriesCardSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-lg border border-border/40 bg-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${TITLE_COVER_CLASS} animate-pulse bg-secondary` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-3/4 animate-pulse rounded bg-secondary" }) })
  ] });
}
export {
  SeriesCard as S,
  SeriesCardSkeleton as a
};
