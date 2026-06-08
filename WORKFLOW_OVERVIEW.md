# 🌐 Shadow Shelf (vnrscans) — Workflow Overview

> A comprehensive site workflow & architecture for **vnrscans**, a full-stack manga/manhwa/manhua/novel reading platform built with React, TanStack, Supabase, and Vite.

---

## 🏗️ Tech Stack

| Layer       | Technology                                                                 |
|-------------|---------------------------------------------------------------------------|
| **Frontend** | React 19, TanStack Router, TanStack React Query, TanStack React Start    |
| **Styling**  | Tailwind CSS 4, Radix UI / shadcn/ui primitives, Lucide icons             |
| **Backend**  | TanStack Server Functions (RPC), Nitro server, Node.js                    |
| **Database** | Supabase PostgreSQL (RLS, migrations, auto-generated TypeScript types)    |
| **Auth**     | Supabase Auth (PKCE flow) — Google OAuth, Discord OAuth, Email/Password    |
| **Bundler**  | Vite 7                                                                     |
| **Server**   | Express via TanStack React Start (Nitro)                                  |
| **Scraping** | Puppeteer + Chromium for automatic chapter import                         |
| **Deploy**   | Vercel (with Vercel Analytics)                                            |
| **Lang**     | TypeScript (strict)                                                        |

---

## 🗺️ High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["🌐 Browser / Client"]
        R["React 19 App<br/>(SSR/SPA hybrid)"]
        RT["TanStack Router<br/>(file-based routing)"]
        RQ["TanStack React Query<br/>(caching & state)"]
    end

    subgraph Server["⚙️ Nitro / Node Server"]
        SF["Server Functions<br/>(RPC layer)"]
        MW["Middleware<br/>(auth-attacher, error)"]
        SSR["SSR Renderer"]
    end

    subgraph Storage["💾 Supabase"]
        PG[("PostgreSQL<br/>(public schema)")]
        AUTH["Supabase Auth<br/>(PKCE, OAuth)"]
        RL["Row-Level Security<br/>(RLS policies)"]
        MIG["Migrations<br/>(33 migration files)"]
    end

    subgraph External["🔗 External Services"]
        GA["Google OAuth"]
        DA["Discord OAuth"]
        VA["Vercel Analytics"]
        SRC["External Manhwa<br/>Source Sites"]
    end

    subgraph Scripts["🛠️ CLI Scripts"]
        SC["scrape-series.ts<br/>(Puppeteer scraper)"]
        AI["auto-import-sources.ts<br/>(auto sync)"]
        MISC["admin, cleanup,<br/>seeding scripts"]
    end

    R --> RT
    RT --> RQ
    RQ -->|"fetch queries"| SF
    SF -->|"admin service role"| PG
    SF -->|"user auth queries"| AUTH
    SF -.->|"Bearer token"| RL
    MW -->|"attach token"| SF
    AUTH --> GA
    AUTH --> DA
    R --> VA
    SCRIPTS -->|"scraped data"| PG
    SC --> SRC
    AI --> SRC
```

---

## 🧭 Full Route Map

```mermaid
flowchart LR
    LAND["/ (Landing)"] --> AUTH["/auth"]
    LAND --> HOME["/home"]
    LAND --> BROWSE["/browse"]
    LAND --> SEARCH["/search"]
    LAND --> RANK["/rankings"]
    LAND --> TAGS["/tags<br/>/tags/$slug"]
    LAND --> ABOUT["/about, /contact, /dmca"]

    BROWSE --> TITLE["/title/$slug"]
    SEARCH --> TITLE
    RANK --> TITLE
    TAGS --> TITLE
    HOME --> TITLE

    TITLE --> READER["/title/$titleSlug/$chapterSlug"]

    subgraph AuthGroup["🔐 Authenticated Routes"]
        AUTH -->|"login redirect"| HOME
        HOME --> LIB["/library"]
        HOME --> PROF["/profile"]
        HOME --> SETT["/settings"]
        HOME --> NOTIF["/notifications"]
        PROF --> USR["/user/$username<br/>(public)"]
    end

    subgraph AdminGroup["🛡️ Admin Panel"]
        ADMIN["/admin (Dashboard)"]
        ADMIN --> AD_ANALYTICS["/admin/analytics"]
        ADMIN --> AD_ANNOUNCEMENTS["/admin/announcements"]
        ADMIN --> AD_BANNERS["/admin/banners"]
        ADMIN --> AD_SERIES["/admin/series"]
        ADMIN --> AD_CHAPTERS["/admin/series-chapters/$seriesId"]
        ADMIN --> AD_TAGS["/admin/tags"]
        ADMIN --> AD_USERS["/admin/users"]
        ADMIN --> AD_PERMISSIONS["/admin/permissions"]
        ADMIN --> AD_GAMIFICATION["/admin/gamification"]
        ADMIN --> AD_BADGES["/admin/badges"]
        ADMIN --> AD_COMMENTS["/admin/comments"]
        ADMIN --> AD_REPORTS["/admin/reports"]
        ADMIN --> AD_MODERATION["/admin/moderation"]
        ADMIN --> AD_LOGS["/admin/logs"]
    end
