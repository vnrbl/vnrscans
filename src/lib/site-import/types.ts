export type SiteSeriesMetadata = {
  sourceId: string;
  sourceUrl: string;
  slug: string;
  title: string;
  alternativeTitles: string[];
  description: string;
  coverUrl: string | null;
  type: "manga" | "manhwa" | "manhua" | "novel";
  status: "ongoing" | "completed" | "hiatus";
  author: string | null;
  artist: string | null;
  genres: string[];
  chapterCount: number;
  lastChapterAt: string | null;
};

export type SiteCatalogDiscovery = {
  sourceSite: string;
  canonicalUrl: string;
  series: SiteSeriesMetadata[];
};
