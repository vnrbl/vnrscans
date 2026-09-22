export function slugifyChapterPart(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Unique slug per series; includes scanlation group when set (does NOT include chapter title). */
export function buildChapterSlug(
  chapterNumber: number,
  options?: { title?: string | null; scanlationGroup?: string | null }
): string {
  const num = String(chapterNumber);
  let slug = `chapter-${num}`;
  const group = options?.scanlationGroup?.trim();
  if (group) {
    slug += `-${slugifyChapterPart(group)}`;
  }
  return slug;
}

/**
 * Normalizes any chapter slug, chapter record, or chapter number into the clean format:
 * `chapter-${chapterNumber}` (or `chapter-${chapterNumber}-${group}`).
 * Strips out chapter title names from URL slugs.
 */
export function getCleanChapterSlug(
  chapter:
    | {
        chapter_number?: number | string | null;
        chapterNumber?: number | string | null;
        slug?: string | null;
        scanlation_group?: string | null;
        scanlationGroup?: string | null;
      }
    | string
    | number
): string {
  if (typeof chapter === "number") {
    return `chapter-${chapter}`;
  }
  if (typeof chapter === "string") {
    const match = chapter.match(/^(chapter-[0-9]+(?:\.[0-9]+)?)(?:-.*)?$/i);
    if (match) {
      return match[1].toLowerCase();
    }
    const numMatch = chapter.match(/^([0-9]+(?:\.[0-9]+)?)$/);
    if (numMatch) {
      return `chapter-${numMatch[1]}`;
    }
    return chapter;
  }

  const num = chapter.chapter_number ?? chapter.chapterNumber;
  if (num != null && !isNaN(Number(num))) {
    const group = chapter.scanlation_group ?? chapter.scanlationGroup;
    return buildChapterSlug(Number(num), { scanlationGroup: group });
  }

  if (chapter.slug) {
    const match = chapter.slug.match(/^(chapter-[0-9]+(?:\.[0-9]+)?)(?:-.*)?$/i);
    if (match) {
      return match[1].toLowerCase();
    }
    return chapter.slug;
  }

  return "chapter-1";
}

export const SCANLATION_GROUP_NONE = "__none__";
export const SCANLATION_GROUP_NEW = "__new__";

export function resolveScanlationGroup(
  selectValue: string,
  newGroupName: string
): string | null {
  if (selectValue === SCANLATION_GROUP_NONE) return null;
  if (selectValue === SCANLATION_GROUP_NEW) {
    const trimmed = newGroupName.trim();
    return trimmed || null;
  }
  return selectValue.trim() || null;
}

export function scanlationGroupToSelectValue(
  group: string | null | undefined,
  knownGroups: string[]
): { selectValue: string; newGroupName: string } {
  if (!group?.trim()) {
    return { selectValue: SCANLATION_GROUP_NONE, newGroupName: "" };
  }
  if (knownGroups.includes(group)) {
    return { selectValue: group, newGroupName: "" };
  }
  return { selectValue: SCANLATION_GROUP_NEW, newGroupName: group };
}

/**
 * Resolves chapter image URLs, routing hotlink-protected sources (e.g. wowpic1.store / comix.to)
 * through our safe server-side image proxy with appropriate Referer headers.
 */
export function resolveChapterImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // If already proxied, return as-is
  if (trimmed.startsWith("/api/proxy/image")) {
    return trimmed;
  }

  // Detect hotlink-protected CDNs that block foreign referrers or require comix.to referer
  if (
    trimmed.includes("wowpic1.store") ||
    trimmed.includes("wowpic") ||
    (trimmed.includes("comix.to") && !trimmed.includes("static.comix.to"))
  ) {
    return `/api/proxy/image?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}
