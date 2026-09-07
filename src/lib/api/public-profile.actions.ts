"use server";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function $getPublicUserRoles(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("[public-profile.actions] Error fetching user roles:", error);
      return [];
    }
    return (data || []).map((r: any) => r.role);
  } catch (err) {
    console.error("[public-profile.actions] Exception in $getPublicUserRoles:", err);
    return [];
  }
}

export async function $getPublicEquippedBadge(userId: string): Promise<any | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from("user_badges")
      .select(`
        *,
        badge:badge_id(*)
      `)
      .eq("user_id", userId)
      .eq("is_equipped", true)
      .maybeSingle();

    if (error) {
      console.error("[public-profile.actions] Error fetching equipped badge:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("[public-profile.actions] Exception in $getPublicEquippedBadge:", err);
    return null;
  }
}

export async function $getPublicReadingPreferences(userId: string): Promise<Array<{
  name: string;
  seriesCount: number;
  chapterCount: number;
  minutes: number;
}>> {
  if (!userId) return [];
  try {
    // 1. Fetch reading history entries via server client (bypasses RLS)
    const { data: historyData, error: historyError } = await supabaseAdmin
      .from("reading_history")
      .select("series_id,chapter_id")
      .eq("user_id", userId)
      .limit(3000);

    if (historyError || !historyData || historyData.length === 0) {
      return [];
    }

    // 2. Aggregate chapters per series
    const seriesChapterMap = new Map<string, number>();
    for (const h of historyData) {
      if (h.series_id) {
        seriesChapterMap.set(h.series_id, (seriesChapterMap.get(h.series_id) || 0) + 1);
      }
    }

    const seriesIds = Array.from(seriesChapterMap.keys());
    if (seriesIds.length === 0) return [];

    // 3. Batch query series_genres in chunks of 50
    const allSgData: any[] = [];
    for (let i = 0; i < seriesIds.length; i += 50) {
      const batchIds = seriesIds.slice(i, i + 50);
      const { data: sgData, error: sgError } = await supabaseAdmin
        .from("series_genres")
        .select("series_id,genre_id")
        .in("series_id", batchIds);
      if (!sgError && sgData) {
        allSgData.push(...sgData);
      }
    }
    if (allSgData.length === 0) return [];

    // 4. Get genre names
    const genreIds = Array.from(new Set(allSgData.map((sg: any) => sg.genre_id)));
    if (genreIds.length === 0) return [];
    const { data: genresData, error: genresError } = await supabaseAdmin
      .from("genres")
      .select("id,name")
      .in("id", genreIds);
    if (genresError || !genresData) return [];

    const genreNameMap = new Map(genresData.map((g: any) => [g.id, g.name]));

    // 5. Map series to genres and aggregate
    const seriesToGenres = new Map<string, string[]>();
    for (const sg of allSgData) {
      const gName = genreNameMap.get(sg.genre_id);
      if (!gName) continue;
      const list = seriesToGenres.get(sg.series_id) || [];
      list.push(gName);
      seriesToGenres.set(sg.series_id, list);
    }

    const genreAgg = new Map<string, { name: string; chapters: number; seriesSet: Set<string>; minutes: number }>();
    for (const [seriesId, chapCount] of seriesChapterMap.entries()) {
      const genres = seriesToGenres.get(seriesId) || [];
      for (const gName of genres) {
        const current = genreAgg.get(gName) || { name: gName, chapters: 0, seriesSet: new Set<string>(), minutes: 0 };
        current.chapters += chapCount;
        current.seriesSet.add(seriesId);
        current.minutes += chapCount * 5; // 5 min estimate per chapter
        genreAgg.set(gName, current);
      }
    }

    return Array.from(genreAgg.values())
      .map((g) => ({
        name: g.name,
        seriesCount: g.seriesSet.size,
        chapterCount: g.chapters,
        minutes: g.minutes,
      }))
      .sort((a, b) => b.chapterCount - a.chapterCount)
      .slice(0, 8);
  } catch (err) {
    console.error("[public-profile.actions] Exception in $getPublicReadingPreferences:", err);
    return [];
  }
}
