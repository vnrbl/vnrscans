import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as SeriesCardSkeleton, S as SeriesCard } from "./SeriesCard-reLvQmIK.mjs";
function SeriesGrid({
  items,
  loading,
  emptyMessage = "No series found.",
  showRank = false
}) {
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", children: Array.from({ length: 12 }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesCardSkeleton, {}, i)) });
  }
  if (!items || items.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed border-border/50 p-12 text-center text-sm text-muted-foreground", children: emptyMessage });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", children: items.map((s, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesCard, { s, rank: showRank ? index + 1 : void 0 }, s.id)) });
}
export {
  SeriesGrid as S
};
