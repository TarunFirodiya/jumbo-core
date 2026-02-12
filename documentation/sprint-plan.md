# Jumbo CRM — Sprint Plan

**Created:** 2026-02-10
**Status:** Active
**Current state:** Core schema, RBAC, CRUD APIs, and basic UI shell are in place. Mock data removed. Auth working with Supabase + Drizzle.

---

## Sprint Overview

| Sprint | Focus | Duration | Dependencies |
|--------|-------|----------|-------------|
| **S1** | Complete UI flows per tab | 2 weeks | — |
| **S2** | WhatsApp (Kapso) + communication triggers | 2 weeks | S1 (partial) |
| **S3** | Lead gen APIs + trigger framework | 1 week | S2 |
| **S4** | Data migration | 1 week | S1 |
| **S5** | Go-live: environments, branching, CI/CD | 1 week | S4 |
| **S6** | AI enrichment, media uploads, automations | 2–3 weeks | S5 |
| **S7** | Broker mobile app | 3–4 weeks | S5 |

---

## S1 — Complete UI Flows Per Tab (2 weeks)

### Goal
Every tab (Buyers, Sellers, Listings, Visits, Offers, Settings) has working list → detail → create → edit → delete flows, with no mock data and full API integration.

### Tickets

#### Buyers Tab
- **S1-001** `[Buyers] Complete buyer lead detail page`
  - **Status:** Completed
  - Wire `/buyers/[id]` to show all lead fields from DB.
  - Priority: High | Estimate: 3 pts

- **S1-002** `[Buyers] Add edit-lead functionality`
  - **Status:** Deprioritized
  - Add inline edit or edit dialog on buyer detail page.
  - Call `PUT /api/v1/leads/[id]` with updated fields.
  - Priority: High | Estimate: 3 pts

- **S1-003** `[Buyers] Enhance new-lead-form with all schema fields`
  - Add missing fields: preference_json, locality, zone, budget range, timeline.
  - Priority: Medium | Estimate: 2 pts

- **S1-004** `[Buyers] Add delete/archive lead action`
  - Soft-delete via `DELETE /api/v1/leads/[id]`.
  - Add confirmation dialog and toast feedback.
  - Priority: Medium | Estimate: 1 pt

- **S1-005** `[Buyers] Wire kanban drag-and-drop to update lead status`
  - **Status:** Deleted
  - Kanban column changes call `PUT /api/v1/leads/[id]` with new status.
  - Priority: High | Estimate: 2 pts

#### New Features
- **S1-024** `[WhatsApp] Test Whatsapp Inbox Embed`
  - Add a new tab/iframe in the side panel for Kapso Inbox.
  - URL: `https://inbox.kapso.ai/embed/SzaGruLn0IOgxv9FaVAhQEwPUWCRDZOM5JkJSpTGTA4`
  - Priority: High | Estimate: 1 pt

#### Sellers Tab
- **S1-006** `[Sellers] Complete seller lead detail page`
  - **Status:** Completed
  - Wire `/sellers/[id]` to show all seller lead fields.
  - Priority: High | Estimate: 3 pts

- **S1-007** `[Sellers] Add edit seller lead functionality`
  - Edit dialog or inline editing on seller detail page.
  - Priority: High | Estimate: 3 pts

- **S1-008** `[Sellers] Enhance new-seller-form with all schema fields`
  - Add missing fields: secondary phone, source listing URL, drop reason.
  - Priority: Medium | Estimate: 2 pts

- **S1-009** `[Sellers] Add delete/archive seller lead action`
  - Soft-delete with confirmation dialog.
  - Priority: Medium | Estimate: 1 pt

#### Listings Tab
- **S1-010** `[Listings] Complete listing detail page with all fields`
  - **Status:** Completed
  - Wire listing detail to show fields.
  - Priority: High | Estimate: 3 pts

- **S1-011** `[Listings] Create edit-listing page/dialog`
  - Full edit form for listing fields: price, status, description, amenities, GTM fields.
  - Call `PUT /api/v1/listings/[id]`.
  - Priority: High | Estimate: 5 pts

- **S1-012** `[Listings] Complete listing wizard submission`
  - Verify the wizard correctly creates building → unit → listing via `POST /api/v1/listings`.
  - Handle owner creation via contacts service.
  - Ensure redirect and list refresh after creation.
  - Priority: High | Estimate: 2 pts

- **S1-013** `[Listings] Add listing status workflow UI`
  - Status transition buttons: draft → inspection_pending → active → sold/delisted.
  - Respect allowed transitions.
  - Priority: Medium | Estimate: 3 pts

