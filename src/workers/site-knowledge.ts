type KnowledgeDocument = {
  title: string;
  url: string;
  keywords: string[];
  content: string;
};

// Keep these short, factual notes aligned with the corresponding public pages.
// Dynamic title/chapter facts come from Supabase separately.
const SITE_DOCUMENTS: KnowledgeDocument[] = [
  {
    title: "About VNR Scans and reading",
    url: "/about",
    keywords: ["vnrscans about manga manhwa manhua novel reader free read chapters platform"],
    content: "VNR Scans is a community reading site for manga, manhwa, manhua, and web novels. Reading indexed series, bookmarking favorites, and tracking reading progress are free; there is no required paid subscription. Browse the catalog at /browse, search titles at /search, and open a series at /title/{slug}.",
  },
  {
    title: "Frequently asked questions",
    url: "/",
    keywords: ["faq free subscription cost paid bookmarks reading progress"],
    content: "The site FAQ says reading indexed series, bookmarks, and reading progress are free. VNR Scans links to media hosted by third parties and says it does not store media files on its servers. Copyright holders can submit a takedown notice on /dmca; the FAQ says verified reports are reviewed within five business days. Independent creators can contact creator@vnrscans.com or use /contact.",
  },
  {
    title: "Finding and reading series",
    url: "/browse",
    keywords: ["browse search find filter catalog title chapter reader manga novel latest"],
    content: "Use /browse to explore the library and /search to search titles. A title page at /title/{slug} has the series information and chapter list; opening a chapter uses /title/{slug}/{chapterSlug}. The /novels page focuses on web novels. The assistant can look up public series metadata and latest published chapter numbers, but cannot verify external-source release schedules unless that data is available on VNR Scans.",
  },
  {
    title: "Accounts, library, and reading progress",
    url: "/auth",
    keywords: ["account sign up login password reset bookmark follow library history progress"],
    content: "Readers can sign in or create an account at /auth. Account features include a personal library, followed series, bookmarks, reading history and progress, notifications, and a profile. Password reset starts from the sign-in page. The assistant cannot see a reader's private account, password, bookmarks, or reading history; direct account changes must be made in the site UI.",
  },
  {
    title: "Personal recommendations",
    url: "/recommendations",
    keywords: ["recommend recommendations suggested similar personalize history bookmarks genre"],
    content: "The /recommendations page provides personalized series suggestions and reading matches based on a signed-in reader's bookmarks and reading history. Sign in and read or bookmark series to build recommendation signals. The assistant itself does not receive private reading history.",
  },
  {
    title: "Series requests",
    url: "/request-series",
    keywords: ["request add missing series title source submit suggestion pending review"],
    content: "If a title is missing, search the catalog first, then submit it at /request-series. The title is required; format, source URL, contact email, and notes are optional. New requests are saved as pending until staff review them. Submitting a request does not guarantee it will be added.",
  },
  {
    title: "Contact and creator partnerships",
    url: "/contact",
    keywords: ["contact help support creator partnership licensing submission email"],
    content: "For support, partnership requests, creator submissions, or licensing queries, use the contact form at /contact or email creator@vnrscans.com. Include enough detail for the team to understand the request. The assistant cannot submit a support request for the reader.",
  },
  {
    title: "Copyright and DMCA",
    url: "/dmca",
    keywords: ["copyright dmca takedown removal rights holder infringement"],
    content: "VNR Scans says it links to media hosted by third parties rather than storing media files on its servers. A rights holder with a copyright concern can submit a takedown notice using /dmca. The site FAQ states verified reports are reviewed within five business days. For a rights or licensing question, use /contact.",
  },
  {
    title: "Privacy and data controls",
    url: "/privacy",
    keywords: ["privacy personal data cookies analytics ads account deletion"],
    content: "The privacy page describes collection of account details such as email, username, and preferences; reading history, bookmarks, progress, comments, and ratings; and technical usage data. Cookies support sessions and preferences, and third-party advertising and analytics may use data. The privacy page says readers may request account/data deletion by contacting creator@vnrscans.com. For exact current terms, refer to /privacy.",
  },
  {
    title: "Spiritual Qi and community progression",
    url: "/leaderboard",
    keywords: ["spiritual qi cultivation realm experience xp streak badge avatar frame rank"],
    content: "The site's Spiritual Qi system awards progression for reading chapters, posting comments, and maintaining daily reading streaks. Accumulated Qi advances cultivation realms and can unlock badges, avatar frames, accent effects, and seasonal community ranks. Profile and progression details are available in the signed-in profile area; leaderboards are at /leaderboard.",
  },
  {
    title: "Terms of service",
    url: "/terms",
    keywords: ["terms rules acceptable use conduct account liability"],
    content: "VNR Scans' terms of service are published at /terms. For questions about a specific rule or account action, consult the current terms page or contact creator@vnrscans.com; do not guess at legal or account-specific outcomes.",
  },
];

const STOP_WORDS = new Set([
  "about", "also", "and", "are", "can", "could", "does", "for", "from", "have", "hello", "help", "how", "into", "is", "it", "latest", "me", "my", "please", "site", "tell", "that", "the", "this", "to", "what", "when", "where", "which", "who", "with", "you", "your",
]);

function tokenize(value: string): string[] {
  return (value.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || []).filter((word) => !STOP_WORDS.has(word));
}

export function retrieveSiteKnowledge(question: string, limit = 4): string {
  const terms = new Set(tokenize(question));
  if (terms.size === 0) {
    return "VNR Scans is a free community site for reading manga, manhwa, manhua, and web novels. Site help is available at /contact.";
  }

  const ranked = SITE_DOCUMENTS.map((document) => {
    const titleTerms = new Set(tokenize(document.title));
    const bodyTerms = new Set(tokenize(`${document.keywords.join(" ")} ${document.content}`));
    let score = 0;
    for (const term of terms) {
      if (titleTerms.has(term)) score += 4;
      if (bodyTerms.has(term)) score += 1;
    }
    return { document, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);

  return ranked.map(({ document }) => `Source: https://www.vnrscans.com${document.url}\n${document.title}: ${document.content}`).join("\n\n");
}
