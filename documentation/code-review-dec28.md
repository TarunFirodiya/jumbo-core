# Code Review & Architecture Assessment
**Date:** 2025-01-27  
**Project:** Jumbo-Core CRM  
**Review Scope:** Codebase analysis against roadmap and requirements

---

## Executive Summary

The codebase shows **strong UI foundation** with modern React/Next.js patterns, but **critical gaps** exist in:
1. **Server Actions** - Missing core CRUD operations for listings and leads
2. **Data Integration** - Many components still use mock data
3. **Authentication** - Partially implemented (commented out in many places)
4. **Business Logic** - Jumbo-Coins, round-robin assignment, OTP verification not implemented
5. **API Completeness** - Several endpoints missing per roadmap

**Overall Status:** ~40% complete against roadmap

---

## 1. Roadmap Progress Analysis

### Phase 1: Inventory Management ⚠️ **PARTIAL**

#### ✅ Completed:
- [x] Listing List View UI (`/listings`)
- [x] Create Listing Wizard UI (`/listings/new`)
- [x] Schema updates (images, listing_agent_id, amenities_json)
- [x] Migration run
- [x] Public API endpoint (`GET /api/v1/listings/active`)

#### ❌ Missing:
- [ ] **CRITICAL:** Server Actions for listings:
  - `createBuilding(data)` - Not implemented
  - `createUnit(data)` - Not implemented
  - `upsertListing(data)` - Not implemented (wizard just logs to console)
  - `updateListingStatus(id, status)` - Not implemented
- [ ] Edit Listing page (`/listings/[id]/edit`)
- [ ] `PATCH /api/v1/listings/{id}` endpoint

**Impact:** Listing wizard is non-functional - users cannot actually create listings.

---

### Phase 2: CRM & Lead Management ⚠️ **PARTIAL**

#### ✅ Completed:
- [x] Leads List View UI (`/buyers`)
- [x] Lead Detail View UI (`/buyers/[id]`) - **Connected to DB** ✅
- [x] Schema updates (last_contacted_at, communications table)
- [x] Inbound API (`POST /api/v1/leads`) with webhook support
- [x] GET endpoint for leads

#### ❌ Missing:
- [ ] **CRITICAL:** Server Actions:
  - `createLead(data)` - Manual lead entry (UI uses API endpoint, but no server action)
  - `assignLead(leadId, agentId)` - Round Robin logic not implemented
  - `updateLeadStatus(id, status)` - Partial (updateBuyer exists but incomplete)
  - `logCommunication(data)` - Not implemented
- [ ] Activity timeline in detail view uses hardcoded data
- [ ] Tasks integration missing

**Impact:** Lead management is partially functional but missing key workflows.

---

### Phase 3: Field Operations 🚧 **MINIMAL**

#### ✅ Completed:
- [x] Visits Management UI (`/visits`)
- [x] Schema updates (otp_code, completed_at, feedback_text)

#### ❌ Missing:
- [ ] Tour Dispatch UI (`/tours/dispatch`)
- [ ] Agent Tour View (`/tours`)
- [ ] Server Actions:
  - `createTour(data)`
  - `verifyVisitOTP(visitId, otp, geoData)`
  - `updateVisitStatus(id, status)`

**Impact:** Visit tours cannot be created or executed.

---

### Phase 4: Jumbo-Coins ❌ **NOT STARTED**

#### ✅ Completed:
- [x] Schema (credit_ledger, credit_rules tables)

#### ❌ Missing:
- [ ] All UI components (dashboard widget, leaderboard, admin report)
- [ ] Core logic: `awardCoins(agentId, actionType, referenceId)`
- [ ] Automatic triggers for coin awards
- [ ] Balance calculation/caching

**Impact:** Performance management system completely missing.

---

### Phase 5: Communications Integration ❌ **NOT STARTED**

#### ✅ Completed:
- [x] Schema (communications table)
- [x] Mock services exist

#### ❌ Missing:
- [ ] WhatsApp Business API integration
- [ ] Exotel telephony integration
- [ ] Webhook handlers
- [ ] Click-to-call functionality

**Impact:** No real communication tracking.