#### Visits Tab
- **S1-014** `[Visits] Complete visit detail page`
  - Show all visit fields: scheduled time, status, visit agent, property, buyer.
  - Show OTP verification, location capture, feedback.
  - Priority: High | Estimate: 3 pts

- **S1-015** `[Visits] Add visit workflow actions`
  - Buttons: Confirm, Cancel (with reason), Reschedule, Complete (with OTP + location).
  - Call appropriate API endpoints.
  - Priority: High | Estimate: 5 pts

- **S1-016** `[Visits] Fix visit creation form`
  - Wire to real data: listing dropdown from API, lead dropdown from API, agent dropdown from API.
  - Priority: High | Estimate: 3 pts

#### Offers Tab
- **S1-017** `[Offers] Complete offers list page`
  - Fetch from `GET /api/v1/offers` and display in table and kanban.
  - Priority: High | Estimate: 3 pts

- **S1-018** `[Offers] Create new offer form`
  - Select listing, select buyer lead, enter amount, terms.
  - Call `POST /api/v1/offers`.
  - Priority: High | Estimate: 3 pts

- **S1-019** `[Offers] Add offer status actions`
  - Accept, Reject (with reason), Counter (with new amount).
  - Call `PUT /api/v1/offers/[id]`.
  - Priority: Medium | Estimate: 3 pts

#### Settings Tab
- **S1-020** `[Settings] Create team management page`
  - List team members from `GET /api/v1/agents`.
  - Add/edit team member roles.
  - Priority: Medium | Estimate: 3 pts

#### Shared Components
- **S1-021** `[Shared] Create reusable notes section component`
  - Polymorphic: works for leads, seller leads, listings, visits.
  - CRUD: add note, edit, delete.
  - Uses `POST/PUT/DELETE /api/v1/notes`.
  - Priority: High | Estimate: 3 pts

- **S1-022** `[Shared] Create activity timeline component`
  - Fetch from audit logs API.
  - Render chronological timeline with action descriptions.
  - Priority: Medium | Estimate: 3 pts

- **S1-023** `[Shared] Create media gallery component`
  - Display images grid with lightbox.
  - Upload placeholder (will be fully wired in S6).
  - Priority: Medium | Estimate: 2 pts

---

## S2 — WhatsApp (Kapso) Integration (2 weeks)

### Goal
Send and receive WhatsApp messages via Kapso API. Show conversations per lead/listing.

### Tickets

- **S2-001** `[WhatsApp] Design integration architecture`
  - Document Kapso API surface (auth, send, receive webhook, templates).
  - Design DB schema additions: `whatsapp_templates`, `whatsapp_messages`.
  - Priority: High | Estimate: 2 pts

- **S2-002** `[WhatsApp] Create Kapso service module`
  - `kapso-whatsapp.service.ts`: send template msg, send session msg, validate webhook.
  - Priority: High | Estimate: 3 pts

- **S2-003** `[WhatsApp] Create send message API`
  - `POST /api/v1/whatsapp/send` — send template or session message to a phone number.
  - Log message to DB.
  - Priority: High | Estimate: 3 pts

- **S2-004** `[WhatsApp] Create webhook receiver`
  - `POST /api/v1/whatsapp/webhook` — receive delivery receipts and incoming messages.
  - Store in `whatsapp_messages` table.
  - Priority: High | Estimate: 3 pts

- **S2-005** `[WhatsApp] Add "Send WhatsApp" button to detail pages`
  - Add entry point on buyer detail, seller detail, visit detail.
  - Template picker dialog.
  - Priority: Medium | Estimate: 3 pts

- **S2-006** `[WhatsApp] Create conversation timeline view`
  - Per-lead or per-contact message history.
  - Show sent, delivered, read, and incoming messages.
  - Priority: Medium | Estimate: 5 pts

- **S2-007** `[WhatsApp] Template management UI`
  - List/create/edit message templates in settings.
  - Priority: Low | Estimate: 3 pts

---

## S3 — Lead Gen APIs & Communication Triggers (1 week)

### Goal
Accept leads from external sources (Housing, 99acres, website). Fire automated messages on key events.

### Tickets

- **S3-001** `[LeadGen] Create Housing.com webhook endpoint`
  - `POST /api/v1/webhooks/housing` — parse Housing lead payload, create buyer lead.
  - Priority: High | Estimate: 3 pts

- **S3-002** `[LeadGen] Create 99acres webhook endpoint`
  - `POST /api/v1/webhooks/99acres` — parse and create buyer lead.
  - Priority: High | Estimate: 3 pts

