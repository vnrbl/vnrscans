/**
 * Canonical FAQ content for the landing page.
 *
 * Kept in a framework-free module so BOTH the client accordion component and
 * server components (FAQPage JSON-LD structured data in src/app/page.tsx) can
 * import it — importing values from a "use client" module into a server
 * component is not possible.
 *
 * Questions deliberately target real search intents around reading manga,
 * manhwa, and manhua online (AnswerThePublic keyword research, 2026-09):
 * free manga sites, manga vs manhwa vs manhua, cultivation/isekai genres,
 * reading trackers, and gamified rewards.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export const VNR_FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is vnrscans completely free to use?",
    answer:
      "Yes! vnrscans is entirely free for all readers. We do not require any paid subscription to read our indexed series, bookmark your favorites, or keep track of your reading progress.",
  },
  {
    question: "Where can I read manhwa, manhua, and manga online for free?",
    answer:
      "Right here. vnrscans is a free manga reader where you can read manhwa, manhua, manga, and web novels online without an account. Browse the catalog by genre or tag, open any series, and start reading the latest chapters instantly in high quality.",
  },
  {
    question: "Is vnrscans a good site to read manhwa?",
    answer:
      "Yes — vnrscans is built for manhwa first: a vertical-scroll reader, fast HD pages, automatic reading history, bookmarks, and gamified streak rewards. It also indexes manga, manhua, and novels in the same free catalog, so you can read manhwa online without an account. See our vnrscans vs other manga readers comparison for the full breakdown.",
  },
  {
    question: "What is the difference between manga, manhwa, and manhua?",
    answer:
      "Manga refers to Japanese comics, traditionally printed black-and-white and read right-to-left. Manhwa is the Korean equivalent — full-color vertical-scroll webtoons designed for phones, which is why manhwa reads top-to-bottom. Manhua is the Chinese counterpart, often drawn in full color as well and rooted in cultivation, xianxia, and martial-arts traditions. vnrscans indexes all three, plus light novels and web novels.",
  },
  {
    question: "What is cultivation manhwa and where should I start?",
    answer:
      "Cultivation (xianxia/wuxia) manhwa follows martial artists who meditate, gather Qi, and break through power realms on the path to immortality. It is one of the most popular manhwa genres — titles like the ones in our Martial Arts and Cultivation genre pages are perfect entry points. Filter the browse catalog by the cultivation, martial arts, or xianxia tags to find trending series.",
  },
  {
    question: "How do I keep track of the manga I am reading?",
    answer:
      "Your vnrscans account is a built-in manga reading tracker. Every chapter you open is saved to your reading history, you can bookmark series to build a personal library, and the Continue Reading section always picks up exactly where you left off — across devices.",
  },
  {
    question: "Does vnrscans have rewards for reading daily?",
    answer:
      "Yes — vnrscans is a gamified reading platform. Daily reading streaks, Spiritual Qi, cultivation realms, XP, badges, avatar frames, and seasonal leaderboard ranks all reward you for the reading you already do. Read chapters, comment, and keep your streak alive to level up.",
  },
  {
    question: "How does the cultivation realm and Spiritual Qi system work?",
    answer:
      "As you read chapters, post comments, and maintain your daily reading streaks, you gather Spiritual Qi. Accumulating Qi allows your soul to break through higher Cultivation Realms, unlocking rare badges, exclusive animated avatar frames, custom accent glows, and prestigious seasonal community ranks.",
  },
  {
    question: "Where does vnrscans get its content?",
    answer:
      "vnrscans does not store any files on its servers. We only link to media hosted on third-party services. If you have copyright concerns, please visit our DMCA registry page.",
  },
  {
    question: "What is your DMCA copyright policy?",
    answer:
      "We take intellectual property ownership extremely seriously. If you are a copyright holder and believe your work is on our platform without authorization, you can file a quick takedown notice on our DMCA page. We review and process verified reports within 5 business days.",
  },
  {
    question: "Can independent creators publish their work here?",
    answer:
      "Absolutely! We love supporting independent authors and illustrators. Please reach out to creator@vnrscans.com or use our Contact page form to send us details of your work, and our admin team will assist you in setting up your series.",
  },
];