---

### Phase 6: Polish & Launch ❌ **NOT STARTED**

- [ ] RBAC verification across all routes
- [ ] Mobile responsiveness audit
- [ ] Error handling & loading states
- [ ] Seed data for demo/testing
- [ ] Production deployment checklist

---

## 2. Architecture Issues

### 2.1 Data Fetching Patterns ⚠️ **INCONSISTENT**

**Problem:** Mixed patterns across the codebase:
- Some pages use Server Components with direct DB queries ✅ (e.g., `/buyers/[id]`)
- Some components use client-side fetch to API routes (e.g., `new-lead-form.tsx`)
- Many components still use mock data (e.g., `listings-table.tsx`, `listings-kanban.tsx`)

**Files Using Mock Data:**
- `src/components/listings/listings-table.tsx` - Uses `mockListings`
- `src/components/listings/listings-kanban.tsx` - Uses `mockListings`
- `src/components/visits/visits-kanban.tsx` - Uses mock data
- `src/components/offers/offers-table.tsx` - Uses mock data
- `src/components/dashboard/deals-table.tsx` - Uses mock data

**Recommendation:**
- Convert all list views to Server Components with direct DB queries
- Use Server Actions for mutations (not API routes from client)
- Remove all mock data imports

---

### 2.2 Server Actions ⚠️ **UNDERDEVELOPED**

**Current State:**
- `src/lib/actions/index.ts` has only 3 functions:
  - `updateBuyer()` - Uses `any` type, incomplete
  - `updateSeller()` - Uses `any` type
  - `updateVisit()` - Uses `any` type

**Missing Critical Actions:**
```typescript
// Phase 1 - Inventory
createBuilding(data)
createUnit(data)
upsertListing(data) // Transaction: Building → Unit → Listing
updateListingStatus(id, status)

// Phase 2 - CRM
createLead(data)
assignLead(leadId, agentId) // With round-robin logic
updateLeadStatus(id, status)
logCommunication(data)

// Phase 3 - Visits
createTour(data)
verifyVisitOTP(visitId, otp, geoData)
updateVisitStatus(id, status)

// Phase 4 - Coins
awardCoins(agentId, actionType, referenceId)
```

**Issues:**
- Type safety: Using `any` instead of Zod-validated types
- No transaction handling for complex operations (Building → Unit → Listing)
- No error boundaries or proper error handling

---

### 2.3 Authentication & Authorization ⚠️ **INCOMPLETE**

**Current State:**
- Middleware exists but only protects `/settings` routes
- Most API routes have auth checks **commented out**:
  ```typescript
  // if (!user) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }
  ```
- RBAC only defined for 4 routes in middleware
- No role checks in Server Actions

**Files with Commented Auth:**
- `src/app/api/v1/audit-logs/route.ts`
- `src/app/api/v1/seller-leads/route.ts`
- `src/app/api/v1/sellers/route.ts`

**Recommendation:**
- Enable authentication on all API routes
- Add RBAC checks to Server Actions
- Protect all dashboard routes in middleware
- Create auth helper utilities

---

### 2.4 Type Safety ⚠️ **WEAK**

**Issues:**
- Server Actions use `any` types:
  ```typescript
  export async function updateBuyer(id: string, data: any) // ❌
  ```
- Missing Zod validation in Server Actions
- Some components use loose types

**Recommendation:**
- Replace all `any` with proper Zod schemas
- Validate all Server Action inputs
- Use TypeScript strict mode

---

### 2.5 Error Handling ⚠️ **INCONSISTENT**

**Current State:**
- API routes have try/catch but return generic errors
- Server Actions have basic error handling
- No error boundaries in React components
- No loading states in many places

**Recommendation:**
- Add error boundaries
- Standardize error response format
- Add loading skeletons
- Implement retry logic for critical operations

---

## 3. File Structure Issues

### 3.1 Nested Directory ⚠️ **POTENTIAL ISSUE**

**Found:** Project layout shows `jumbo-web/jumbo-web/` nested structure, but glob search found 0 files. This might be a stale reference or build artifact.

**Recommendation:** Verify if this exists and remove if unnecessary.