```

---

## 🧩 Core Workflows

### 1. 📖 User Reading Workflow

```mermaid
sequenceDiagram
    actor U as User
    participant B as Browser
    participant RQ as React Query
    participant SF as Server Fn
    participant SB as Supabase
    participant SRC as External Source

    U->>B: Visit /browse
    B->>RQ: Fetch series list
    RQ->>SB: SELECT series with filters

    U->>B: Click a series card
    B->>RQ: Fetch /title/$slug
    RQ->>SB: SELECT series detail<br/>+ chapters + genres + tags

    U->>B: Click "Start Reading" / chapter
    B->>RQ: Fetch /title/$slug/$chapterSlug
    RQ->>SB: SELECT chapter + pages<br/>+ siblings + alt groups

    B->>SB: INSERT reading_history (upsert)
    B->>SB: RPC increment_chapter_view

    U->>B: Scroll through pages
    B->>B: Track scroll progress
    B->>SB: UPDATE reading_history progress (throttled)
    B->>SB: Prefetch next chapter (at 50% scroll)

    U->>B: Navigate to next/prev chapter
    B->>RQ: Prefetch next chapter data
    loop Auto-scroll (Mobile)
        B->>B: Auto-scroll at configurable speed
    end
```

### 2. 🔐 Authentication & Authorization Workflow

```mermaid
sequenceDiagram
    actor U as User
    participant B as Browser
    participant SUPA as Supabase Auth
    participant DB as Database
    participant SF as Server Fn
    participant RT as Router

    U->>B: Visit /auth
    B->>SUPA: Sign in with Google/Discord/Email

    alt OAuth
        SUPA->>B: PKCE flow → redirect
        B->>SUPA: Exchange code for session
    else Email
        B->>SUPA: signInWithPassword
        SUPA->>B: Return session
    end

    B->>B: Store session in localStorage
    B->>RT: onAuthStateChange → router.invalidate()

    U->>B: Visit protected route
    B->>SF: Send Bearer token
    SF->>SUPA: Verify token (getUser)
    SF->>DB: Check user_roles (for admin)

    alt Valid + authorized
        SF->>B: Allow access
    else Invalid
        RT->>B: Redirect to /auth
    end
```

### 3. ⚙️ Content Import (Scraper) Workflow

```mermaid
sequenceDiagram
    participant ADM as Admin
    participant UI as Admin UI
    participant SF as Server Fn
    participant PUPP as Puppeteer
    participant SB as Supabase
    participant SRC as Source Site

    ADM->>UI: Set up import source URL
    UI->>SB: INSERT series_import_sources

    ADM->>UI: Click "Sync Now"
    UI->>SF: $syncImportSource (with token)

    SF->>SB: Verify admin role
    SF->>PUPP: Launch headless Chromium
    PUPP->>SRC: Fetch series page
    PUPP-->>SF: Extract chapter list (titles, URLs)

    SF->>SB: Query existing chapters (deduplicate)
    SF->>PUPP: Fetch missing chapter pages
    PUPP-->>SF: Extract image URLs

    SF->>SB: INSERT chapters + chapter_pages
    SF->>SB: INSERT series_import_logs
    SF->>SB: UPDATE series_import_sources (last_checked_at)

    SF-->>UI: Return import results (imported, skipped, failed)

    ADM->>UI: Review/Edit imported chapters
    ADM->>UI: Publish chapters (if drafted)
