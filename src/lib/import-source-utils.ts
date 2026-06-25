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
    hostIncludes: "qimanhwa.com",
    sourceSite: "Qi Scans",
    scanlationGroup: "Qi Scans",
    imageUrlExample: "https://media.qimanhwa.com/file/qiscans/upload/upload/series/example/chapter/page_001.webp",
  },
  {
    hostIncludes: "qiscans.org",
    sourceSite: "Qi Scans",
    scanlationGroup: "Qi Scans",
    imageUrlExample: "https://media.qimanhwa.com/file/qiscans/upload/upload/series/example/chapter/page_001.webp",
  },
  {
    hostIncludes: "asurascans.com",
    sourceSite: "Asura Scans",
    scanlationGroup: "Asura Scans",
    imageUrlExample: "https://cdn.asurascans.com/asura-images/chapters/example/page-001.webp",
  },
  {
    hostIncludes: "vortexscans.org",
    sourceSite: "Vortex Scans",
    scanlationGroup: "Vortex Scans",
    imageUrlExample:
      "https://storage.vortexscans.org/upload/series/reincarnators-stream/68d990a7-23ab-4fd2-ad8e-f545f4610d18/page-0001_01_1777744448739-752500.jpg",
  },
  {
    hostIncludes: "vortexscans.com",
    sourceSite: "Vortex Scans",
    scanlationGroup: "Vortex Scans",
    imageUrlExample:
      "https://storage.vortexscans.org/upload/series/reincarnators-stream/68d990a7-23ab-4fd2-ad8e-f545f4610d18/page-0001_01_1777744448739-752500.jpg",
  },
  {
    hostIncludes: "vortexscans.net",
    sourceSite: "Vortex Scans",
    scanlationGroup: "Vortex Scans",
    imageUrlExample:
      "https://storage.vortexscans.org/upload/series/reincarnators-stream/68d990a7-23ab-4fd2-ad8e-f545f4610d18/page-0001_01_1777744448739-752500.jpg",
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