---

### 3.2 Mock Services Location ✅ **GOOD**

Mock services are properly organized in `src/lib/services/mock/` and can be replaced incrementally.

---

### 3.3 Validation Schemas ✅ **GOOD**

Validation schemas are well-organized in `src/lib/validations/` with proper Zod usage.

---

## 4. Code Quality Issues

### 4.1 Listing Wizard - Non-Functional ❌ **CRITICAL**

**File:** `src/components/listings/wizard/listing-wizard.tsx`

**Issue:** The wizard collects data but doesn't save to database:
```typescript
const handleSubmit = () => {
  // In a real app, this would call a server action to create the listing
  console.log("Creating listing:", { building, unit, listing });
  resetWizard();
  router.push("/listings");
};
```

**Impact:** Users cannot create listings through the UI.

**Fix Required:** Implement `upsertListing` server action with transaction.

---

### 4.2 Buyer Detail View - Partial Integration ⚠️

**File:** `src/components/buyers/detail/buyer-detail-view.tsx`

**Issues:**
- Activity log is hardcoded (only shows "Lead Created")
- Next follow-up shows "Pending" (not from tasks)
- Some fields like "timeline" and "type" are hardcoded

**Fix Required:** Fetch real data from:
- `communications` table for activity
- `tasks` table for follow-ups
- `requirementJson` for preferences

---

### 4.3 API Route Inconsistencies ⚠️

**Issues:**
1. **Authentication:** Some routes check auth, others don't
2. **Response Format:** Inconsistent structure:
   - Some return `{ data: ... }`
   - Some return `{ data: ..., message: "..." }`
   - Some return direct objects
3. **Error Handling:** Different error formats

**Recommendation:** Standardize API response format:
```typescript
// Success
{ data: T, message?: string }

// Error
{ error: string, message: string, details?: unknown }
```

---

## 5. Missing Features (Per Requirements)

### 5.1 Round-Robin Lead Assignment ❌

**Requirement:** Automatic distribution of leads to agents based on territory.

**Status:** Not implemented. `POST /api/v1/leads` creates leads but doesn't assign agents.

**Required:** Implement `assignLead()` with round-robin logic.

---

### 5.2 OTP Verification for Visits ❌

**Requirement:** Visits marked "Completed" only upon 4-digit customer OTP entry.

**Status:** Schema has `otpCode` field, but no verification logic.

**Required:** Implement `verifyVisitOTP()` server action.

---

### 5.3 Jumbo-Coins System ❌

**Requirement:** Gamified performance tracking with automatic coin awards.

**Status:** Schema exists, but no business logic.

**Required:**
- Implement `awardCoins()` function
- Add triggers for automatic awards
- Create UI components
- Implement balance calculation

---

### 5.4 Communication Timeline ❌

**Requirement:** Unified log of WhatsApp threads and call recordings.

**Status:** Schema exists, but no integration with real services.

**Required:**
- WhatsApp Business API integration
- Exotel telephony integration
- Webhook handlers
- Timeline UI component

---

## 6. Security Concerns

### 6.1 API Key Management ⚠️

**Current:** `POST /api/v1/leads` uses `x-api-key` header (good for webhooks).

**Issue:** API key is likely hardcoded in environment. Should use Supabase secrets or similar.

---

### 6.2 SQL Injection Risk ✅ **LOW**

**Status:** Using Drizzle ORM with parameterized queries - safe.

---

### 6.3 RBAC Gaps ⚠️

**Issue:** Only 4 routes protected in middleware. Many dashboard routes unprotected.

**Recommendation:** Add all dashboard routes to `PROTECTED_ROUTES` and implement role checks.

---

## 7. Performance Considerations

### 7.1 Database Queries ⚠️

**Issues:**
- Some queries might be missing indexes (need to verify)
- No query optimization visible
- No pagination in some list views

**Recommendation:**
- Add database indexes for frequently queried fields
- Implement proper pagination everywhere
- Use Drizzle's query optimization features

---

### 7.2 Client-Side Data Fetching ⚠️

**Issue:** Some components fetch data on client side, causing waterfall requests.

**Recommendation:** Move to Server Components where possible.

