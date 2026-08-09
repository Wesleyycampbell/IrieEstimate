# IrieEstimate
test up
Construction labour cost estimator for Jamaica. Homeowners choose a build tier, customise finishes across 11 trade categories, enter their parish and square footage, and receive a detailed cost breakdown — all in under two minutes.

## Tech Stack

- **Framework** — Next.js 16 (App Router, Turbopack)
- **Language** — TypeScript
- **Database** — PostgreSQL on Neon (SSL)
- **ORM** — Drizzle ORM with postgres.js driver
- **Styling** — Tailwind CSS v4 with custom `ink` / `cane` colour tokens
- **Auth** — HMAC-signed cookie sessions (workspace only)
- **Email** — Resend
- **Validation** — Zod

## Features

### Public Site

- **Landing page** (`/`) — hero section, sample estimate card, how-it-works steps, footer with About link
- **Estimate wizard** (`/estimate`) — 4-step flow with visual progress bar:
  1. **Tier** — choose house type (Affordable / Standard / Premium / Luxury) with per-sq-ft pricing
  2. **Finishes** — paginated category selection (3 categories per page with dot navigation), options show cost modifiers (%, flat, per-sqft)
  3. **Details** — square footage, parish selector with cost multipliers, contact info (email/phone), contractor consent
  4. **Results** — total cost with full breakdown, parish adjustment, USD conversion, consultation upsell, ad slots
- **Blog** (`/blog`, `/blog/[slug]`) — blog listing and post detail pages with markdown rendering, ad slots
- **About** (`/about`) — what we do, how estimates work, contractor network, 14-parish coverage, contact info

### Ads System

- **Ad types** — Local partner ads (custom HTML banners) and Google / external ads (AdSense snippets)
- **Page targeting** — ads can target Blog pages, Estimate Results, or both
- **Parish targeting** — up to 3 parishes per ad; parish-matched ads shown first to visitors from those areas
- **Time control** — start date and optional end date for campaign scheduling
- **Mixed display** — where two ad slots exist, one shows a local ad and one shows a Google ad; responsive grid (side-by-side on desktop, stacked on mobile)
- **Analytics** — impression and click tracking with CTR calculation
- **Ad slot component** — shared `AdSlot` component (`src/components/ad-slot.tsx`) used across estimate, blog listing, and blog post pages

### Workspace (Admin Dashboard)

Accessible at `/hq-workspace` with email/password login.

- **Overview** — dashboard landing
- **Pricing Engine** — CRUD for house types, customisation categories, and options with cost modifiers
- **Leads** — full lead management:
  - View all estimate submissions with contact info, house type, parish, estimate amount, IP-based origin tracking
  - Edit/update lead details (contact, house type, parish, sq ft, cost)
  - Delete leads (admin only) with confirmation
  - Filter by origin (Local/International/Unknown), house type, and parish
  - Export filtered leads to CSV
  - Desktop table + mobile card layout
- **Consultations** — consultation requests linked to leads with payment and meeting status tracking
- **Blog** — create, edit, publish/unpublish blog posts
- **Ads Center** — full ad management:
  - Create/edit/delete ads with Local or Google/External type toggle
  - Multi-parish selector (up to 3 parishes, pill-style UI)
  - Toggleable help tooltips with detailed instructions for each field
  - Status badges (Active, Inactive, Expired, Scheduled) and type badges (Local, Google)
  - Impression/click/CTR analytics per ad

### Mobile Responsive

The entire site is mobile responsive:

- **Public pages** — nav links collapse on mobile, content stacks vertically, ads stack in single column
- **Workspace** — desktop sidebar hidden on mobile, replaced with hamburger menu and slide-out overlay panel
- **Leads table** — switches from table layout to card layout on mobile
- **Ads Center** — form fields stack vertically, ad cards adapt to narrow screens
- **Ad slots** — two-column grid on desktop, single column on mobile

### IP & Geolocation

- Estimate submissions capture the visitor's IP address from `x-forwarded-for` / `x-real-ip` headers
- Basic Jamaica detection determines if the lead is local or international
- Leads page shows origin badges (Local / International / Unknown) with IP address

### Security

- **Security headers** — CSP, HSTS, X-Frame-Options (DENY), X-Content-Type-Options, Referrer-Policy, Permissions-Policy via `next.config.ts`
- **CSRF protection** — middleware validates `Origin` / `Referer` headers on all non-GET API requests
- **Rate limiting** — global API rate limit (60 req/min per IP), plus per-endpoint limits on login (5/15min), estimate (10/min), consultations (5/min)
- **Input validation** — all API routes validate input with Zod schemas; no raw request bodies are trusted
- **XSS prevention** — blog markdown renderer escapes all HTML before rendering; URL sanitisation blocks `javascript:` URIs
- **Auth** — HMAC-SHA256 signed cookies with `httpOnly`, `secure` (production), `sameSite: lax`, timing-safe comparison
- **SSRF protection** — webhook URLs validated against allow-list (HTTPS only, no private IPs)
- **robots.txt** — blocks crawlers from `/hq-workspace/` and `/api/workspace/`

### SEO

- Open Graph and Twitter Card meta tags on all pages
- Dynamic `sitemap.xml` generated from published blog posts
- `robots.txt` with crawler directives
- Structured metadata with title templates

