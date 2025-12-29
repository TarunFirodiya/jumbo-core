jumbo-web/
├── drizzle.config.ts           # Drizzle ORM configuration
├── components.json             # Shadcn UI configuration
├── package.json                # Updated with db:* scripts
├── .env.example                # Environment variables template
└── src/
    ├── middleware.ts           # Auth & RBAC middleware
    ├── app/
    │   ├── (dashboard)/        # Protected dashboard routes
    │   │   ├── listings/
    │   │   │   ├── page.tsx           # Server Component: Fetches listings from DB
    │   │   │   └── [id]/page.tsx      # Server Component: Fetches single listing
    │   │   ├── buyers/
    │   │   │   ├── page.tsx           # Server Component: Fetches leads from DB
    │   │   │   └── [id]/page.tsx      # Server Component: Fetches single lead
    │   │   └── visits/
    │   │       ├── page.tsx           # Server Component: Fetches visits from DB
    │   │       └── [id]/page.tsx      # Server Component: Fetches single visit
    │   └── api/v1/
    │       ├── leads/route.ts          # Lead ingestion API
    │       └── listings/active/route.ts # Public listings API
    ├── components/
    │   ├── ui/                 # Shadcn UI primitives (button, dialog, etc.)
    │   ├── listings/
    │   │   ├── listings-page-content.tsx  # Client wrapper: Handles tabs/state
    │   │   ├── listings-table.tsx         # Display component: Accepts data prop
    │   │   ├── listings-kanban.tsx        # Display component: Accepts data prop
    │   │   └── listings-stats.tsx         # Display component: Accepts stats prop
    │   ├── buyers/
    │   │   ├── buyers-page-content.tsx    # Client wrapper: Handles tabs/state
    │   │   ├── buyers-table.tsx           # Display component: Accepts data prop
    │   │   └── buyers-kanban.tsx          # Display component: Accepts data prop
    │   └── visits/
    │       ├── visits-page-content.tsx    # Client wrapper: Handles tabs/state
    │       ├── visits-table.tsx           # Display component: Accepts data prop
    │       └── visits-kanban.tsx         # Display component: Accepts data prop
    ├── hooks/
    │   └── use-supabase.ts     # Client-side Supabase hook
    ├── lib/
    │   ├── db/
    │   │   ├── schema.ts       # Full Drizzle schema with relations
    │   │   └── index.ts        # DB client export
    │   ├── supabase/
    │   │   ├── client.ts       # Browser client
    │   │   ├── server.ts       # SSR client
    │   │   └── middleware.ts  # Session management
    │   ├── services/mock/
    │   │   ├── housing.ts      # Housing.com mock
    │   │   ├── exotel.ts       # Exotel telephony mock
    │   │   └── whatsapp.ts    # WhatsApp Business mock
    │   ├── validations/
    │   │   ├── lead.ts         # Lead API Zod schemas
    │   │   └── listing.ts      # Listing API Zod schemas
    │   └── utils.ts            # cn() helper + formatINR, formatDate
    └── types/
        └── index.ts            # Re-exported types

## Architecture Pattern: Server Component Data Fetching

### Three-Layer Pattern (REQUIRED for List Views)

1. **Page Component (Server)** - `app/(dashboard)/[feature]/page.tsx`
   - Fetches data using `db.query` with relations
   - Calculates stats/metrics
   - Passes data to client wrapper
   - Example: `app/(dashboard)/listings/page.tsx`

2. **Page Content Component (Client)** - `components/[feature]/[feature]-page-content.tsx`
   - Handles UI state (tabs, modals, filters)
   - Receives data as props
   - Renders display components
   - Example: `components/listings/listings-page-content.tsx`

3. **Display Components (Client)** - `components/[feature]/[feature]-table.tsx`, etc.
   - Accept data as props (never fetch themselves)
   - Pure presentation components
   - Examples: `listings-table.tsx`, `listings-kanban.tsx`, `listings-stats.tsx`

### Benefits
- ✅ Better performance (no client-side waterfalls)
- ✅ Server-rendered content (better SEO)
- ✅ Type-safe data flow from schema
- ✅ Consistent architecture across modules
- ✅ Easier to maintain and test

### Rules
- **DO**: Fetch data in Server Components
- **DO**: Pass data down as props
- **DON'T**: Fetch data in display components
- **DON'T**: Use `useEffect` + `fetch` for list views
- **DON'T**: Import mock data in production components
