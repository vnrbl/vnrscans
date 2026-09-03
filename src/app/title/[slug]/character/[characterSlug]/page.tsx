import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { getOrFetchSeriesCharacters, getCharacterBySlug } from "@/lib/character-fetcher";
import CharacterProfileClient from "./CharacterProfileClient";

interface CharacterPageProps {
  params: Promise<{
    slug: string;
    characterSlug: string;
  }>;
}

export async function generateMetadata({ params }: CharacterPageProps): Promise<Metadata> {
  const { slug, characterSlug } = await params;

  const { data: series } = await supabase
    .from("series")
    .select("title,cover_url")
    .eq("slug", slug)
    .maybeSingle();

  const seriesTitle = series?.title || slug.replace(/-/g, " ");
  const character = await getCharacterBySlug(slug, characterSlug);

  if (!character) {
    return {
      title: "Character Profile | VNR Scans",
      description: "Character profile and story role.",
    };
  }

  return {
    title: `${character.name} — ${seriesTitle} Character Bio | VNR Scans`,
    description: `Complete bio, story role, combat abilities, and relationships for ${character.name} from ${seriesTitle}.`,
    openGraph: {
      title: `${character.name} — ${seriesTitle}`,
      description: character.description?.slice(0, 160) || `Bio for ${character.name}.`,
      images: character.imageUrl ? [character.imageUrl] : [],
    },
  };
}

export default async function CharacterPage({ params }: CharacterPageProps) {
  const { slug, characterSlug } = await params;

  const { data: series } = await supabase
    .from("series")
    .select("id,title,slug,cover_url,type")
    .eq("slug", slug)
    .maybeSingle();

  if (!series) {
    notFound();
  }

  const seriesTitle = series.title;
  const characters = await getOrFetchSeriesCharacters(seriesTitle, slug);
  const character = characters.find(
    (c) => c.slug.toLowerCase() === characterSlug.toLowerCase()
  );

  if (!character) {
    notFound();
  }

  const otherCharacters = characters.filter((c) => c.id !== character.id);

  return (
    <CharacterProfileClient
      series={series}
      character={character}
      otherCharacters={otherCharacters}
    />
  );
}
