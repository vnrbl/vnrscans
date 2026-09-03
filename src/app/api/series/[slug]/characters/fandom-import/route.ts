import { NextRequest, NextResponse } from "next/server";
import { importCharactersFromCustomFandomUrl } from "@/lib/character-fetcher";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body: any = await req.json();
    const fandomUrl = body?.fandomUrl?.trim();

    if (!fandomUrl) {
      return NextResponse.json({ error: "fandomUrl is required" }, { status: 400 });
    }

    const characters = await importCharactersFromCustomFandomUrl(slug, fandomUrl);

    return NextResponse.json({
      success: true,
      count: characters.length,
      characters,
    });
  } catch (err: any) {
    console.error("[fandom-import] Error importing from Fandom URL:", err);
    return NextResponse.json({ error: err.message || "Failed to import from Fandom" }, { status: 500 });
  }
}