- **S3-003** `[LeadGen] Create website form submission endpoint`
  - `POST /api/v1/webhooks/website` — public endpoint for jumbohomes.in contact form.
  - Priority: Medium | Estimate: 2 pts

- **S3-004** `[LeadGen] CSV bulk import for leads`
  - Upload CSV, parse, validate, bulk insert leads.
  - Priority: Medium | Estimate: 5 pts

- **S3-005** `[Triggers] Design event-driven trigger framework`
  - Define events: `lead_created`, `visit_scheduled`, `visit_completed`, `offer_created`, `status_changed`.
  - Define actions: send WhatsApp template, create task, log activity.
  - Store trigger configs in DB.
  - Priority: High | Estimate: 5 pts

- **S3-006** `[Triggers] Implement auto-message on lead creation`
  - When a new lead is created → send welcome WhatsApp template.
  - Priority: High | Estimate: 2 pts

- **S3-007** `[Triggers] Implement visit reminder messages`
  - 24h and 1h before scheduled visit → send reminder to buyer and agent.
  - Priority: Medium | Estimate: 3 pts

- **S3-008** `[Triggers] Implement post-visit follow-up`
  - After visit completed → send feedback request / next steps.
  - Priority: Medium | Estimate: 2 pts

---

## S4 — Data Migration (1 week)

### Goal
Migrate all existing operational data into the new schema. Validate integrity.

### Tickets

- **S4-001** `[Migration] Audit existing data sources and create field mapping`
  - Map source columns → target tables/columns for: contacts, leads, seller_leads, buildings, units, listings, visits, offers, team.
  - Priority: High | Estimate: 3 pts

- **S4-002** `[Migration] Write migration script: team members`
  - Import existing agents/team with correct roles.
  - Priority: High | Estimate: 2 pts

- **S4-003** `[Migration] Write migration script: contacts + leads`
  - Deduplicate by phone. Create contacts, then buyer leads.
  - Priority: High | Estimate: 3 pts

- **S4-004** `[Migration] Write migration script: buildings + units + listings`
  - Import buildings, create units, create listings with correct status.
  - Priority: High | Estimate: 3 pts

- **S4-005** `[Migration] Write migration script: seller leads`
  - Import seller leads linked to contacts and buildings.
  - Priority: High | Estimate: 2 pts

- **S4-006** `[Migration] Write migration script: visits + offers`
  - Import historical visits and offers.
  - Priority: Medium | Estimate: 2 pts

- **S4-007** `[Migration] Dry run & validation`
  - Run in dev environment. Validate counts, spot-check records, check FK integrity.
  - Priority: High | Estimate: 3 pts

---

## S5 — Go-Live: Environments, Branching, CI/CD (1 week)

### Goal
Production-ready infrastructure with proper environments and deployment pipeline.

### Tickets

- **S5-001** `[Infra] Set up dev Supabase project + Postgres`
  - Separate Supabase project for development.
  - Configure env files.
  - Priority: High | Estimate: 2 pts

- **S5-002** `[Infra] Set up production Supabase project + Postgres`
  - Production Supabase project.
  - Configure RLS policies for production security.
  - Priority: High | Estimate: 3 pts

- **S5-003** `[Infra] Implement branching model`
  - `main` → production, `develop` → integration.
  - Protect `main` with required PR reviews.
  - Priority: High | Estimate: 1 pt

- **S5-004** `[Infra] Set up CI pipeline`
  - GitHub Actions: lint, type-check, build, DB migration dry-run on every PR.
  - Priority: High | Estimate: 3 pts

- **S5-005** `[Infra] Set up CD pipeline`
  - Auto-deploy `main` to production (Vercel or similar).
  - Auto-deploy `develop` to dev/staging.
  - Priority: High | Estimate: 3 pts

- **S5-006** `[Infra] Add Supabase RLS policies for team table`
  - Fix the RLS issue that was blocking middleware role checks.
  - Allow authenticated users to read their own team record.
  - Priority: High | Estimate: 2 pts

- **S5-007** `[Infra] Run production data migration`
  - Execute validated migration scripts against production DB.
  - Post-migration validation.
  - Priority: High | Estimate: 2 pts

---

## S6 — AI Enrichment, Media Uploads, Automations (2–3 weeks)

### Goal
Add intelligence and automation: AI-powered lead scoring, proper media storage, scheduled communications.

### Tickets

- **S6-001** `[AI] Lead qualification scoring`
  - Use LLM/rules engine to score leads based on activity, budget, timeline.
  - Store score on lead record.
  - Surface in UI (badge/indicator on lead cards).
  - Priority: Medium | Estimate: 5 pts

