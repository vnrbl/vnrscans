"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Buildings,
  ChatTeardropText,
  Checks,
  CircleNotch,
  Compass,
  FileArrowDown,
  Flame,
  ListPlus,
  MagnifyingGlass,
  Plus,
  RadioButton,
  ShareFat,
  SlidersHorizontal,
  Users,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * Search Modal
 *
 * A minimalist command-palette panel: a search bar that live-filters the result
 * list, removable/toggleable "I'm looking for…" tags, people/series rows with per-row
 * actions, a quick-actions list with keyboard hints, and a files/releases section.
 *
 * Self-contained, prop-driven React component adapting to light and dark modes.
 */

export interface SearchTag {
  id?: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
}

export interface SearchResultAction {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
}

export interface SearchResult {
  /** Primary label (also matched against the query). */
  name: string;
  /** Secondary text such as type, rating, or context (also matched). */
  meta?: string;
  /** Avatar or cover image URL. Falls back to a neutral square/circle. */
  avatar?: string;
  /** Avatar shape - "rounded" for manga covers or "circle" for user avatars. */
  avatarShape?: "rounded" | "circle";
  /** Link target for the row. */
  href?: string;
  /** Optional badge (e.g. "TRENDING", "HOT"). */
  badge?: string;
  /** Trailing action icons. */
  actions?: SearchResultAction[];
}

export interface QuickAction {
  label: string;
  icon?: React.ReactNode;
  /** Keyboard hint shown on the right (e.g. "B", "L", "R"). */
  shortcut?: string;
  onClick?: () => void;
}

export interface SearchFile {
  name: string;
  /** File extension or chapter number shown dimmed after the name (e.g. "Ch. 120"). */
  ext?: string;
  icon?: React.ReactNode;
  /** Show the green "verified" checks next to the name. */
  verified?: boolean;
  onClick?: () => void;
  onShare?: () => void;
}

export interface SearchModalProps {
  /** Placeholder for the search input. */
  placeholder?: string;
  /** Filter tags. */
  tags?: SearchTag[];
  /** Called when a tag is clicked / toggled. */
  onTagClick?: (tag: SearchTag, index: number) => void;
  /** Called when a tag remove button is clicked. */
  onTagRemove?: (tag: SearchTag, index: number) => void;
  /** Result rows, live-filtered by the query. */
  results?: SearchResult[];
  /** Title for results section. */
  resultsTitle?: string;
  /** Total count for results header. */
  resultsCount?: number;
  /** Quick-action rows. */
  quickActions?: QuickAction[];
  /** Title for quick actions section. */
  quickActionsTitle?: string;
  /** Files or recent chapter releases rows. */
  files?: SearchFile[];
  /** Title for files / releases section. */
  filesTitle?: string;
  /** Initial query value. */
  defaultQuery?: string;
  /** Loading state indicator. */
  loading?: boolean;
  /** Called as the query changes. */
  onQueryChange?: (query: string) => void;
  /** Called when Enter is pressed with current query. */
  onSubmitQuery?: (query: string) => void;
  /** Called when a result row is clicked. */
  onSelectResult?: (result: SearchResult, index: number) => void;
  /** Extra classes for the root panel. */
  className?: string;

  /** Render as a centered overlay with a backdrop instead of an inline panel. */
  modal?: boolean;
  /** Controlled open state (modal mode). */
  open?: boolean;
  /** Uncontrolled initial open state (modal mode). Defaults to false. */
  defaultOpen?: boolean;
  /** Called when the modal opens (true) or closes (false). */
  onOpenChange?: (open: boolean) => void;
  /** Key (pressed with ⌘/Ctrl) that toggles the modal. Defaults to "k"; set null to disable. */
  hotkey?: string | null;
  /** Close the modal on Escape. Defaults to true. */
  closeOnEscape?: boolean;
  /** Extra classes for the overlay wrapper. */
  overlayClassName?: string;
}

const ICON = "h-[18px] w-[18px] text-neutral-400 dark:text-neutral-500 shrink-0";