### Error Handling

- Custom 404 (not-found) and 500 (error) pages with brand-consistent styling
- Loading spinners for page transitions (root and workspace)
- All API routes wrapped in try/catch with generic 500 responses

## Project Structure

```
src/
  app/
    layout.tsx                        # Root layout (OG meta, fonts)
    page.tsx                          # Landing page
    error.tsx                         # Global error boundary
    not-found.tsx                     # Custom 404 page
    loading.tsx                       # Root loading spinner
    sitemap.ts                        # Dynamic sitemap generator
    robots.ts                         # Crawler directives
    about/page.tsx                    # About page
    estimate/page.tsx                 # Estimate wizard (4-step)
    blog/
      page.tsx                        # Blog listing
      [slug]/page.tsx                 # Blog post detail
    hq-workspace/
      login/page.tsx                  # Workspace login
      (dashboard)/
        layout.tsx                    # Sidebar layout (desktop + mobile)
        loading.tsx                   # Workspace loading spinner
        page.tsx                      # Overview
        pricing/page.tsx              # Pricing engine
        leads/
          page.tsx                    # Leads wrapper
          leads-client.tsx            # Leads CRUD client
        consultations/page.tsx        # Consultation requests
        blog/page.tsx                 # Blog management
        ads/
          page.tsx                    # Ads center wrapper
          ads-client.tsx              # Ads CRUD client
    api/
      estimate/route.ts              # Submit estimate (rate limited)
      leads/route.ts                 # Get pricing data (cached)
      blog/route.ts                  # Public blog listing (cached)
      blog/[slug]/route.ts           # Public blog post
      consultations/route.ts         # Submit consultation (rate limited)
      ads/route.ts                   # Public ads (filtered, sorted, tracked)
      ads/click/route.ts             # Ad click tracking (validated)
      workspace/
        login/route.ts               # Workspace auth (rate limited)
        pricing/route.ts             # Pricing CRUD
        blog/route.ts                # Blog CRUD
        ads/route.ts                 # Ads CRUD
        leads/route.ts               # Leads CRUD (GET/PATCH/DELETE)
  components/
    ad-slot.tsx                       # Shared ad display component
    mobile-sidebar.tsx                # Workspace mobile sidebar overlay
  db/
    index.ts                          # Database connection
    schema.ts                         # Drizzle schema (all tables)
  lib/
    workspace-auth.ts                 # HMAC cookie session auth
    rate-limit.ts                     # In-memory rate limiter
    validations.ts                    # Zod schemas for public inputs
  middleware.ts                       # Auth, CSRF, rate limiting
scripts/
  seed.ts                            # Initial data seed
  migrate-ads.ts                     # Ads table migration (v1)
  migrate-ads-v2.ts                  # Multi-parish + ad type migration
  seed-ads.ts                        # Dummy ad data (local + Google)
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `house_types` | Build tiers with base cost per sq ft |
| `customization_categories` | Finish categories (roofing, plumbing, etc.) |
| `customization_options` | Options within each category with cost modifiers |
| `parishes` | Jamaica's 14 parishes with cost multipliers |
| `leads` | Estimate submissions with contact, IP, and origin tracking |
| `lead_customizations` | Selected options per lead |
| `partners` | Contractor partners by parish |
| `lead_distributions` | Lead sharing with partners |
| `blog_posts` | Blog content with publish status |
| `consultation_requests` | Consultation requests linked to leads |
| `workspace_users` | Admin users with role-based access |
| `ads` | Ad campaigns with type, targeting, scheduling, and analytics |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with:
   ```
   DATABASE_URL=postgresql://...
   WORKSPACE_SECRET=your-secret-key
   ```
4. Run migrations:
   ```bash
   npx tsx scripts/seed.ts
   npx tsx scripts/migrate-ads.ts
   npx tsx scripts/migrate-ads-v2.ts
   ```
5. (Optional) Seed dummy ads:
   ```bash
   npx tsx scripts/seed-ads.ts
   ```
6. Start the dev server:
   ```bash
   npm run dev -- --port 3457
   ```

### Workspace Access

Navigate to `/hq-workspace` and log in with workspace credentials.

Roles: `admin` (full access), `editor` (create/edit), `viewer` (read only).

## Design System

Custom colour tokens defined in `globals.css`:

- **ink** (50–900) — neutral palette with blue-purple undertone
- **cane** (50–700) — warm gold accent
- **Font** — DM Sans (400, 500, 600, 700)
- **Background** — `#faf9f6` (warm off-white)

## Dummy Ads Included

The seed script creates 6 sample ads:

| Ad | Type | Target Pages | Parishes |
|----|------|-------------|----------|
| Island Hardware - Building Supplies | Local | Blog, Estimate | Kingston, St. Andrew |
| BuildRight Contractors | Local | Estimate | St. Catherine, Kingston |
| PipeMaster Plumbing - 24/7 Service | Local | Blog, Estimate | St. James |
| SparkPro Electrical | Local | Estimate | Manchester, St. Catherine, Kingston |
| Google Ad Slot - Blog Sidebar | Google | Blog | All |
| Google Ad Slot - Estimate Results | Google | Estimate | All |
