const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'public', 'memes');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const STICKERS = [
  {
    id: 'peak-fiction',
    emoji: '🗿',
    badge: 'PEAK FICTION',
    sub: '🔥 MASTERPIECE 🔥',
    bg1: '#7c2d12',
    bg2: '#ea580c',
    bg3: '#fbbf24',
    accent: '#f59e0b',
    border: '#fde68a',
  },
  {
    id: 'absolute-cinema',
    emoji: '🍿',
    badge: 'ABSOLUTE CINEMA',
    sub: '🎬 10 / 10 🎬',
    bg1: '#311042',
    bg2: '#6b21a8',
    bg3: '#c084fc',
    accent: '#a855f7',
    border: '#e9d5ff',
  },
  {
    id: 'nah-id-win',
    emoji: '🔥',
    badge: "NAH, I'D WIN",
    sub: '⚡ GOJO SATORU ⚡',
    bg1: '#082f49',
    bg2: '#0284c7',
    bg3: '#38bdf8',
    accent: '#38bdf8',
    border: '#bae6fd',
  },
  {
    id: 'pure-aura',
    emoji: '⚡',
    badge: '+10,000 AURA',
    sub: '👑 UNTOUCHABLE 👑',
    bg1: '#451a03',
    bg2: '#d97706',
    bg3: '#fde047',
    accent: '#fbbf24',
    border: '#fef08a',
  },
  {
    id: 'gigachad',
    emoji: '👑',
    badge: 'G I G A C H A D',
    sub: '🗿 BASED & CANON 🗿',
    bg1: '#09090b',
    bg2: '#27272a',
    bg3: '#71717a',
    accent: '#e4e4e7',
    border: '#ffffff',
  },
  {
    id: 'let-him-cook',
    emoji: '🍳',
    badge: 'LET HIM COOK',
    sub: '🔥 SOMETHING IS BREWING 🔥',
    bg1: '#064e3b',
    bg2: '#059669',
    bg3: '#34d399',
    accent: '#10b981',
    border: '#a7f3d0',
  },
  {
    id: 'domain-expansion',
    emoji: '🤞',
    badge: 'DOMAIN EXPANSION',
    sub: '🌌 INFINITE VOID 🌌',
    bg1: '#1e1b4b',
    bg2: '#4338ca',
    bg3: '#818cf8',
    accent: '#6366f1',
    border: '#c7d2fe',
  },
  {
    id: 'my-goat',
    emoji: '🐐',
    badge: 'M Y   G O A T',
    sub: '👑 THE CHOSEN ONE 👑',
    bg1: '#4c0519',
    bg2: '#be123c',
    bg3: '#fb7185',
    accent: '#f43f5e',
    border: '#fecdd3',
  },
  {
    id: 'anya-heh',
    emoji: '😏',
    badge: 'H E H .',
    sub: '🥜 PLANNED IT ALL 🥜',
    bg1: '#500724',
    bg2: '#db2777',
    bg3: '#f472b6',
    accent: '#ec4899',
    border: '#fbcfe8',
  },
  {
    id: 'fraud-watch',
    emoji: '🤡',
    badge: 'FRAUD WATCH',
    sub: '🚨 EXPOSED IN 4K 🚨',
    bg1: '#450a0a',
    bg2: '#dc2626',
    bg3: '#f87171',
    accent: '#ef4444',
    border: '#fca5a5',
  },
  {
    id: 'saitama-ok',
    emoji: '🥊',
    badge: 'O   K   .',
    sub: '✨ ONE PUNCH ✨',
    bg1: '#713f12',
    bg2: '#ca8a04',
    bg3: '#fde047',
    accent: '#eab308',
    border: '#fef08a',
  },
  {
    id: 'skull-dead',
    emoji: '💀',
    badge: "I'M DEAD",
    sub: '🪦 NO RECOVERY 🪦',
    bg1: '#020617',
    bg2: '#1e293b',
    bg3: '#475569',
    accent: '#94a3b8',
    border: '#cbd5e1',
  },
  {
    id: 'popcorn-drama',
    emoji: '🍿',
    badge: 'HERE FOR DRAMA',
    sub: '👀 PASS THE SNACKS 👀',
    bg1: '#78350f',
    bg2: '#d97706',
    bg3: '#fcd34d',
    accent: '#f59e0b',
    border: '#fde68a',
  },
  {
    id: 'stonks-up',
    emoji: '📈',
    badge: 'MANGA STOCKS ↗',
    sub: '🚀 ALL IN ON THIS CH 🚀',
    bg1: '#064e3b',
    bg2: '#047857',
    bg3: '#10b981',
    accent: '#34d399',
    border: '#6ee7b7',
  },
  {
    id: 'cat-dance',
    emoji: '💃',
    badge: 'V I B I N G',
    sub: '🐱 100% MOOD 🐱',
    bg1: '#4a044e',
    bg2: '#a21caf',
    bg3: '#e879f9',
    accent: '#c026d3',
    border: '#f0abfc',
  },
  {
    id: 'shocked-enel',
    emoji: '😱',
    badge: 'S H O C K E D',
    sub: '⚡ WHAT JUST HAPPENED ⚡',
    bg1: '#172554',
    bg2: '#1d4ed8',
    bg3: '#60a5fa',
    accent: '#3b82f6',
    border: '#bfdbfe',
  },
  {
    id: 'plot-twist-mindblown',
    emoji: '🤯',
    badge: 'PLOT TWIST!',
    sub: '🌌 BRAIN OVERLOAD 🌌',
    bg1: '#2e1065',
    bg2: '#6d28d9',
    bg3: '#a78bfa',
    accent: '#8b5cf6',
    border: '#ddd6fe',
  },
  {
    id: 'he-just-like-me',
    emoji: '🕶️',
    badge: 'LITERALLY ME FR',
    sub: '🚬 NO EXPLANATION NEEDED 🚬',
    bg1: '#0f172a',
    bg2: '#334155',
    bg3: '#64748b',
    accent: '#94a3b8',
    border: '#e2e8f0',
  },
  {
    id: 'sipping-tea',
    emoji: '☕',
    badge: 'SIPPING TEA',
    sub: '🐸 WATCHING IT BURN 🐸',
    bg1: '#292524',
    bg2: '#57534e',
    bg3: '#a8a29e',
    accent: '#d6d3d1',
    border: '#f5f5f4',
  },
  {
    id: 'sus-glance',
    emoji: '🤨',
    badge: 'WAIT... SUS',
    sub: '🔍 SOMETHING IS WRONG 🔍',
    bg1: '#431407',
    bg2: '#9a3412',
    bg3: '#fb923c',
    accent: '#ea580c',
    border: '#fdba74',
  },
  {
    id: 'bro-ran-away',
    emoji: '🏃',
    badge: 'NIGERUNDAYO!',
    sub: '💨 SMOKE & RUN 💨',
    bg1: '#7c2d12',
    bg2: '#c2410c',
    bg3: '#fb923c',
    accent: '#f97316',
    border: '#fed7aa',
  },
  {
    id: 'cliffhanger-pain',
    emoji: '😫',
    badge: 'NEED NEXT CH!',
    sub: '⏳ CRUEL CLIFFHANGER ⏳',
    bg1: '#1e3a5f',
    bg2: '#1d4ed8',
    bg3: '#38bdf8',
    accent: '#0284c7',
    border: '#93c5fd',
  },
  {
    id: 'emotional-damage',
    emoji: '😭',
    badge: 'EMOTIONAL DAMAGE',
    sub: '💔 WHY AUTHOR WHY 💔',
    bg1: '#4c0519',
    bg2: '#9f1239',
    bg3: '#fb7185',
    accent: '#e11d48',
    border: '#fda4af',
  },
  {
    id: 'aqua-crying',
    emoji: '😭',
    badge: 'USELESS GODDESS',
    sub: '🌊 UNCONTROLLABLE TEARS 🌊',
    bg1: '#0c4a6e',
    bg2: '#0284c7',
    bg3: '#38bdf8',
    accent: '#0ea5e9',
    border: '#7dd3fc',
  },
  {
    id: 'guts-pain',
    emoji: '⚔️',
    badge: 'S U F F E R I N G',
    sub: '🩸 GUTS THEME PLAYS 🩸',
    bg1: '#18181b',
    bg2: '#3f3f46',
    bg3: '#ef4444',
    accent: '#dc2626',
    border: '#f87171',
  },
  {
    id: 'salute-respect',
    emoji: '🫡',
    badge: 'R E S P E C T',
    sub: '🎖️ REST WELL HERO 🎖️',
    bg1: '#064e3b',
    bg2: '#065f46',
    bg3: '#34d399',
    accent: '#10b981',
    border: '#a7f3d0',
  },
  {
    id: 'anya-waku-waku',
    emoji: '✨',
    badge: 'WAKU WAKU!',
    sub: '⭐ PURE EXCITEMENT ⭐',
    bg1: '#701a75',
    bg2: '#c026d3',
    bg3: '#f472b6',
    accent: '#e879f9',
    border: '#f5d0fe',
  },
  {
    id: 'heart-eyes',
    emoji: '💖',
    badge: 'D O W N   B A D',
    sub: '😍 PEAK CHARACTER DESIGN 😍',
    bg1: '#831843',
    bg2: '#db2777',
    bg3: '#f472b6',
    accent: '#ec4899',
    border: '#fbcfe8',
  },
  {
    id: 'thumbs-up-cat',
    emoji: '👍',
    badge: 'A P P R O V E D',
    sub: '🐱 100/100 WOULD READ 🐱',
    bg1: '#713f12',
    bg2: '#d97706',
    bg3: '#fde047',
    accent: '#eab308',
    border: '#fef08a',
  },
];