const DEFAULT_TAGS: SearchTag[] = [
  { label: "Manga", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { label: "Manhwa", icon: <Flame className="h-3.5 w-3.5" /> },
  { label: "Manhua", icon: <Compass className="h-3.5 w-3.5" /> },
  { label: "Novels", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { label: "Users", icon: <Users className="h-3.5 w-3.5" /> },
  { label: "Groups", icon: <Buildings className="h-3.5 w-3.5" /> },
];

const DEFAULT_RESULTS: SearchResult[] = [
  {
    name: "Ninja Reincarnation",
    meta: "Manhwa • ★ 4.9 • 240K views",
    avatarShape: "rounded",
    actions: [
      { icon: <ListPlus className="h-4 w-4" />, label: "Bookmark" },
      { icon: <ShareFat className="h-4 w-4" />, label: "Share" },
    ],
  },
  {
    name: "Solo Leveling: Ragnarok",
    meta: "Manhwa • ★ 4.95 • 1.2M views",
    avatarShape: "rounded",
    actions: [
      { icon: <ListPlus className="h-4 w-4" />, label: "Bookmark" },
      { icon: <ShareFat className="h-4 w-4" />, label: "Share" },
    ],
  },
];

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { label: "Browse All Series", shortcut: "B", icon: <Compass className="h-[15px] w-[15px]" /> },
  { label: "Explore Library", shortcut: "L", icon: <BookOpen className="h-[15px] w-[15px]" /> },
  { label: "Roll Random Series", shortcut: "R", icon: <Flame className="h-[15px] w-[15px]" /> },
];

const DEFAULT_FILES: SearchFile[] = [
  { name: "Ninja Reincarnation", ext: "Ch. 34", verified: true },
  { name: "Solo Leveling: Ragnarok", ext: "Ch. 52", verified: true },
];

export function SearchModal({
  placeholder = "Search series, authors, groups, or press Enter...",
  tags = DEFAULT_TAGS,
  onTagClick,
  onTagRemove,
  results = DEFAULT_RESULTS,
  resultsTitle,
  resultsCount,
  quickActions = DEFAULT_QUICK_ACTIONS,
  quickActionsTitle = "Quick actions",
  files = DEFAULT_FILES,
  filesTitle = "Recent Releases",
  defaultQuery = "",
  loading = false,
  onQueryChange,
  onSubmitQuery,
  onSelectResult,
  className,
  modal = false,
  open,
  defaultOpen = false,
  onOpenChange,
  hotkey = "k",
  closeOnEscape = true,
  overlayClassName,
}: SearchModalProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [activeTags, setActiveTags] = useState<SearchTag[]>(tags);

  useEffect(() => {
    setActiveTags(tags);
  }, [tags]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Open state — controlled via `open`, otherwise internal.
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const actualOpen = isControlled ? open : internalOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );

  // Keep the latest open state / setter reachable from the one-time listener.
  const openRef = useRef(actualOpen);
  const setOpenRef = useRef(setOpen);
  useEffect(() => {
    openRef.current = actualOpen;
    setOpenRef.current = setOpen;
  });

  // ⌘K / Ctrl+K to toggle, Escape to close.
  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (hotkey && e.key.toLowerCase() === hotkey.toLowerCase() && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenRef.current(!openRef.current);
      } else if (closeOnEscape && e.key === "Escape" && openRef.current) {
        setOpenRef.current(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal, hotkey, closeOnEscape]);

  // Focus the input when the modal opens.
  useEffect(() => {
    if (modal && actualOpen) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [modal, actualOpen]);

  // Filter results if caller hasn't pre-filtered them
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) => `${r.name} ${r.meta ?? ""}`.toLowerCase().includes(q));
  }, [query, results]);

  const handleQuery = (value: string) => {
    setQuery(value);
    onQueryChange?.(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmitQuery?.(query);
    }
  };

  const removeTag = (index: number) => {
    const targetTag = activeTags[index];
    if (onTagRemove && targetTag) {
      onTagRemove(targetTag, index);
    } else {
      setActiveTags((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const resolvedResultsTitle = resultsTitle || (query.trim().length >= 2 ? "Search Results" : "Trending Series");
  const countToShow = resultsCount !== undefined ? resultsCount : filteredResults.length;

  const panel = (
    <div
      role={modal ? "dialog" : undefined}
      aria-modal={modal ? true : undefined}
      className={cn(
        "mx-auto w-full max-w-xl overflow-hidden rounded-2xl liquid-glass-window text-neutral-900 dark:text-white",
        className,
      )}
    >
      {/* Search bar */}
      <div className="flex items-center gap-1.5 border-b border-black/[0.06] px-4 py-3.5 dark:border-white/[0.06]">
        {loading ? (
          <CircleNotch className={cn(ICON, "animate-spin text-purple-400")} />
        ) : (
          <MagnifyingGlass className={ICON} />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-current outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-normal"
        />
        <div className="flex shrink-0 items-center gap-2">
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => handleQuery("")}
              aria-label="Clear query"
              className="text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200 transition-colors p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 rounded-md border border-black/[0.06] bg-black/[0.03] px-1.5 py-0.5 font-sans text-[11px] font-medium text-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-neutral-500">
            <span className="text-[13px] leading-none">⌘</span>
            {modal && hotkey ? hotkey.toUpperCase() : "K"}
          </kbd>
        </div>
      </div>

      {/* Tags ("I'm looking for...") */}
      {activeTags.length > 0 ? (
        <div className="border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.06]">
          <span className="text-[12px] font-medium text-neutral-400 dark:text-neutral-500">I&apos;m looking for...</span>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {activeTags.map((tag, i) => {
              const isActive = tag.active ?? false;
              return (
                <button
                  key={`${tag.label}-${i}`}
                  type="button"
                  onClick={() => onTagClick?.(tag, i)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-2 text-[12px] font-medium transition-all cursor-pointer ring-1 ring-inset",
                    isActive
                      ? "bg-purple-600 text-white ring-purple-500 shadow-sm"
                      : "bg-black/[0.04] text-neutral-600 ring-black/[0.06] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-neutral-300 dark:ring-white/[0.08] dark:hover:bg-white/[0.1] dark:hover:text-white"
                  )}
                >
                  {tag.icon}
                  <span>{tag.label}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(i);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        removeTag(i);
                      }
                    }}
                    aria-label={`Remove ${tag.label}`}
                    className="ml-0.5 text-current opacity-60 transition-opacity hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Results Section */}
      <div className="border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5 text-[12px] font-medium text-neutral-400 dark:text-neutral-500">
          <span>{resolvedResultsTitle}</span>
          <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-300">
            {countToShow}
          </span>
        </div>

        {filteredResults.length > 0 ? (
          <ul className="max-h-[290px] overflow-y-auto px-1.5 pb-1.5 overscroll-contain">
            {filteredResults.map((result, i) => (
              <li key={`${result.name}-${i}`}>
                <a
                  href={result.href ?? "#"}
                  onClick={(e) => {
                    if (!result.href || result.href === "#") e.preventDefault();
                    onSelectResult?.(result, i);
                  }}
                  className="group relative flex items-center rounded-xl px-2.5 py-2 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                >
                  {result.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.avatar}
                      alt={result.name}
                      className={cn(
                        "shrink-0 object-cover ring-1 ring-black/10 dark:ring-white/10",
                        result.avatarShape === "circle" ? "h-7 w-7 rounded-full" : "h-9 w-7 rounded-md"
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        "shrink-0 bg-neutral-200 dark:bg-neutral-800 ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center text-neutral-400",
                        result.avatarShape === "circle" ? "h-7 w-7 rounded-full" : "h-9 w-7 rounded-md"
                      )}
                    >
                      <BookOpen className="h-4 w-4" />
                    </span>
                  )}
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-purple-400 transition-colors">
                        {result.name}
                      </span>
                      {result.badge && (
                        <span className="shrink-0 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 border border-purple-500/20">
                          {result.badge}
                        </span>
                      )}
                    </div>
                    {result.meta && (
                      <p className="truncate text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {result.meta}
                      </p>
                    )}
                  </div>
                  {result.actions && result.actions.length > 0 ? (
                    <span className="ml-auto flex items-center gap-1.5 pl-3 text-neutral-400 opacity-60 transition-opacity group-hover:opacity-100 dark:text-neutral-500">
                      {result.actions.map((action, ai) => (
                        <button
                          key={ai}
                          type="button"
                          title={action.label}
                          aria-label={action.label}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            action.onClick?.();
                          }}
                          className="rounded-lg p-1.5 hover:bg-black/[0.06] hover:text-neutral-700 dark:hover:bg-white/[0.08] dark:hover:text-neutral-200 transition-all cursor-pointer"
                        >
                          {action.icon}
                        </button>
                      ))}
                    </span>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
            No series matching &ldquo;{query}&rdquo;
          </div>
        )}
      </div>

      {/* Quick actions */}
      {quickActions.length > 0 ? (
        <div className="border-b border-black/[0.06] px-1.5 py-1.5 dark:border-white/[0.06]">
          <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {quickActionsTitle}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {quickActions.map((action, i) => (
              <button
                key={`${action.label}-${i}`}
                type="button"
                onClick={action.onClick}
                className="relative flex items-center rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05] cursor-pointer"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-black/[0.04] text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-300">
                  {action.icon ?? <Plus className="h-3.5 w-3.5" />}
                </span>
                <span className="pl-2.5 text-xs font-medium truncate">{action.label}</span>
                {action.shortcut ? (
                  <kbd className="ml-auto flex h-5 w-5 items-center justify-center rounded bg-black/[0.04] font-sans text-[10px] font-bold text-neutral-500 ring-1 ring-inset ring-black/[0.04] dark:bg-white/[0.06] dark:text-neutral-400 dark:ring-white/[0.06]">
                    {action.shortcut}
                  </kbd>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Files / Recent Releases */}
      {files.length > 0 ? (
        <div className="px-1.5 py-1.5">
          <div className="flex items-center justify-between px-2.5 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            <span>{filesTitle}</span>
            <span className="font-mono text-[10px]">{files.length}</span>
          </div>
          <div className="space-y-0.5">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                onClick={file.onClick}
                className="group relative flex items-center rounded-lg px-2.5 py-1.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05] cursor-pointer"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-400">
                  {file.icon ?? <FileArrowDown className="h-3.5 w-3.5" />}
                </span>
                <span className="flex items-center gap-1.5 pl-2.5 text-xs font-medium truncate">
                  <span className="truncate">{file.name}</span>
                  {file.ext ? (
                    <span className="shrink-0 text-neutral-400 dark:text-neutral-500 font-mono text-[11px]">
                      {file.ext}
                    </span>
                  ) : null}
                  {file.verified ? <Checks className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : null}
                </span>
                {file.onShare && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      file.onShare?.();
                    }}
                    className="ml-auto flex items-center gap-1 text-xs text-neutral-400 opacity-60 transition-all hover:text-neutral-700 group-hover:opacity-100 dark:text-neutral-500 dark:hover:text-neutral-200 p-1"
                    title="Share"
                    aria-label={`Share ${file.name}`}
                  >
                    <ShareFat weight="bold" className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  if (!modal) return panel;

  return (
    <div
      onClick={() => setOpen(false)}
      aria-hidden={!actualOpen}
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 pt-[8vh] sm:pt-[12vh] transition-opacity duration-200",
        actualOpen ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0",
        overlayClassName,
      )}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative z-10 w-full max-w-xl transition-all duration-200 ease-out",
          actualOpen ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-[0.98] opacity-0",
        )}
      >
        {panel}
      </div>
    </div>
  );
}

export default SearchModal;
