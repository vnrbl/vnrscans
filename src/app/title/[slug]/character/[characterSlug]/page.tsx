import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrFetchSeriesCharacters, getCharacterBySlug } from "@/lib/character-fetcher";
import CharacterProfileClient from "./CharacterProfileClient";
import { fetchSeriesBySlug } from "@/lib/series-slug";

interface CharacterPageProps {
  params: Promise<{
    slug: string;
    characterSlug: string;
  }>;
}

export async function generateMetadata({ params }: CharacterPageProps): Promise<Metadata> {
  const { slug, characterSlug } = await params;

  const series = await fetchSeriesBySlug(slug, "title,cover_url");

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
      title: `${character.name} — ${seriesTitle} Character Bio`,
      description: `Complete bio, story role, combat abilities, and relationships for ${character.name} from ${seriesTitle}.`,
      images: character.imageUrl ? [{ url: character.imageUrl }] : [],
    },
  };
}

export default async function CharacterPage({ params }: CharacterPageProps) {
  const { slug, characterSlug } = await params;

  const series = await fetchSeriesBySlug(slug, "id,title,slug,cover_url,type");

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
