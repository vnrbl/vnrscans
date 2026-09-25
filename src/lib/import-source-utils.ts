export type ImportSourcePreset = {
  sourceSite: string;
  scanlationGroup: string;
  imageUrlExample?: string;
};

const SOURCE_PRESETS: Array<{
  hostIncludes: string;
  sourceSite: string;
  scanlationGroup: string;
  imageUrlExample?: string;
}> = [
  {
    hostIncludes: "comix.to",
    sourceSite: "Comix.to",
    scanlationGroup: "Comix",
  },
  {
    hostIncludes: "qimanhwa.com",
    sourceSite: "Qi Scans",
    scanlationGroup: "Qi Scans",
    imageUrlExample: "https://media.qimanga.com/file/qiscans/upload/series/example/chapter/page_001.webp",
  },
  {
    hostIncludes: "qiscans.org",
    sourceSite: "Qi Scans",
    scanlationGroup: "Qi Scans",
    imageUrlExample: "https://media.qimanga.com/file/qiscans/upload/series/example/chapter/page_001.webp",
  },
  {
    hostIncludes: "qimanga.com",
    sourceSite: "Qi Scans",
    scanlationGroup: "Qi Scans",
    imageUrlExample: "https://media.qimanga.com/file/qiscans/upload/series/example/chapter/page_001.webp",
  },
  {
    hostIncludes: "asura",
    sourceSite: "Asura Scans",
    scanlationGroup: "Asura Scans",
    imageUrlExample: "https://cdn.asurascans.com/asura-images/chapters/example/page-001.webp",
  },
  {
    hostIncludes: "vortexscans.org",
    sourceSite: "Vortex Scans",
    scanlationGroup: "Vortex Scans",
  },
  {
    hostIncludes: "vortexscans.com",
    sourceSite: "Vortex Scans",
    scanlationGroup: "Vortex Scans",
  },
  {
    hostIncludes: "vortexscans.net",
    sourceSite: "Vortex Scans",
    scanlationGroup: "Vortex Scans",
  },
  {
    hostIncludes: "elftoon.com",
    sourceSite: "Elftoon",
    scanlationGroup: "Elftoon",
    imageUrlExample: "https://elftoon.com/wp-content/uploads/2024/01/001.webp",
  },
  {
    hostIncludes: "elftoon.xyz",
    sourceSite: "Elftoon",
    scanlationGroup: "Elftoon",
    imageUrlExample: "https://elftoon.xyz/wp-content/uploads/2024/01/001.webp",
  },
  {
    hostIncludes: "thunderscans.com",
    sourceSite: "Thunder Scans",
    scanlationGroup: "Thunder Scans",
    imageUrlExample: "https://en-thunderscans.com/wp-content/uploads/2024/01/001.webp",
  },
  {
    hostIncludes: "scythescans.com",
    sourceSite: "Scythe Scans",
    scanlationGroup: "Scythe Scans",
    imageUrlExample: "https://scythescans.com/wp-content/uploads/2024/01/001.webp",
  },
  {
    hostIncludes: "hivetoon",
    sourceSite: "Hive Toons",
    scanlationGroup: "Hive Toons",
    imageUrlExample: "https://storage.hivetoon.com/public/upload/series/lookism/503468341f2bfb17/image_1_9c56338a.webp",
  },
  {
    hostIncludes: "kaynscan",
    sourceSite: "Kayn Scans",
    scanlationGroup: "Kayn Scans",
    imageUrlExample:
      "https://kaynscans.com/uploads/series/echoes-of-the-reverse-planet/0044/p-6247461e-5129-40be-a735-9b5684e60237.webp",
  },
  {
    hostIncludes: "drakecomic",
    sourceSite: "Drake Scans",
    scanlationGroup: "Drake Scans",
    imageUrlExample:
      "https://drakecomic.net/uploads/series/disastrous-necromancer/0001/p-example.webp",
  },
  {
    hostIncludes: "witchtoons",
    sourceSite: "WitchToons",
    scanlationGroup: "WitchToons",
    imageUrlExample: "https://witchtoons.net/uploads/comic-pages/example/1/page-001.webp",
  },
  {
    hostIncludes: "duskscans",
    sourceSite: "Dusk Scans",
    scanlationGroup: "Dusk Scans",
    imageUrlExample: "https://cdn.duskscans.com/storage/uploads/chapters/example/ch_1/001.webp",
  },
];

export function detectImportSource(url: string): ImportSourcePreset {
  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const preset = SOURCE_PRESETS.find((entry) => hostname.includes(entry.hostIncludes));
    if (preset) return preset;

    const label = hostname
      .split(".")
      .filter((part) => part && part !== "com" && part !== "org" && part !== "net")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    return {
      sourceSite: label || hostname,
      scanlationGroup: label || hostname,
    };
  } catch {
    return {
      sourceSite: "Custom Source",
      scanlationGroup: "",
    };
  }
}

export function isKnownImportSource(url: string): boolean {
  try {
    const hostname = new URL(url.trim()).hostname.toLowerCase();
    return SOURCE_PRESETS.some((entry) => hostname.includes(entry.hostIncludes));
  } catch {
    return false;
  }
}

export function canonicalSourceSite(site: string | null | undefined): string {
  if (!site) return "Direct";
  const s = site.trim();
  const lower = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (lower.includes("hivetoon") || lower.includes("hivescan")) return "Hive Toons";
  if (lower.includes("asura")) return "Asura Scans";
  if (lower.includes("vortex")) return "Vortex Scans";
  if (lower.includes("elftoon")) return "Elf Toons";
  if (lower.includes("qiscan") || lower.includes("qimanga") || lower.includes("qimanhwa")) return "Qi Scans";
  if (lower.includes("comix")) return "Comix.to";
  if (lower.includes("dusk")) return "Dusk Scans";
  if (lower.includes("kayn")) return "Kayn Scans";
  if (lower.includes("drake")) return "Drake Scans";
  if (lower.includes("witch")) return "WitchToons";
  return s;
}

export function canonicalScanlationGroup(group: string | null | undefined): string {
  if (!group) return "";
  const s = group.trim();
  const lower = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (lower.includes("hivetoon") || lower.includes("hivescan")) return "Hive Toons";
  if (lower.includes("asura")) return "Asura Scans";
  if (lower.includes("vortex")) return "Vortex Scans";
  if (lower.includes("elftoon")) return "Elf Toons";
  if (lower.includes("qiscan") || lower.includes("qimanga") || lower.includes("qimanhwa")) return "Qi Scans";
  if (lower.includes("dusk")) return "Dusk Scans";
  if (lower.includes("kayn")) return "Kayn Scans";
  if (lower.includes("drake")) return "Drake Scans";
  if (lower.includes("witch")) return "WitchToons";
  return s;
}

export function normalizeScanlationGroup(group: string | null | undefined): string {
  if (!group) return "";
  const canon = canonicalScanlationGroup(group);
  return canon.toLowerCase().replace(/[^a-z0-9]/g, "");
}

