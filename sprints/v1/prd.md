# PRD: Fix Runtime Errors Sprint

**Sprint:** v1
**Goal:** All 5 dashboard pages (Buyers, Sellers, Visits, Listings, Offers) load without crashing
**Verification:** `curl` each page via dev server OR playwright smoke test

---

## Root Cause Analysis

### Single Root Cause for ALL 5 Page Crashes

The Drizzle schema (`src/lib/db/schema.ts`) defines 3 new columns that **do not yet exist** in the production database:

| Column | Table | Schema Line | Added By |
|--------|-------|-------------|----------|
| `contact_id` | `profiles` | 231 | Migration 0002 |
| `contact_id` | `leads` | 374 | Migration 0002 |
| `contact_id` | `seller_leads` | 421 | Migration 0002 |

Plus the `contacts` table itself (lines 207-216) and the `contact_type` enum (lines 197-201).

**How this causes crashes:** Drizzle's `db.query.*.findMany()` (relational query API) generates `SELECT` statements that include **every column** defined in the schema. When the schema says `contact_id` exists but the DB column doesn't, PostgreSQL throws:

```
PostgresError: column "leads"."contact_id" does not exist
```

**Why `count(*)` queries DON'T crash:** The `db.select({ count: sql`count(*)` }).from(table)` queries only select the explicit aggregate, not all columns.

### Affected Pages (all 5 crash)

| Page | Service Call | Fails Because |
|------|-------------|---------------|
| `/buyers` | `leadService.getLeads()` | SELECTs from `leads` (missing `contact_id`) and `profiles` (missing `contact_id`) |
| `/sellers` | `sellerLeadService.getSellerLeads()` | SELECTs from `seller_leads` (missing `contact_id`) and `profiles` (missing `contact_id`) |
| `/visits` | `visitService.getVisits()` | Nested: loads `leads` and `profiles` via `with:` relations |
| `/listings` | `listingService.getListings()` | Loads `profiles` for `listingAgent` and `zoneLead` |
| `/offers` | `offerService.getOffers()` | Loads `leads`, `profiles` via `with:` relations |

### Secondary Issues (non-crash, logic bugs)

| # | Page | Issue | Severity |
|---|------|-------|----------|
| S1 | Sellers | `eq(listings.status, "inspection_pending")` - status value never set, stat always 0 | MEDIUM |
| S2 | Listings | `soldThisMonth` computed from `createdAt` not `soldAt`, and only from first 100 rows | LOW |

---

## Task Breakdown (Atomic, 5-10 min each)

### Task 1: Apply Migration 0002 to Database
**Time:** 5 min
**File:** `drizzle/0002_keen_polaris.sql`
**Action:**
1. Run `npx drizzle-kit migrate` from `jumbo-web/` directory
2. If drizzle-kit migrate fails, fall back to: `psql "$DATABASE_URL" -f drizzle/0002_keen_polaris.sql`
3. Verify by querying: `SELECT column_name FROM information_schema.columns WHERE table_name = 'contacts'`

**Verification:**
```bash
# Should return columns: id, phone, name, email, type, metadata, created_at, updated_at
```

**This single task fixes ALL 5 page crashes.**

---

### Task 2: Verify Buyers Page Loads
**Time:** 5 min
**Action:**
1. Start dev server (`npx next dev`)
2. Log in via browser (or use `curl` with auth cookie)
3. Navigate to `/buyers`
4. Confirm: page renders, stats show numbers, table shows lead rows

**Verification:** HTTP 200, no error in terminal, page renders data table

---

### Task 3: Verify Sellers Page Loads
**Time:** 5 min
**Action:**
1. Navigate to `/sellers`
2. Confirm: page renders, stats cards show, seller leads table loads

**Verification:** HTTP 200, no error in terminal

---

### Task 4: Verify Visits Page Loads
**Time:** 5 min
**Action:**
1. Navigate to `/visits`
2. Confirm: page renders, visits list/cards show

**Verification:** HTTP 200, no error in terminal

---

### Task 5: Verify Listings Page Loads
**Time:** 5 min
**Action:**
1. Navigate to `/listings`
2. Confirm: page renders, listing cards/table shows

**Verification:** HTTP 200, no error in terminal

---

### Task 6: Verify Offers Page Loads
**Time:** 5 min
**Action:**
1. Navigate to `/offers`
2. Confirm: page renders, kanban/table shows

**Verification:** HTTP 200, no error in terminal

---

### Task 7: Fix Seller Stats Logic Bug (S1)
**Time:** 10 min
**File:** `src/services/seller-lead.service.ts`, line ~277
**Action:**
1. Check what valid listing statuses exist (`draft`, `active`, `sold`, etc.)
2. Replace `"inspection_pending"` with the correct status for listings pending inspection (likely filter by `homeInspections` table instead)
3. Or: query `homeInspections` table with status `"pending"` count

**Verification:** `inspectionPending` stat on `/sellers` shows correct count (or 0 if no pending inspections exist, verified by DB query)

---

### Task 8: Automated Smoke Test (Optional)
**Time:** 10 min
**Action:**
1. Install playwright if needed: `npx playwright install chromium`
2. Create `tests/smoke.spec.ts` that:
   - Logs in
   - Visits all 5 pages
   - Asserts no error state rendered
   - Asserts key elements (data table, stats cards) are visible

**Verification:** `npx playwright test tests/smoke.spec.ts` passes

---

## Execution Order

```
Task 1 (apply migration) --> Tasks 2-6 (verify in parallel) --> Task 7 (fix logic bug) --> Task 8 (smoke test)
```

**Total estimated time:** 30-45 minutes

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Migration 0002 fails (column already exists partially) | LOW | Use `IF NOT EXISTS` or check error output, apply remaining statements manually |
| Auth blocks curl verification | MEDIUM | Temporarily bypass middleware for testing, or use browser with saved session |
| Drizzle-kit migrate doesn't recognize 0002 as pending | LOW | Apply SQL directly via psql |

---

## Success Criteria

- [ ] All 5 pages load without runtime errors
- [ ] `contacts` table exists in database with correct schema
- [ ] `contact_id` column exists on `profiles`, `leads`, `seller_leads`
- [ ] Stats on sellers page show meaningful values (not always 0 for inspections)
