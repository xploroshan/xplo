# HYKRZ Application Architecture & Workflow

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HYKRZ Platform Architecture                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │  Landing Page │   │  Auth Pages  │   │  Main App    │   │ Admin Panel │ │
│  │  (Public)     │   │  (Public)    │   │  (Protected) │   │ (Admin+)    │ │
│  │              │   │              │   │              │   │             │ │
│  │  /           │   │  /login      │   │  /events     │   │ /admin      │ │
│  │  /@slug      │   │  /register   │   │  /feed       │   │ /admin/users│ │
│  │              │   │  /forgot-pw  │   │  /messages   │   │ /admin/...  │ │
│  │              │   │  /reset-pw   │   │  /profile    │   │             │ │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────┬──────┘ │
│         │                  │                  │                   │        │
│  ───────┴──────────────────┴──────────────────┴───────────────────┴─────── │
│                          Next.js 16 App Router                             │
│  ────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │  NextAuth.js v5     │  │  API Routes      │  │  Prisma ORM v6        │ │
│  │  JWT Strategy       │  │  /api/auth/*     │  │  PostgreSQL (Neon)    │ │
│  │  Google + Creds     │  │  /api/events/*   │  │  13 Models            │ │
│  │  Role-based access  │  │  /api/organizers/*│  │  Rate-limited         │ │
│  └─────────────────────┘  └──────────────────┘  └────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. User Authentication Flow

```
                    ┌──────────────┐
                    │  User Visits │
                    │  HYKRZ.com   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Landing Page │
                    │    /         │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
       ┌──────▼──────┐          ┌──────▼───────┐
       │  Sign In    │          │  Get Started │
       │  /login     │          │  /register   │
       └──────┬──────┘          └──────┬───────┘
              │                         │
    ┌─────────┴─────────┐      ┌───────▼────────┐
    │                   │      │ Choose Role:   │
┌───▼────┐     ┌────────▼──┐  │ USER or        │
│Email + │     │  Google   │  │ ORGANIZER      │
│Password│     │  OAuth    │  └───────┬────────┘
└───┬────┘     └────┬──────┘          │
    │               │          ┌──────▼─────────┐
    │               │          │POST /api/auth/ │
    │               │          │register        │
    │               │          │• Validate input│
    │               │          │• Hash password │
    │               │          │• Create user   │
    │               │          └──────┬─────────┘
    │               │                 │
    ▼               ▼                 ▼
┌────────────────────────────────────────┐
│         NextAuth authorize()           │
│  1. Find user by email                 │
│  2. Check banned/locked status         │
│  3. Verify bcrypt password hash        │
│  4. Handle failed attempts (max 5)     │
│  5. Issue JWT token (30-day)           │
│     Token contains: id, role           │
└──────────────────┬─────────────────────┘
                   │
            ┌──────▼──────┐
            │  Redirect   │
            │  /events    │
            │  (Dashboard)│
            └─────────────┘
```

---

## 3. Password Reset Flow

```
┌──────────────┐    ┌────────────────────┐    ┌────────────────────┐
│ /forgot-     │───▶│ POST /api/auth/    │───▶│ Create             │
│ password     │    │ forgot-password    │    │ PasswordResetToken │
│              │    │ Rate: 3 req/15min  │    │ Expires: 1 hour    │
└──────────────┘    └────────────────────┘    └─────────┬──────────┘
                                                        │
                                              ┌─────────▼──────────┐
                                              │ Email token link   │
                                              │ (console in dev)   │
                                              └─────────┬──────────┘
                                                        │
┌──────────────┐    ┌────────────────────┐    ┌─────────▼──────────┐
│ Password     │◀───│ POST /api/auth/    │◀───│ /reset-password    │
│ Updated!     │    │ reset-password     │    │ ?token=xxx         │
│ → /login     │    │ • Validate token   │    │ New password form  │
└──────────────┘    │ • Check expiry     │    └────────────────────┘
                    │ • Hash new pw      │
                    │ • Mark token used  │
                    │ • Reset lockout    │
                    └────────────────────┘
```

---

## 4. Layout & Component Hierarchy

```
RootLayout (src/app/layout.tsx)
│  ├── Dark theme, fonts (Inter + JetBrains Mono)
│  └── <Providers> (SessionProvider)
│
├─── (auth) Layout ─────────────────────────────────────
│    │  Centered card layout, gradient backgrounds
│    │
│    ├── /login ─── LoginPage
│    │   ├── Email/Password form
│    │   ├── Google OAuth button
│    │   ├── Password toggle (eye icon)
│    │   └── Links: forgot-password, register
│    │
│    ├── /register ─── RegisterPage
│    │   ├── Role toggle: USER ↔ ORGANIZER
│    │   ├── Name, Email, Password, City fields
│    │   ├── Conditional: Organizer slug field
│    │   └── Links: login, terms, privacy
│    │
│    ├── /forgot-password ─── ForgotPasswordPage
│    └── /reset-password ─── ResetPasswordPage
│
├─── (main) Layout ─────────────────────────────────────
│    │  ┌─────────────────────────────────────────────┐
│    │  │ ┌──────────┐ ┌────────────────────────────┐ │
│    │  │ │ Sidebar  │ │ ┌────────────────────────┐ │ │
│    │  │ │ (lg+)    │ │ │     AppTopBar          │ │ │
│    │  │ │          │ │ │ Title │ Search │ Avatar │ │ │
│    │  │ │ Logo     │ │ └────────────────────────┘ │ │
│    │  │ │ Discover │ │ ┌────────────────────────┐ │ │
│    │  │ │ Feed     │ │ │                        │ │ │
│    │  │ │ Messages │ │ │     Page Content        │ │ │
│    │  │ │ Profile  │ │ │     (children)          │ │ │
│    │  │ │          │ │ │                        │ │ │
│    │  │ │ + Create │ │ └────────────────────────┘ │ │
│    │  │ │ Event    │ │                            │ │
│    │  │ │          │ └────────────────────────────┘ │
│    │  │ │ Pinned   │         Mobile: Bottom Nav     │
│    │  │ │ Orgs     │  ┌──────────────────────────┐  │
│    │  │ │          │  │ 🏠  📡  ➕  💬  👤      │  │
│    │  │ │ Avatar   │  └──────────────────────────┘  │
│    │  │ └──────────┘                                │
│    │  └─────────────────────────────────────────────┘
│    │
│    ├── /events ─── EventsPage
│    │   ├── SearchBar
│    │   ├── FeaturedCarousel (auto-advance, AnimatePresence)
│    │   ├── CategoryFilter (scrolling pills)
│    │   ├── UpcomingRow ("This Week" horizontal scroll)
│    │   ├── EventCard grid (1/2/3 cols responsive)
│    │   └── Sidebar: PopularOrganizers + PlatformStats
│    │
│    ├── /events/[slug] ─── EventDetailPage
│    │   ├── Hero cover image/gradient
│    │   ├── Info grid (date, time, distance, price)
│    │   ├── Route visualization
│    │   ├── Safety banner
│    │   ├── Participants list + avatar stack
│    │   ├── Organizer card (follow/pin)
│    │   ├── Join CTA button
│    │   └── Similar events row
│    │
│    ├── /events/create ─── CreateEventPage
│    │   └── Multi-section form (details, schedule, location, capacity)
│    │
│    ├── /feed ─── FeedPage
│    │   ├── PostCard[] (like, comment, share, bookmark)
│    │   ├── ActivityCard[] (join, complete, earn badge)
│    │   └── FeedSidebar (countdown, organizers, hashtags)
│    │
│    ├── /messages ─── MessagesPage
│    │   ├── ConversationList (search + items)
│    │   └── ChatArea (header, messages, input)
│    │
│    └── /profile ─── ProfilePage
│        ├── Cover banner + Avatar + Stats grid
│        └── Tabs: Activity │ Events │ Badges │ Settings
│            ├── Activity: ActivityCard[]
│            ├── Events: EventCard[] (upcoming + past)
│            ├── Badges: BadgeIcon[] (bronze/silver/gold/platinum)
│            └── Settings: OrganizerCta + ChangePassword
│
└─── admin/ Layout ─────────────────────────────────────
     │  Admin sidebar (Shield icon, 5 nav items)
     ├── /admin ─── AdminDashboard (stats, activity)
     ├── /admin/users ─── UserManagement (table, filters)
     └── /admin/events ─── EventManagement (table, filters)
```

---

## 5. Data Model Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA (Prisma/PostgreSQL)           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌───────────┐    ┌──────────────────┐             │
│  │   User   │───▶│  Account  │    │  PasswordReset   │             │
│  │          │    │  (OAuth)  │    │  Token           │             │
│  │ id       │    └───────────┘    └──────────────────┘             │
│  │ email    │                                                       │
│  │ name     │    ┌───────────┐                                     │
│  │ password │───▶│  Session  │                                     │
│  │ role ────│──┐ └───────────┘                                     │
│  │ slug     │  │                                                    │
│  │ verified │  │  Roles: USER │ ORGANIZER │ ADMIN │ SUPER_ADMIN    │
│  └────┬─────┘  │                                                    │
│       │        │                                                    │
│  ┌────┴────────┴────────────────────────────────────────────┐      │
│  │              User Relationships                           │      │
│  │                                                           │      │
│  │  as Organizer          as Participant         as Social   │      │
│  │  ┌──────────┐         ┌───────────────┐     ┌──────────┐│      │
│  │  │organizes │         │participates   │     │ posts    ││      │
│  │  │ Event[]  │         │ EventPart[]   │     │ Post[]   ││      │
│  │  └────┬─────┘         └───────┬───────┘     │ Comment[]││      │
│  │       │                       │              └──────────┘│      │
│  │  ┌────┴─────────┐    ┌───────┴───────┐                   │      │
│  │  │pinnedBy      │    │status:        │     ┌──────────┐ │      │
│  │  │OrganizerPin[]│    │PENDING        │     │followers │ │      │
│  │  └──────────────┘    │CONFIRMED      │     │Follow[]  │ │      │
│  │                      │WAITLISTED     │     │following │ │      │
│  │  ┌──────────────┐   │CANCELLED      │     │Follow[]  │ │      │
│  │  │sends         │    └───────────────┘     └──────────┘ │      │
│  │  │Message[]     │                                        │      │
│  │  │Notification[]│    ┌───────────────┐                   │      │
│  │  └──────────────┘    │pinnedOrgs     │                   │      │
│  │                      │OrganizerPin[] │                   │      │
│  │                      │(max 5)        │                   │      │
│  │                      └───────────────┘                   │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌──────────────────────────────────────────────┐                  │
│  │                    Event                      │                  │
│  │                                               │                  │
│  │  id, title, slug, description                 │                  │
│  │  startDate, endDate                           │                  │
│  │  startLocation{}, destination{}, waypoints[]  │                  │
│  │  capacity, price, currency                    │                  │
│  │  status: DRAFT → PUBLISHED → OPEN →           │                  │
│  │          ACTIVE → COMPLETED → ARCHIVED        │                  │
│  │                                               │                  │
│  │  ┌─────────────┐  ┌────────────────────────┐ │                  │
│  │  │ eventTypeId │  │ Chat (merged):         │ │                  │
│  │  │ → EventType │  │ chatActive, archived   │ │                  │
│  │  │   name      │  │ messageRetention       │ │                  │
│  │  │   slug      │  └────────────────────────┘ │                  │
│  │  │   icon      │                              │                  │
│  │  │   color     │  ┌────────────────────────┐ │                  │
│  │  └─────────────┘  │ Organizer Controls:    │ │                  │
│  │                    │ requiresApproval       │ │                  │
│  │                    │ assemblyPoint{}        │ │                  │
│  │                    │ checklist[]            │ │                  │
│  │                    └────────────────────────┘ │                  │
│  └──────────────────────────────────────────────┘                  │
│                                                                     │
│  ┌────────────────┐   ┌────────────┐   ┌───────────────────┐      │
│  │    Message      │   │    Post     │   │   Notification    │      │
│  │                 │   │            │   │                   │      │
│  │ eventId (group) │   │ content    │   │ type (10 types)  │      │
│  │ conversationId  │   │ images[]   │   │ title, content   │      │
│  │ (DM)            │   │ likedBy[]  │   │ link, read       │      │
│  │ type (8 types)  │   │ hashtags[] │   │ userId, senderId │      │
│  │ replyToId       │   │ isStory    │   └───────────────────┘      │
│  │ pinned, deleted │   │ bookmarks[]│                               │
│  └────────────────┘   └────────────┘                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. API Route Map

```
/api
├── /auth
│   ├── [...nextauth]     GET/POST   NextAuth handlers (login, session, csrf)
│   ├── /register         POST       Create new user account
│   │                                • Validates: name, email, password, role
│   │                                • Rate limit: 5 req/15min per IP
│   │                                • Returns: 201 Created | 409 Conflict
│   │
│   ├── /change-password  POST       Change password (authenticated)
│   │                                • Validates: current + new password
│   │                                • Rate limit: 5 req/15min per user
│   │
│   ├── /forgot-password  POST       Initiate password reset
│   │                                • Always returns 200 (no email enum)
│   │                                • Rate limit: 3 req/15min per IP
│   │
│   └── /reset-password   POST       Complete password reset
│                                    • Validates: token, expiry, strength
│                                    • Rate limit: 5 req/15min per IP
│
├── /events
│   └── /[eventId]
│       └── /register     POST       Join event (CONFIRMED/PENDING/WAITLISTED)
│                         DELETE     Leave event (status → CANCELLED)
│
├── /organizers
│   └── /[slug]           GET        Public organizer profile + stats
│       └── /events       GET        Organizer's event list
│
├── /pins                 GET        List user's pinned organizers (max 5)
│                         POST       Pin an organizer
│   └── /[organizerId]    DELETE     Unpin an organizer
│
├── /follow               POST       Follow an organizer
│                         DELETE     Unfollow an organizer
│
├── /users
│   └── /upgrade-to-      POST       Upgrade USER → ORGANIZER role
│       organizer
│
└── /admin
    └── /users
        └── /[userId]
            └── /verify   PATCH      Toggle user verified status (admin+)
```

---

## 7. Event Lifecycle

```
   Organizer creates event
           │
     ┌─────▼─────┐
     │   DRAFT    │  Not visible to users
     └─────┬──────┘
           │ Publish
     ┌─────▼──────┐
     │ PUBLISHED  │  Visible, registration not open
     └─────┬──────┘
           │ Open registration
     ┌─────▼──────┐
     │    OPEN    │  Users can join
     │            │  ├── CONFIRMED (if auto-approve)
     │            │  ├── PENDING (if requiresApproval)
     │            │  └── WAITLISTED (if at capacity)
     └─────┬──────┘
           │ Event day / Start
     ┌─────▼──────┐
     │   ACTIVE   │  Live tracking, group chat active
     └─────┬──────┘
           │ End
     ┌─────▼──────┐
     │ COMPLETED  │  Ratings enabled, chat archived (48h)
     └─────┬──────┘
           │ Auto/Manual
     ┌─────▼──────┐
     │  ARCHIVED  │  Read-only, historical
     └───────────┘
```

---

## 8. Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Security Layers                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. INPUT VALIDATION                                     │
│     ┌────────────────────────────────────┐              │
│     │ Zod v4 Schemas                     │              │
│     │ • registerSchema (email, pw rules) │              │
│     │ • Password: 8+ chars, upper,       │              │
│     │   lower, number, special char      │              │
│     │ • Slug: lowercase alphanumeric     │              │
│     └────────────────────────────────────┘              │
│                                                          │
│  2. AUTHENTICATION                                       │
│     ┌────────────────────────────────────┐              │
│     │ NextAuth.js v5 (JWT Strategy)      │              │
│     │ • JWT tokens (30-day expiry)       │              │
│     │ • bcrypt password hashing          │              │
│     │ • Google OAuth 2.0                 │              │
│     │ • Session in every API call        │              │
│     └────────────────────────────────────┘              │
│                                                          │
│  3. BRUTE FORCE PROTECTION                               │
│     ┌────────────────────────────────────┐              │
│     │ Account Lockout                    │              │
│     │ • 5 failed attempts → 15min lock   │              │
│     │ • Reset on successful login        │              │
│     │                                    │              │
│     │ Rate Limiting (sliding window)     │              │
│     │ • Register: 5/15min per IP         │              │
│     │ • Forgot pw: 3/15min per IP        │              │
│     │ • Reset pw: 5/15min per IP         │              │
│     │ • Change pw: 5/15min per user      │              │
│     └────────────────────────────────────┘              │
│                                                          │
│  4. AUTHORIZATION                                        │
│     ┌────────────────────────────────────┐              │
│     │ Role-Based Access Control          │              │
│     │ • USER: browse, join events        │              │
│     │ • ORGANIZER: create events, slug   │              │
│     │ • ADMIN: manage users/events       │              │
│     │ • SUPER_ADMIN: full access         │              │
│     └────────────────────────────────────┘              │
│                                                          │
│  5. DATA PROTECTION                                      │
│     ┌────────────────────────────────────┐              │
│     │ • Password reset tokens: 1hr       │              │
│     │   expiry, single use               │              │
│     │ • No email enumeration on          │              │
│     │   forgot-password (always 200)     │              │
│     │ • Soft deletes on messages         │              │
│     │ • CSP headers configured           │              │
│     └────────────────────────────────────┘              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Tech Stack Summary

```
┌────────────────────────────────────────────────────────┐
│  Frontend          │  Backend          │  Infrastructure│
├────────────────────┼───────────────────┼────────────────┤
│ Next.js 16.2.1     │ Next.js API Routes│ Vercel (host)  │
│ React 19           │ NextAuth.js v5    │ Neon (Postgres)│
│ TypeScript (strict)│ Prisma ORM v6     │ GitHub (code)  │
│ Tailwind CSS v4    │ bcrypt (hashing)  │                │
│ Framer Motion      │ Zod v4 (validate) │                │
│ Zustand (state)    │ Rate Limiter      │                │
│ Lucide Icons       │ (in-memory)       │                │
│ Turbopack (dev)    │                   │                │
├────────────────────┴───────────────────┴────────────────┤
│  Testing: Vitest (216 unit) + Playwright (54 E2E)       │
└─────────────────────────────────────────────────────────┘
```