---

## 8. Recommendations (Priority Order)

### 🔴 **CRITICAL (Blocking Core Functionality)**

1. **Implement Listing Creation Server Actions**
   - `createBuilding()`, `createUnit()`, `upsertListing()`
   - Fix listing wizard to actually save data
   - **Impact:** Users cannot create listings

2. **Connect List Views to Database**
   - Replace mock data in `listings-table.tsx`, `listings-kanban.tsx`
   - Convert to Server Components
   - **Impact:** Users see stale/fake data

3. **Enable Authentication**
   - Uncomment auth checks in API routes
   - Add auth to Server Actions
   - Protect all dashboard routes
   - **Impact:** Security vulnerability

---

### 🟡 **HIGH (Missing Key Features)**

4. **Implement Lead Management Server Actions**
   - `createLead()`, `assignLead()`, `updateLeadStatus()`, `logCommunication()`
   - Connect activity timeline to real data
   - **Impact:** Incomplete CRM functionality

5. **Implement Visit Tour System**
   - `createTour()`, `verifyVisitOTP()`, `updateVisitStatus()`
   - Build dispatch and agent tour UIs
   - **Impact:** Field operations cannot function

6. **Fix Type Safety**
   - Replace `any` types with Zod schemas
   - Add validation to all Server Actions
   - **Impact:** Runtime errors, poor DX

---

### 🟢 **MEDIUM (Enhancements)**

7. **Implement Jumbo-Coins System**
   - Core `awardCoins()` function
   - Automatic triggers
   - UI components
   - **Impact:** Performance management missing

8. **Standardize API Responses**
   - Create response utility functions
   - Consistent error handling
   - **Impact:** Better DX, easier debugging

9. **Add Error Boundaries & Loading States**
   - React error boundaries
   - Loading skeletons
   - **Impact:** Better UX

---

### 🔵 **LOW (Polish)**

10. **Communications Integration**
    - WhatsApp & Exotel APIs
    - Webhook handlers
    - **Impact:** Manual communication tracking

11. **Mobile Responsiveness Audit**
    - Test all views on mobile
    - Fix layout issues
    - **Impact:** Field agents need mobile-first

12. **Production Readiness**
    - Environment variable validation
    - Error logging setup
    - Performance monitoring
    - **Impact:** Deployment readiness

---

## 9. Positive Highlights ✅

1. **Schema Design:** Well-structured Drizzle schema with proper relations
2. **UI Components:** Modern, consistent Shadcn UI usage
3. **Type Exports:** Good TypeScript type exports from schema
4. **Validation:** Proper Zod validation in API routes
5. **File Organization:** Clear separation of concerns
6. **Migration System:** Drizzle migrations properly set up

---

## 10. Next Steps

### Immediate (This Sprint)
1. Implement `upsertListing` server action with transaction
2. Connect listing wizard to database
3. Replace mock data in listings table/kanban
4. Enable authentication on all API routes

### Short Term (Next Sprint)
5. Implement all Phase 1 & 2 server actions
6. Connect buyer detail view to real data
7. Add type safety to all server actions
8. Implement round-robin lead assignment

### Medium Term
9. Build visit tour system (Phase 3)
10. Implement Jumbo-Coins (Phase 4)
11. Add error boundaries and loading states
12. Complete RBAC implementation

---

## Appendix: Files Requiring Immediate Attention

### Critical Fixes Needed:
- `src/components/listings/wizard/listing-wizard.tsx` - Add server action call
- `src/lib/actions/index.ts` - Add all missing server actions
- `src/components/listings/listings-table.tsx` - Replace mock data
- `src/components/listings/listings-kanban.tsx` - Replace mock data
- `src/app/api/v1/*/route.ts` - Enable authentication

### Mock Data to Remove:
- `src/mock-data/listings.ts` - Replace with DB queries
- `src/mock-data/buyers.ts` - Replace with DB queries
- `src/mock-data/visits.ts` - Replace with DB queries
- `src/mock-data/offers.ts` - Replace with DB queries

---

**Review Completed:** 2025-01-27  
**Next Review:** After implementing critical fixes