```

### 4. 🏆 Gamification & Profile Workflow

```mermaid
sequenceDiagram
    actor U as User
    participant B as Browser
    participant SB as Supabase
    participant PROF as Profile

    U->>B: Read chapters
    B->>SB: INSERT reading_history

    SB->>SB: DB triggers calculate XP
    SB->>SB: Update profiles.experience_points
    SB->>SB: Update profiles.user_level (level thresholds)

    U->>B: Visit /profile
    B->>SB: SELECT profile + badges + stats

    U->>B: Customize profile
    B->>SB: UPDATE banner_url, accent_color
    B->>SB: UPDATE social links (discord, twitter, etc.)

    U->>B: Upload avatar
    B->>SB: Storage bucket - avatar upload
    B->>SB: UPDATE avatar_url

    U->>B: View public profile
    B->>SB: SELECT public profile data
    B->>SB: RPC (public_profile_stats, library items)
```

---

## 🗄️ Database Schema (Core Tables)

```mermaid
erDiagram
    series ||--o{ chapters : has
    series ||--o{ series_genres : "has genres"
    series ||--o{ series_tags : "has tags"
    series ||--o{ ratings : "rated by"
    series ||--o{ bookmarks : "bookmarked by"
    series ||--o{ reading_history : "read by"
    series ||--o{ series_import_sources : "imported from"
    genres ||--o{ series_genres : "belongs to"
    tags ||--o{ series_tags : "belongs to"
    chapters ||--o{ chapter_pages : "contains"
    chapters ||--o{ reading_history : "tracks"
    chapters ||--o{ comments : "discussed"
    chapters ||--o{ notifications : "triggers"
    user_roles ||--o{ profiles : "has profile"
    profiles ||--o{ reading_history : "reads"
    profiles ||--o{ ratings : "rates"
    profiles ||--o{ bookmarks : "bookmarks"
    profiles ||--o{ comments : "comments"
    profiles ||--o{ reports : "reports"

    series {
        string id PK
        string slug UK
        string title
        string cover_url
        enum type "manga | manhwa | manhua | novel"
        enum status "ongoing | completed | hiatus"
        enum content_rating "safe | suggestive | nsfw | pornographic"
        string description
        string author
        string artist
        float rating_average
        int view_count
        int chapter_count
        bool is_featured
        bool is_trending
        datetime created_at
        datetime updated_at
    }

    chapters {
        string id PK
        string series_id FK
        int chapter_number
        string slug
        string title
        enum chapter_type "image | novel"
        enum status "draft | published | scheduled"
        string scanlation_group
        string uploaded_by
        text novel_content
        int view_count
        datetime scheduled_at
        datetime created_at
    }

    chapter_pages {
        string id PK
        string chapter_id FK
        int page_number
        string image_url
    }

    profiles {
        string id PK
        string user_id UK
        string username UK
        string avatar_url
        string banner_url
        string bio
        int experience_points
        int user_level
        int reading_streak
        string avatar_frame
        string accent_color
        bool is_vip
        string social_discord
        string social_twitter
        string social_instagram
        string social_mal
        string social_anilist
        string social_website
    }
```

---

## 📁 Project Structure

```
shadow-shelf/
├── src/
│   ├── routes/               # File-based routing (TanStack Router)
│   │   ├── __root.tsx         # Root layout (navbar, footer, theme, auth listener)
│   │   ├── index.tsx          # Landing page
│   │   ├── auth.tsx           # Login/signup (Google, Discord, Email)
│   │   ├── home/              # Authenticated home (history, continue)
│   │   ├── browse.tsx         # Browse with filters
│   │   ├── search.tsx         # Search results
│   │   ├── title.$slug.tsx    # Series detail + chapters + recommendations
│   │   ├── title.$titleSlug.$chapterSlug.tsx  # Reader (image/novel)
│   │   ├── rankings.tsx       # Top rated, trending, most viewed/followed
│   │   ├── tags.tsx / tags.$slug.tsx  # Tags/genre pages
│   │   ├── user.$username.tsx  # Public profile
│   │   ├── about.tsx, contact.tsx, dmca.tsx  # Static pages
│   │   ├── _authenticated.tsx  # Auth guard wrapper
│   │   └── _authenticated/    # Protected routes
│   │       ├── library.tsx    # User's library (reading, completed, etc.)
│   │       ├── profile.tsx    # Profile customization
│   │       ├── settings.tsx   # Account settings
│   │       ├── notifications.tsx  # Notification history
│   │       └── admin/         # Admin panel (17 subpages)
│   │           ├── index.tsx, analytics.tsx, series.tsx, chapters...
│   ├── components/
│   │   ├── ui/                # Radix UI / shadcn primitives (~50 components)
│   │   ├── Navbar.tsx, Footer.tsx, AnnouncementBanner.tsx
│   │   ├── SeriesCard.tsx, SeriesGrid.tsx
│   │   ├── HomeHeroCarousel.tsx
│   │   ├── OptimizedImage.tsx
│   │   ├── DiceRollOverlay.tsx
│   │   ├── admin/             # Admin-specific components
│   │   ├── notifications/     # NotificationBell, NotificationList
│   │   └── profile/           # Profile widgets (badges, heatmap, etc.)
│   ├── contexts/
│   │   ├── ThemeContext.tsx    # Dark/theme provider
│   │   └── ReaderSettingsContext.tsx  # Reader configuration
│   ├── hooks/
│   │   ├── useAuth.ts         # Auth state hook
│   │   ├── use-mobile.tsx     # Responsive detection
│   │   └── useDragScroll.ts   # Drag-based carousel scrolling
│   ├── integrations/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Client-side Supabase (anon key, PKCE)
│   │   │   ├── client.server.ts  # Server-side (service role key)
│   │   │   ├── auth-attacher.ts  # Middleware: attaches Bearer token
│   │   │   └── types.ts      # Auto-generated DB types (650+ lines)
│   │   └── lovable/           # Lovable.dev cloud integration
│   ├── lib/
│   │   ├── api/               # Server Functions
│   │   │   ├── admin.functions.ts    # $deleteUser (admin-only)
│   │   │   ├── scraper.functions.ts  # $extractChaptersFromUrl, $extractImagesFromUrl, $syncImportSource
│   │   │   └── example.functions.ts
│   │   ├── auth-guards.ts     # requireAuthenticatedUser()
│   │   ├── chapter-scraper.ts # Puppeteer scraping logic
│   │   ├── chapter-utils.ts   # Slug building
│   │   ├── import-source-utils.ts  # Source detection
│   │   ├── search-utils.ts    # Search/build filters
│   │   ├── layout.ts          # Reader layout detection
│   │   ├── error-capture.ts / error-page.ts  # SSR error handling
│   │   ├── lovable-error-reporting.ts  # Remote error logging
│   │   ├── brand.ts           # Brand constants
│   │   └── utils.ts           # CN helper, profile ID, admin log, badges
│   ├── server.ts              # SSR entry (error normalization)
│   ├── start.ts               # App bootstrap (middleware registration)
│   ├── router.tsx             # Router factory (QueryClient config)
│   ├── routeTree.gen.ts       # Auto-generated route tree
│   └── styles.css             # Tailwind CSS + animations
├── scripts/                   # CLI automation
│   ├── scrape-series.ts       # Puppeteer batch scraping
│   ├── auto-import-sources.ts # Scheduled auto-sync
│   ├── check-database.ts      # DB health checks
│   ├── grant-admin.ts         # Grant admin role
│   ├── clear-database.ts      # DB cleanup
│   ├── generate-sitemap.js    # SEO sitemap generation
│   └── (14 more utility scripts)
├── supabase/
│   ├── config.toml            # Supabase local config
│   └── migrations/            # 33 SQL migration files
│       ├── 0000_initial.sql
│       ├── profiles, series, chapters, pages
│       ├── auth RLS policies, user_roles
│       ├── gamification (XP, levels, streaks)
│       ├── notifications, comments, reports
│       ├── import sources, scrapers
│       ├── analytics views, admin logs
│       └── carousel, banners, announcements
├── package.json               # Dependencies & scripts
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript config
└── vercel.json                # Deployment config
```

---

## 🔄 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SOURCE                          │
│                    (e.g., qimanhwa.com, etc.)                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│          SCRAPER PIPELINE (Puppeteer + Chromium)                │
│                                                                 │
│  scripts/scrape-series.ts  ─►  lib/chapter-scraper.ts           │
│  lib/api/scraper.functions.ts  ─►  $syncImportSource            │
│                                                                 │
│  1. Extract chapter list from external URL                      │
│  2. Extract image URLs from each chapter page                   │
│  3. Filter & validate images                                    │
│  4. Bulk insert chapters + chapter_pages                        │
│  5. Log results, update source status                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRESQL                           │
│                                                                 │
│  series ──► chapters ──► chapter_pages                         │
│  series ──► series_genres ──► genres                            │
│  series ──► series_tags ──► tags                                │
│  profiles ──► reading_history ──► chapters                      │
│  profiles ──► library (user_library)                            │
│  profiles ──► ratings ──► series                                │
│  profiles ──► comments ──► chapters / series                    │
│  profiles ──► user_roles (RBAC)                                │
│  series_import_sources ──► series_import_logs                   │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│              TANSTACK REACT QUERY (Caching Layer)               │
│                                                                 │
│  staleTime: 2-15 min  │  gcTime: 10-30 min                     │
│  retry: 1 │ refetchOnWindowFocus: false                        │
│  defaultPreload: "intent" │ preloadStaleTime: 30s              │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT UI COMPONENTS                          │
│                                                                 │
│  Landing Page ─► Hero + Featured + Value Props + FAQ            │
│  Browse      ─► Search bar + Filters + Grid/List view           │
│  Series Detail ─► Cover + Metadata + Chapter Table + Recs       │
│  Reader      ─► Image pages / Novel text + Controls + Comments  │
│  Profile     ─► Stats + Badges + Heatmap + Customization        │
│  Admin Panel ─► CRUD tables + Analytics + User Mgmt             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow Detail

```
User navigates to /auth
├── Google OAuth ──► Supabase PKCE ──► Redirect back ──► Session stored
├── Discord OAuth ──► Supabase PKCE ──► Redirect back ──► Session stored
└── Email/Password ──► supabase.auth.signInWithPassword() ──► Session

On every page load:
  ├── useAuth() hook listens to onAuthStateChange
  ├── Root component invalidates router & query cache on session change
  └── Authenticated routes call requireAuthenticatedUser() beforeLoad

Server Function calls:
  ├── auth-attacher middleware grabs access_token from session
  └── Attaches Authorization: Bearer <token> header to serverFn RPCs

Admin authorization:
  ├── Supabase getUser() confirms the user
  ├── Check user_roles table for admin/moderator/uploader
  └── Service role client bypasses RLS for admin operations
```

---

## 🧪 Migration Timeline (33 Migrations)

```
2026-06-02  Initial schema: series, chapters, chapter_pages, profiles, etc.
            + user_library, content_rating, view_count RPCs
2026-06-03  Chapter uploader fields, reactions, chapter_count
            + User stats/preferences, most_followed function
            + Analytics, tags, admin platform features
            + RLS fixes, demo banners, carousel, achievements
2026-06-04  Profile enhancements (banner, accent, social links)
            + Notifications, avatars bucket, tags→genres migration
            + RLS fixes, privacy settings, public profile RPCs
2026-06-05  Avatar frames, scanlation group chapters
2026-06-06  Series import sources (auto-scraping)
2026-06-07  Carousel limit updates, chapter comments threads
```

---

## 🧠 Error Handling Strategy

```
Server-side (SSR):
  ├── errorMiddleware in start.ts catches all server function errors
  ├── normalizeCatastrophicSsrResponse() handles h3 swallow errors
  ├── renderErrorPage() produces clean HTML error page
  └── Error capture library (error-capture.ts) stores last error

Client-side:
  ├── errorComponent in root route handles rendering errors
  ├── notFoundComponent for 404 pages
  ├── lovable-error-reporting.ts sends error to remote service
  └── TanStack Query retry=1 handles transient fetch failures

Reader-specific:
  ├── Image error retry (2 retries with progressive delay)
  ├── Scroll position restoration from localStorage
  └── Chapter prefetching at 50% scroll progress
```

---

## 📦 Deployment & Build Pipeline

```
Build (npm run build):
  1. vite build ──► Bundled JS + CSS
  2. copy-chromium-assets.js ──► Copy Chromium for serverless
  3. generate-sitemap.js ──► SEO sitemap.xml

Deploy targets:
  ├── Vercel (primary)
  │   ├── Edge functions for SSR
  │   ├── Vercel Analytics auto-instrumented
  │   └── Environment variables: SUPABASE_URL, SERVICE_ROLE_KEY, etc.
  └── Supabase (database & auth)

Preview (npm run dev):
  ├── Vite dev server with HMR
  ├── TanStack Router dev tools
  └── Supabase local via CLI
```

---

> **Note:** This document is auto-generated from codebase analysis. The Mermaid diagrams render in GitHub, VS Code (with extension), or any markdown viewer that supports Mermaid.