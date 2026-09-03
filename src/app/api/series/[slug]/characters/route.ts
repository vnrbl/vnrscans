import { NextRequest, NextResponse } from "next/server";
import { getOrFetchSeriesCharacters } from "@/lib/character-fetcher";
import { supabase } from "@/integrations/supabase/client";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: "Missing series slug" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    let title = searchParams.get("title");

    // If title not provided in query, fetch from series table
    if (!title) {
      const { data: series } = await supabase
        .from("series")
        .select("title")
        .eq("slug", slug)
        .maybeSingle();
      title = series?.title || slug.replace(/-/g, " ");
    }

    const characters = await getOrFetchSeriesCharacters(title, slug, force);

    return NextResponse.json({
      characters,
      total: characters.length,
      seriesSlug: slug,
      seriesTitle: title,
    });
  } catch (err: any) {
    console.error("[api/series/characters] Error:", err);
    return NextResponse.json(
      { error: "Failed to load series characters", details: err?.message },
      { status: 500 }
    );
  }
}