- **S6-002** `[AI] Interaction summaries`
  - Summarize communication timeline (notes + WhatsApp + visits) into a 2–3 sentence digest.
  - Display on lead detail page.
  - Priority: Medium | Estimate: 3 pts

- **S6-003** `[AI] Suggested next actions`
  - Based on lead status, last activity, and time elapsed → suggest follow-up action.
  - Priority: Low | Estimate: 3 pts

- **S6-004** `[Media] Set up Supabase Storage buckets`
  - Buckets: `listing-images`, `inspection-photos`, `catalogue-assets`, `documents`.
  - Configure access policies.
  - Priority: High | Estimate: 2 pts

- **S6-005** `[Media] Implement signed upload URLs`
  - `POST /api/v1/media/upload-url` — generate presigned upload URL.
  - After upload, create `media_items` record.
  - Priority: High | Estimate: 3 pts

- **S6-006** `[Media] Wire listing wizard image upload to storage`
  - Replace local preview-only with real upload to Supabase Storage.
  - Store URLs in listing record.
  - Priority: High | Estimate: 3 pts

- **S6-007** `[Automation] Build scheduled job runner`
  - Cron / queue system for: follow-up reminders, visit reminders, stale lead nudges.
  - Priority: Medium | Estimate: 5 pts

- **S6-008** `[Automation] Stale lead follow-up reminders`
  - If no activity in X days → notify assigned agent via WhatsApp or in-app.
  - Priority: Medium | Estimate: 3 pts

- **S6-009** `[Automation] Auto-status transitions`
  - E.g., visit completed + positive feedback → auto-suggest "move to offer stage".
  - Priority: Low | Estimate: 3 pts

---

## S7 — Broker Mobile App (3–4 weeks)

### Goal
A mobile app for field agents: daily tasks, quick lead entry, visit management, WhatsApp triggers.

### Tickets

- **S7-001** `[Mobile] Set up React Native + Expo project`
  - Initialize project, configure auth with Supabase.
  - Shared API client for all endpoints.
  - Priority: High | Estimate: 3 pts

- **S7-002** `[Mobile] Auth: login, session management, logout`
  - Supabase Auth with secure token storage.
  - Auto-refresh, biometric unlock (stretch).
  - Priority: High | Estimate: 3 pts

- **S7-003** `[Mobile] Today's tasks screen`
  - Show: scheduled visits, follow-up reminders, pending actions.
  - Pull from visits + leads APIs filtered by assigned agent.
  - Priority: High | Estimate: 5 pts

- **S7-004** `[Mobile] Quick lead creation`
  - Minimal form: name, phone, source. Auto-assign to current agent.
  - Priority: High | Estimate: 3 pts

- **S7-005** `[Mobile] Visit flow: navigate, check-in, OTP, feedback`
  - Map link to property, GPS check-in, OTP verification, post-visit feedback form.
  - Priority: High | Estimate: 5 pts

- **S7-006** `[Mobile] Listing browse & shortlist`
  - Search/filter listings. Add to buyer shortlist. Share via WhatsApp.
  - Priority: Medium | Estimate: 5 pts

- **S7-007** `[Mobile] Notes & photos capture`
  - Quick note entry and photo capture during visits.
  - Upload to Supabase Storage.
  - Priority: Medium | Estimate: 3 pts

- **S7-008** `[Mobile] Push notifications`
  - New lead assigned, visit reminder, offer update.
  - Priority: Medium | Estimate: 3 pts

- **S7-009** `[API] Document all endpoints with OpenAPI spec`
  - Generate OpenAPI / Swagger docs for mobile team reference.
  - Priority: High | Estimate: 3 pts

---

## Appendix: Ticket Summary

| Sprint | Tickets | Total Points |
|--------|---------|-------------|
| S1 — UI Flows | 23 | ~62 pts |
| S2 — WhatsApp | 7 | ~22 pts |
| S3 — Lead Gen & Triggers | 8 | ~25 pts |
| S4 — Data Migration | 7 | ~18 pts |
| S5 — Go-Live & Infra | 7 | ~16 pts |
| S6 — AI & Media & Automation | 9 | ~30 pts |
| S7 — Mobile App | 9 | ~33 pts |
| **Total** | **70** | **~206 pts** |

---

## Conventions

- **Priority**: High = blocks other work or user-facing. Medium = important but not blocking. Low = nice-to-have.
- **Estimates**: Fibonacci points (1, 2, 3, 5, 8). 1 pt ≈ 2–3 hours. 5 pts ≈ 1–2 days.
- **Labels**: Use sprint prefix (S1, S2, ...) and area tag ([Buyers], [Listings], [WhatsApp], etc.) in Linear.
