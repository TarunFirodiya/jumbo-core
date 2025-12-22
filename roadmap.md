# Jumbo-Core Development Roadmap

> **Approach**: UI-Driven Schema — Design visuals first, extract data contracts, then build APIs.

---

## Legend
- [ ] Not Started
- [~] In Progress
- [x] Completed

---

## Phase 1: Inventory Management (Priority)
**Goal**: Enable Agents to input and manage Buildings, Units, and Listings.

### 1.1 UI Discovery
- [x] Listing List View (`/listings`)
  - [x] Data table with columns: Image, Unit #, Building, Price, Status, Owner
  - [x] Filters: Status (Draft/Active/Sold), Building, Price Range
  - [x] Pagination & sorting
- [x] Create Listing Wizard (`/listings/new`)
  - [x] Step 1: Building Selection (Search or Create New)
  - [x] Step 2: Unit Details (Floor, BHK, Carpet Area, Owner)
  - [x] Step 3: Listing Specifics (Price, Images, Amenities)
- [ ] Edit Listing (`/listings/[id]/edit`)

### 1.2 Schema Updates
- [x] Add `images` field to `listings` table
- [x] Add `listing_agent_id` to track who created the listing
- [x] Verify `amenities_json` structure for UI checkboxes
- [x] Run migration

### 1.3 Server Actions
- [ ] `createBuilding(data)` — Insert new building
- [ ] `createUnit(data)` — Insert new unit under a building
- [ ] `upsertListing(data)` — Transaction: Building → Unit → Listing
- [ ] `updateListingStatus(id, status)` — Status transitions

### 1.4 API Endpoints
- [x] `GET /api/v1/listings/active` — Public listings for jumbohomes.in
- [ ] `PATCH /api/v1/listings/{id}` — Update listing status

---

## Phase 2: CRM & Lead Management
**Goal**: Manage incoming leads and their journey through the sales funnel.

### 2.1 UI Discovery
- [ ] Leads List View (`/leads`)
  - [ ] Table/Kanban view toggle
  - [ ] Columns: Name, Phone, Source, Status, Assigned Agent, Created
  - [ ] Filters: Status, Source, Agent, Date Range
- [ ] Lead Detail View (`/leads/[id]`)
  - [ ] Profile card with contact info & requirements
  - [ ] Timeline: Communications, Tasks, Visits
  - [ ] Quick Actions: Log Call, Send WhatsApp, Create Task

### 2.2 Schema Updates
- [x] Verify `communications` table supports call logs and notes
- [x] Add `last_contacted_at` to `leads` for follow-up tracking

### 2.3 Server Actions
- [ ] `createLead(data)` — Manual lead entry
- [ ] `assignLead(leadId, agentId)` — Round Robin or manual assignment
- [ ] `updateLeadStatus(id, status)` — Status transitions
- [ ] `logCommunication(data)` — Add call/message to timeline

### 2.4 API Endpoints
- [x] `POST /api/v1/leads` — Webhook for Housing.com, MagicBricks
- [x] `GET /api/v1/leads` — List leads with filters

---

## Phase 3: Field Operations (Visit Tours)
**Goal**: Mobile-first experience for field agents conducting property visits.

### 3.1 UI Discovery
- [ ] Tour Dispatch (`/tours/dispatch`) — For Dispatch Agents
  - [ ] Calendar view of scheduled tours
  - [ ] Create Tour: Select visits, assign field agent
  - [ ] Map preview with optimized route
- [ ] Agent Tour View (`/tours`) — For Field Agents
  - [ ] Today's tour with waypoint list
  - [ ] Visit card: Property details, customer contact, directions
  - [ ] OTP verification input

### 3.2 Schema Updates
- [ ] Add `otp_verified_at` timestamp to `visits`
- [ ] Add `agent_notes` to `visits` for field feedback

### 3.3 Server Actions
- [ ] `createTour(data)` — Group visits into a tour
- [ ] `verifyVisitOTP(visitId, otp, geoData)` — Complete visit with verification
- [ ] `updateVisitStatus(id, status)` — Cancel/No-show handling

---

## Phase 4: Jumbo-Coins & Performance
**Goal**: Gamified performance tracking with credit ledger system.

### 4.1 UI Discovery
- [ ] Agent Dashboard Widget — Current coin balance, recent transactions
- [ ] Leaderboard (`/leaderboard`) — Top performers by coins
- [ ] Admin Coin Report (`/admin/coins`) — Ledger entries by agent/month

### 4.2 Logic Implementation
- [ ] `awardCoins(agentId, actionType, referenceId)` — Core helper
- [ ] Triggers for automatic coin awards:
  - [ ] Inspection Approved: +50 coins
  - [ ] Visit Completed (OTP): +100 coins
  - [ ] Deal Closed: +1000 coins
  - [ ] Missed Visit: -50 coins
  - [ ] No Follow-up > 24h: -10 coins/day

---

## Phase 5: Communications Integration
**Goal**: Unified timeline of all customer interactions.

### 5.1 WhatsApp Business API
- [ ] Replace mock service with live API
- [ ] Webhook handler for incoming messages
- [ ] Template message sending

### 5.2 Exotel Telephony
- [ ] Replace mock service with live API
- [ ] Click-to-call from Lead detail
- [ ] Call recording webhook handler

---

## Phase 6: Polish & Launch
- [ ] RBAC: Verify all routes respect role permissions
- [ ] Mobile responsiveness audit
- [ ] Error handling & loading states
- [ ] Seed data for demo/testing
- [ ] Production deployment checklist

---

## Current Sprint Focus
> **Sprint 1**: Inventory Management UI (Phase 1.1)
> - Listings List View
> - Create Listing Wizard

