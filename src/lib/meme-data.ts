export interface MemeSticker {
  id: string;
  name: string;
  category: "hype" | "funny" | "reaction" | "crying" | "cute";
  emoji: string;
  url: string;
  alt: string;
}

export const POPULAR_MEME_STICKERS: MemeSticker[] = [
  {
    id: "peak-fiction",
    name: "Peak Fiction",
    category: "hype",
    emoji: "🗿",
    url: "https://media.tenor.com/Fw_bXzVlG6YAAAAM/peak-fiction-cinema.gif",
    alt: "Peak Fiction Cinema Meme",
  },
  {
    id: "absolute-cinema",
    name: "Absolute Cinema",
    category: "hype",
    emoji: "🍿",
    url: "https://media.tenor.com/x0R7vVl_fM8AAAAM/absolute-cinema-cinema.gif",
    alt: "Absolute Cinema Popcorn Meme",
  },
  {
    id: "nah-id-win",
    name: "Nah, I'd Win",
    category: "hype",
    emoji: "🔥",
    url: "https://media.tenor.com/b5o-5JvF9lYAAAAM/nah-id-win-gojo.gif",
    alt: "Nah I'd Win Gojo Meme",
  },
  {
    id: "anya-smug",
    name: "Anya Heh",
    category: "funny",
    emoji: "😏",
    url: "https://media.tenor.com/a976k_Bw-hQAAAAM/anya-forger-smug.gif",
    alt: "Anya Smug Heh Face Meme",
  },
  {
    id: "gigachad",
    name: "Gigachad",
    category: "hype",
    emoji: "👑",
    url: "https://media.tenor.com/gK61aW2rWqIAAAAM/gigachad-chad.gif",
    alt: "Gigachad Theme Meme",
  },
  {
    id: "shocked-enel",
    name: "Shocked Face",
    category: "reaction",
    emoji: "😱",
    url: "https://media.tenor.com/uR2i1tS6O0MAAAAM/enel-shocked-face.gif",
    alt: "Shocked Enel Face Meme",
  },
  {
    id: "saitama-ok",
    name: "Saitama OK",
    category: "funny",
    emoji: "🥊",
    url: "https://media.tenor.com/D4sT9iJd2BIAAAAM/saitama-ok.gif",
    alt: "Saitama OK One Punch Man Meme",
  },
  {
    id: "emotional-damage",
    name: "Emotional Damage",
    category: "crying",
    emoji: "😭",
    url: "https://media.tenor.com/7Hj6kI_uH6QAAAAM/emotional-damage.gif",
    alt: "Emotional Damage Crying Meme",
  },
  {
    id: "let-him-cook",
    name: "Let Him Cook",
    category: "hype",
    emoji: "🍳",
    url: "https://media.tenor.com/00lZ_3B4eH4AAAAM/let-him-cook-woody.gif",
    alt: "Let Him Cook Meme",
  },
  {
    id: "fraud-watch",
    name: "Fraud Watch",
    category: "funny",
    emoji: "🤡",
    url: "https://media.tenor.com/eB3s0w5g_kEAAAAM/clown-makeup.gif",
    alt: "Fraud Watch Clown Meme",
  },
  {
    id: "popcorn-eating",
    name: "Here for the Drama",
    category: "funny",
    emoji: "🍿",
    url: "https://media.tenor.com/p_P6k6U6d74AAAAM/cat-popcorn.gif",
    alt: "Eating Popcorn Drama Meme",
  },
  {
    id: "crying-aqua",
    name: "Aqua Crying",
    category: "crying",
    emoji: "😭",
    url: "https://media.tenor.com/G3bV4l6V6aEAAAAM/aqua-konosuba-crying.gif",
    alt: "Aqua Konosuba Crying Meme",
  },
  {
    id: "cat-stare",
    name: "He Just Like Me Fr",
    category: "reaction",
    emoji: "🕶️",
    url: "https://media.tenor.com/6E2h1w4N3g8AAAAM/cat-stare-shocked.gif",
    alt: "Cat Stare Meme",
  },
  {
    id: "sip-tea",
    name: "Sipping Tea",
    category: "reaction",
    emoji: "☕",
    url: "https://media.tenor.com/4g_fG5e-K2IAAAAM/kermit-tea.gif",
    alt: "Sipping Tea Chill Meme",
  },
  {
    id: "mind-blown",
    name: "Plot Twist Mind Blown",
    category: "reaction",
    emoji: "🤯",
    url: "https://media.tenor.com/s63kY-Rk_lMAAAAM/mind-blown-tim-and-eric.gif",
    alt: "Mind Blown Galaxy Meme",
  },
  {
    id: "chibi-yay",
    name: "Waku Waku",
    category: "cute",
    emoji: "✨",
    url: "https://media.tenor.com/W2oX2b5pYgMAAAAM/anya-spy-x-family.gif",
    alt: "Anya Waku Waku Sparkle Meme",
  },
  {
    id: "cat-dance",
    name: "Happy Vibe",
    category: "cute",
    emoji: "💃",
    url: "https://media.tenor.com/j6Y8Bw3I3kYAAAAM/cat-dance.gif",
    alt: "Happy Cat Dancing Meme",
  },
  {
    id: "skull-dead",
    name: "I'm Dead",
    category: "funny",
    emoji: "💀",
    url: "https://media.tenor.com/h5T6E8G3J6UAAAAM/skull-explode.gif",
    alt: "Skull Dying of Laughter Meme",
  },
];

export const MEME_CATEGORIES = [
  { id: "all", label: "All Memes" },
  { id: "hype", label: "🔥 Hype & Peak" },
  { id: "funny", label: "😂 Funny & Troll" },
  { id: "reaction", label: "👀 Reactions" },
  { id: "crying", label: "😭 Crying" },
  { id: "cute", label: "✨ Chibi & Cute" },
] as const;
