# vnrscans Architecture Diagram

## Project Overview
**vnrscans** is a modern manga/manhwa reading platform built with TanStack Start and Supabase.

---

## Tech Stack

### Frontend
- **Framework**: TanStack Start (React 19 + Vite)
- **Routing**: TanStack Router with file-based routing
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **State Management**: React Context (Theme, ReaderSettings)

### Backend
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (avatars, images)
- **Real-time**: Supabase Realtime (subscriptions)
- **Security**: Row Level Security (RLS) policies

### DevOps
- **Build**: Vite
- **Package Manager**: Bun
- **Deployment**: Vercel
- **Analytics**: Vercel Analytics
- **TypeScript**: Full type safety

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Browser    │───▶│  TanStack    │───▶│   React 19   │     │
│  │              │    │   Router     │    │   Components │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                   │                   │              │
│         │                   ▼                   ▼              │
│         │          ┌──────────────┐    ┌──────────────┐       │
│         │          │  File Routes │───▶│  Page Views  │       │
│         │          │  (src/routes)│    │  (tsx)       │       │
│         │          └──────────────┘    └──────────────┘       │
│         │                   │                   │              │
│         │                   ▼                   │              │
│         │          ┌──────────────┐            │              │
│         │          │  Middleware  │            │              │
│         │          │  (Auth, Error│            │              │
│         │          │   Handling)  │            │              │
│         │          └──────────────┘            │              │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Context Providers                        │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │ ThemeContext │  │ReaderSettings│  │ QueryClient  │ │    │
│  │  │ (Dark/Light) │  │ (Reading UI) │  │   Provider   │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  └──────────────────────────────────────────────────────┘    │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Data Layer (React Query)                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │ useQuery     │  │ useMutation  │  │ useInfinite  │ │    │
│  │  │ (GET data)   │  │ (POST/PUT)   │  │  Query       │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  └──────────────────────────────────────────────────────┘    │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER SIDE (Vite SSR)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  server.ts    │───▶│  start.ts    │───▶│  router.tsx  │     │
│  │  (Entry)     │    │  (Middleware)│    │  (Router)    │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                   │                   │              │
│         │                   ▼                   │              │
│         │          ┌──────────────┐            │              │
│         │          │ Supabase Auth│            │              │
│         │          │   Attacher   │            │              │
│         │          └──────────────┘            │              │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Server Functions (RPC)                    │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │ Admin Funcs  │  │ Scraper Funcs│  │ User Stats   │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  └──────────────────────────────────────────────────────┘    │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              PostgreSQL Database                     │    │
│  │                                                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │   Users      │  │   Series     │  │   Chapters   │ │    │
│  │  │ (profiles)   │  │ (manga/manhwa│  │ (content)    │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  │         │                   │                   │      │    │
│  │         │                   ▼                   │      │    │
│  │         │          ┌──────────────┐            │      │    │
│  │         │          │   Genres     │            │      │    │
│  │         │          │ (tags)       │            │      │    │
│  │         │          └──────────────┘            │      │    │
│  │         │                   │                   │      │    │
│  │         ▼                   ▼                   ▼      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │ Bookmarks    │  │Reading History│  │   Ratings    │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  │         │                   │                   │      │    │
│  │         ▼                   ▼                   ▼      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │ Comments     │  │ Reports      │  │ Gamification │ │    │
│  │  │              │  │ (DMCA)       │  │ (XP/Badges)  │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  └──────────────────────────────────────────────────────┘    │
│                           │                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Row Level Security (RLS)                │    │
│  │  • Public read for published content                 │    │
│  │  • User-specific write for own data                 │    │
│  │  • Admin/moderator override permissions             │    │
│  └──────────────────────────────────────────────────────┘    │
│                           │                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Supabase Services                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │    Auth      │  │   Storage    │  │  Realtime    │ │    │
│  │  │ (JWT tokens) │  │ (avatars/img) │  │ (subscriptions│ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
shadow-shelf/
├── src/
│   ├── routes/                    # File-based routing
│   │   ├── __root.tsx            # Root layout (Navbar, Footer, Providers)
│   │   ├── index.tsx             # Landing page
│   │   ├── home.tsx              # Authenticated home
│   │   ├── auth.tsx              # Authentication page
│   │   ├── browse.tsx            # Series discovery
│   │   ├── title.$slug.tsx       # Series detail page
│   │   ├── title.$titleSlug.$chapterSlug.tsx  # Chapter reader
│   │   ├── user.$username.tsx    # User profile
│   │   ├── _authenticated/      # Protected routes
│   │   │   ├── admin/           # Admin panel
│   │   │   │   ├── series.tsx   # Series management
│   │   │   │   ├── users.tsx    # User management
│   │   │   │   ├── badges.tsx   # Badge system
│   │   │   │   ├── analytics.tsx
│   │   │   │   └── ...
│   │   │   ├── profile.tsx      # User profile edit
│   │   │   ├── library.tsx      # User's library
│   │   │   ├── notifications.tsx
│   │   │   └── settings.tsx
│   │   └── ...
│   ├── components/               # Reusable components
│   │   ├── ui/                  # Radix UI components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── SeriesCard.tsx
│   │   ├── HomeHeroCarousel.tsx
│   │   ├── AnnouncementBanner.tsx
│   │   └── profile/              # Profile-specific components
│   ├── contexts/                 # React Context providers
│   │   ├── ThemeContext.tsx     # Dark/light theme
│   │   └── ReaderSettingsContext.tsx  # Reading preferences
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts           # Auth state management
│   │   ├── useMobile.tsx        # Mobile detection
│   │   └── useDragScroll.ts     # Drag-to-scroll
│   ├── integrations/            # Third-party integrations
│   │   └── supabase/
│   │       ├── client.ts        # Client-side Supabase
│   │       ├── client.server.ts # Server-side Supabase
│   │       ├── auth-attacher.ts # Auth middleware
│   │       └── types.ts         # Generated TypeScript types
│   ├── lib/                     # Utilities
│   │   ├── api/                 # Server functions
│   │   ├── config.server.ts     # Server config
│   │   ├── utils.ts             # Helper functions
│   │   └── profileBadges.tsx    # Badge logic
│   ├── router.tsx               # Router configuration
│   ├── start.ts                 # TanStack Start config
│   ├── server.ts                # Server entry point
│   └── styles.css               # Global styles
├── supabase/
│   ├── migrations/              # Database migrations
│   │   ├── 20260602134717_*.sql # Core schema
│   │   ├── 20260603100000_*.sql # User stats
│   │   ├── 20260603120000_*.sql # Analytics & tags
│   │   ├── 20260603140000_*.sql # Admin features
│   │   └── ...
│   └── config.toml              # Supabase config
├── public/                      # Static assets
├── package.json                 # Dependencies
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript config
└── vercel.json                 # Vercel deployment config
```

---

## Data Flow

### Authentication Flow
```
1. User visits /auth
   ↓
2. Supabase Auth handles login/signup
   ↓
3. JWT token stored in browser
   ↓
4. Auth middleware (auth-attacher.ts) validates token
   ↓
5. User role fetched from user_roles table
   ↓
6. Protected routes (_authenticated/) accessible
   ↓
7. Context providers update (useAuth hook)
```

### Reading Flow
```
1. User browses /browse or /home
   ↓
2. React Query fetches series from Supabase
   ↓
3. User clicks series → /title/$slug
   ↓
4. Series details + chapters fetched
   ↓
5. User clicks chapter → /title/$titleSlug/$chapterSlug
   ↓
6. Chapter pages loaded with reader settings
   ↓
7. Reading progress saved to reading_history table
   ↓
8. XP awarded via gamification system
```

### Admin Flow
```
1. Admin logs in (role: admin)
   ↓
2. Accesses /_authenticated/admin/*
   ↓
3. Server functions (RPC) called for admin operations
   ↓
4. RLS policies allow admin override
   ↓
5. Changes made to series, chapters, users, etc.
   ↓
6. Real-time subscriptions update UI
```

---

## Key Features Implementation

### 1. Authentication & Authorization
- **Supabase Auth**: Handles login, signup, password reset
- **Role-based Access**: user, moderator, admin roles in `user_roles` table
- **RLS Policies**: Database-level security for all tables
- **Middleware**: `auth-attacher.ts` injects auth context

### 2. Content Management
- **Series**: Manga/manhwa/manhua/novel metadata
- **Chapters**: Image-based or novel text content
- **Chapter Pages**: Individual images for image chapters
- **Genres**: Tagging system with many-to-many relationship
- **Status**: Draft, published, scheduled chapters

### 3. User Features
- **Profiles**: Customizable with avatar, bio, badges
- **Reading History**: Track progress per chapter
- **Bookmarks**: Save favorite series
- **Ratings**: 1-5 star rating system
- **Comments**: Discussion on series/chapters

### 4. Gamification
- **XP System**: Earn points for reading, commenting
- **Badges**: Unlockable achievements
- **User Levels**: Progression based on XP
- **Streaks**: Daily reading tracking

### 5. Admin Panel
- **Series Management**: CRUD operations
- **User Management**: Role assignment, moderation
- **Analytics**: View counts, engagement metrics
- **Moderation**: Comment moderation, report handling
- **Announcements**: Platform-wide banners
- **Badge System**: Configure achievements

### 6. Reader Experience
- **Customizable Settings**: Reading direction, page fit, mode
- **Image Quality**: High/medium/low options
- **Auto-scroll**: Adjustable speed
- **Preloading**: Next chapter loaded in background
- **Mobile Optimized**: Touch gestures, responsive design

---

## Database Schema Highlights

### Core Tables
- **profiles**: User profiles linked to auth.users
- **user_roles**: Role assignments (user, moderator, admin)
- **series**: Content metadata (manga, manhwa, etc.)
- **chapters**: Chapter content and metadata
- **chapter_pages**: Individual images for chapters
- **genres**: Content categorization
- **series_genres**: Many-to-many relationship

### User Data
- **bookmarks**: User's saved series
- **reading_history**: Progress tracking
- **ratings**: User ratings for series
- **comments**: User discussions

### Gamification
- **achievements**: Badge definitions
- **user_achievements**: Unlocked badges
- **user_stats**: XP, level, streaks

### Admin
- **announcements**: Platform banners
- **reports**: DMCA/content reports
- **admin_logs**: Audit trail

---

## Security Model

### Row Level Security (RLS)
- **Public Read**: Published content accessible to all
- **User Write**: Users can only modify their own data
- **Admin Override**: Admins can modify any data
- **Moderator**: Can hide comments, handle reports

### Authentication
- **JWT Tokens**: Supabase Auth manages sessions
- **Middleware**: Server-side validation on protected routes
- **Context**: Auth state available throughout app via useAuth hook

---

## Performance Optimizations

### Data Fetching
- **React Query**: Automatic caching, background refetching
- **Stale Time**: Configured per query (1-5 minutes)
- **Infinite Queries**: For pagination (browse, history)
- **Selective Loading**: Only fetch needed fields

### Image Optimization
- **Lazy Loading**: Images load as needed
- **Preloading**: Next chapter pages preloaded
- **Quality Options**: User-selectable image quality
- **CDN**: Supabase Storage for fast delivery

### Code Splitting
- **Route-based**: TanStack Router automatic splitting
- **Component**: Dynamic imports for heavy components
- **Tree Shaking**: Vite removes unused code

---

## Deployment

### Vercel
- **Automatic Deployments**: Git push triggers build
- **Edge Functions**: Server-side rendering at edge
- **Environment Variables**: Supabase URL, anon key
- **Analytics**: Built-in Vercel Analytics

### Build Process
```bash
vite build          # Build client + server
node scripts/generate-sitemap.js  # Generate sitemap
```

### Development
```bash
bun run dev         # Start dev server
bun run build       # Production build
bun run preview     # Preview production build
```

---

## Key Integrations

### Supabase
- **Database**: PostgreSQL with RLS
- **Auth**: Email/password, OAuth providers
- **Storage**: Avatar images, chapter images
- **Realtime**: Live updates for notifications

### Vercel
- **Hosting**: Edge deployment
- **Analytics**: User tracking
- **Environment**: Secure variable management

### Lovable
- **Error Reporting**: lovable-error-reporting.ts
- **Cloud Auth**: @lovable.dev/cloud-auth-js

---

## Summary

vnrscans is a full-stack manga reading platform with:

- **Modern Stack**: TanStack Start + Supabase
- **Type-Safe**: Full TypeScript coverage
- **Secure**: RLS policies, role-based access
- **Performant**: React Query caching, image optimization
- **Feature-Rich**: Gamification, admin panel, notifications
- **User-Friendly**: Customizable reader, mobile-optimized
- **Scalable**: Edge deployment, CDN, database indexing

The architecture follows best practices with clear separation of concerns, reusable components, and a robust data layer.
