
---

# Requirements Document: Jumbo-Core (Internal Operations Tool)

## 1. Executive Summary

**Project Name:** Jumbo-Core

**Objective:** A centralized internal operating system to manage the end-to-end lifecycle of real estate listings, buyer/seller leads, field operations, and agent performance via a gamified credit system.

---

## 2. Technical Stack (Finalized)

To ensure maximum speed, type safety, and compatibility with AI coding tools (Cursor), we are using:

* **Framework:** Next.js 14+ (App Router)
* **Database:** Supabase (PostgreSQL)
* **ORM:** **Drizzle ORM** (TypeScript-first schema management)
* **Visual Data Management:** **Drizzle Studio** (Visual CRUD for Admins)
* **UI/UX:** Tailwind CSS + Shadcn UI (Mobile-responsive for field agents)
* **Validation:** **Zod** (Inbound API schema validation)
* **Media:** Cloudinary (Automatic watermarking/processing)
* **Communications:** WhatsApp Business API & Exotel (Telephony/Call Recording) -- KAPSO https://github.com/gokapso/whatsapp-cloud-inbox

---

## 3. Core Modules & Workflows

### 3.1 Listing & Inventory Management

* **Hierarchy:** Building  Unit  Listing.
* **Data Capture:** Support for 40+ fields including:
* **Dimensions:** Area, BHK, Facing, Floor.
* **Financials:** Asking Price, Maintenance, Registration.
* **Legal:** OC, EC, Khata, Sale Deed
* **Media:** thumbnail, images, video, floor_plan
* **Geo-tagging:**  for precise map location.


* **Media Pipeline:** Raw photos uploaded  AI Enhancement  Cloudinary Watermarking.
* **Status Logic:** `Draft`  `Inspection Scheduled`  `Active` (Synced to website)  `Sold/Inactive`.

### 3.2 Lead Management (CRM) & Inbound APIs

* **API Ingestion:** Real-time endpoints to receive leads from **Housing.com**, **MagicBricks**, and **jumbohomes.in**.
* **Assignment Engine:** Automatic **Round Robin** distribution to agents based on territory.
* **Lifecycle:** `New`  `Contacted`  `Qualified`  `Active Visitor`  `Closed`.

### 3.3 Site Visit Logistics (Visit Tours)

* **Dispatching:** Dispatch agents group multiple visits into a **"Visit Tour"** (optimized route).
* **Execution:** Visit Agents use a mobile view to navigate.
* **Security:** Visits are marked "Completed" **only** upon entry of a 4-digit **Customer OTP**.

### 3.4 Communication & Interaction Timeline

* **Unified Log:** Centralized storage for all WhatsApp threads and Call Recordings.
* **Telephony:** Click-to-call via Exotel with mandatory recording links attached to the lead profile.

---

## 4. Performance Management (Jumbo-Coins)

A ledger-based gamification system to track agent productivity and calculate compensation.

| Event | Agent Role | Credit Change |
| --- | --- | --- |
| **Listing Approved** | Listing Agent | +50 Coins |
| **Visit Completed (OTP Verified)** | Visit Agent | +100 Coins |
| **Deal Closed** | Closing Agent | +500 Coins |
| **Missed Visit / No-Show** | Visit Agent | -50 Coins |
| **Lead Inactivity (>24h)** | Buyer Agent | -10 Coins |

> **Rule:** The `total_balance` in a profile is a cached value; the `credit_ledger` is the immutable source of truth.

---

## 5. User Roles & Permissions (RBAC)

| Role | Responsibility | Key Permissions |
| --- | --- | --- |
| **Super Admin** | System Governance | Full Access, API Config, User Management. |
| **Listing Agent** | Supply Management | Create/Edit Listings, Upload Media. |
| **Buyer Agent** | Lead Conversion | Manage Leads, WhatsApp, Call Logging. |
| **Visit Agent** | Field Operations | View Tours, Submit OTP, Submit Feedback. |
| **Dispatch Agent** | Logistics | Create Tours, Assign Route to Visit Agents. |

---

## 6. Implementation Sequence (Roadmap)

1. **Phase 1: Foundation:** Setup **Drizzle ORM** and define `schema.ts`. Run first migration to Supabase.
2. **Phase 2: Inbound API:** Build `POST /api/v1/leads` with **Zod** validation for Housing.com integration.
3. **Phase 3: Core CRM UI:** Build Listing and Lead management tables using **Shadcn UI**.
4. **Phase 4: Jumbo-Coins Engine:** Develop the ledger logic and automated triggers for coin updates.
5. **Phase 5: Field Ops:** Build the **Visit Tour** mobile interface and OTP verification flow.
6. **Phase 6: Comms Integration:** Link WhatsApp and Exotel webhooks to the Lead Timeline.

---

## 7. Development Guidelines for Cursor

* **Context:** Always refer to `@schema.ts` for database field names.
* **Safety:** Every API route must validate the `Request Body` using a Zod schema derived from the Drizzle table.
* **UI:** Use mobile-first design for Visit Agent views.
* **Logic:** Do not use hard deletes; use `deleted_at` timestamps for all primary entities.

---