function generateSvg(item) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <defs>
    <linearGradient id="bg_${item.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${item.bg1}" />
      <stop offset="55%" stop-color="${item.bg2}" />
      <stop offset="100%" stop-color="${item.bg3}" />
    </linearGradient>
    <radialGradient id="glow_${item.id}" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${item.accent}" stop-opacity="0.65" />
      <stop offset="100%" stop-color="${item.bg1}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="border_${item.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${item.border}" stop-opacity="0.9" />
      <stop offset="50%" stop-color="${item.accent}" stop-opacity="0.7" />
      <stop offset="100%" stop-color="${item.border}" stop-opacity="0.4" />
    </linearGradient>
    <filter id="shadow_${item.id}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.7" />
    </filter>
    <filter id="badgeShadow_${item.id}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Base Card -->
  <rect x="10" y="10" width="300" height="300" rx="32" fill="url(#bg_${item.id})" stroke="url(#border_${item.id})" stroke-width="4" filter="url(#shadow_${item.id})" />

  <!-- Radial Glow Behind Emoji -->
  <circle cx="160" cy="120" r="95" fill="url(#glow_${item.id})" />

  <!-- Diagonal Action Lines Pattern -->
  <g opacity="0.12" stroke="#ffffff" stroke-width="2">
    <line x1="30" y1="30" x2="290" y2="290" />
    <line x1="70" y1="20" x2="300" y2="250" />
    <line x1="20" y1="70" x2="250" y2="300" />
    <line x1="120" y1="20" x2="300" y2="200" />
    <line x1="20" y1="120" x2="200" y2="300" />
  </g>

  <!-- Big Central Emoji -->
  <text x="160" y="155" font-size="96" text-anchor="middle" dominant-baseline="middle" filter="url(#shadow_${item.id})">
    ${item.emoji}
  </text>

  <!-- Banner Pill Background -->
  <rect x="25" y="210" width="270" height="52" rx="16" fill="#09090b" fill-opacity="0.88" stroke="${item.border}" stroke-width="2" stroke-opacity="0.6" filter="url(#badgeShadow_${item.id})" />

  <!-- Main Bold Text -->
  <text x="160" y="242" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">
    ${item.badge}
  </text>

  <!-- Subtitle Tag -->
  <text x="160" y="285" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="${item.border}" text-anchor="middle" letter-spacing="1.2" opacity="0.95">
    ${item.sub}
  </text>

  <!-- Glossy Specular Arc -->
  <path d="M 30 50 Q 160 20 290 50" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.3" fill="none" />
</svg>`;
}

STICKERS.forEach((stk) => {
  const filePath = path.join(outputDir, `${stk.id}.svg`);
  fs.writeFileSync(filePath, generateSvg(stk), 'utf8');
  console.log(`Generated: ${stk.id}.svg`);
});

console.log('All 29 stickers successfully generated in public/memes/');
