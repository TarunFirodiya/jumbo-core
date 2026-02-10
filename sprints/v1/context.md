# Sprint V1 - Context

## Project Location
- Path: `/Users/tarun/code_projects/jumbo-crm/jumbo-web`
- Tech: Next.js 16 + Drizzle ORM + Supabase + Tailwind v4

## Architecture Notes (from .cursorrules)

### Data Fetching Pattern (REQUIRED)
1. **Page (Server Component)** - fetches data via `db.query` or service layer, passes as props
2. **PageContent (Client Component)** - handles UI state (tabs, modals, filters)
3. **Display Components (Client)** - pure presentation, accept data as props

### Layers
- **Services**: `src/services/` - wraps all DB queries (Drizzle ORM)
- **Validations**: `src/lib/validations/` - Zod schemas
- **Server Actions**: `src/lib/actions/index.ts` - mutations
- **UI**: `src/components/ui/` - shadcn/ui primitives

### Conventions
- Always use `@/` path aliases
- Use `cn()` for Tailwind class merging
- Use `kebab-case.tsx` for files
- Server Components: NO "use client", NO hooks
- Client Components: MUST have "use client"

## Database Schema (Key Tables)
- `profiles` - Users/agents
- `buildings` -> `units` -> `listings` - Inventory hierarchy
- `leads` - Buyer leads (linked to `profiles`)
- `seller_leads` - Seller leads
- `visits` - Visit scheduling
- `visit_tours` - Tour grouping
- `contacts` - NEW universal identity layer (phone-based)
- `offers`, `communications`, `tasks`, `notes`, `audit_logs`

## Current State (as of sprint start)
- TypeScript compiles clean
- Login prerender fails at build (pre-existing, needs Supabase at build time)
- 5 runtime errors on page load (Buyers, Sellers, Visits, Listings, Offers)
- Migration 0002 (contacts table) generated but not yet applied
