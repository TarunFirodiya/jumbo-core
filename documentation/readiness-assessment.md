# Database Schema Migration & Integration - Readiness Assessment

**Date:** 2025-01-27  
**Status:** ⚠️ **PARTIALLY READY** - Foundation is solid, but significant implementation work remains

---

## Executive Summary

The codebase has a **strong foundation** with:
- ✅ Complete database schema migration
- ✅ All validation schemas created
- ✅ Type definitions exported
- ✅ Basic API routes for core entities

However, **critical gaps** exist in:
- ❌ Missing API routes for new entities (media, inspections, catalogues, offers, buildings, buyer-events)
- ❌ Missing server actions for notes, media, inspections, catalogues, offers, and visit workflows
- ❌ UI components not updated with new fields
- ❌ Missing individual entity API routes ([id] routes)

**Overall Readiness:** ~60% - Ready to build, but requires systematic implementation

---

## ✅ What's Ready

### 1. Database Schema (100% Complete)
- ✅ All tables created with new fields
- ✅ All enums defined (dropReason, configuration, view, facing, usp, etc.)
- ✅ All relations configured (notes, media_items, home_inspections, home_catalogues, offers, buyer_events)
- ✅ Type exports available

**Files:**
- `src/lib/db/schema.ts` - Complete with all CSV fields

### 2. Validation Schemas (100% Complete)
- ✅ `lib/validations/seller.ts` - Has profile_id, secondary_phone, drop_reason, source_listing_url
- ✅ `lib/validations/lead.ts` - Has all new fields including preference_json
- ✅ `lib/validations/listing.ts` - Has all new listing fields
- ✅ `lib/validations/visit.ts` - Has workflow fields, OTP, location capture
- ✅ `lib/validations/building.ts` - Complete
- ✅ `lib/validations/unit.ts` - Complete
- ✅ `lib/validations/note.ts` - Complete
- ✅ `lib/validations/media.ts` - Complete
- ✅ `lib/validations/inspection.ts` - Complete
- ✅ `lib/validations/catalogue.ts` - Complete
- ✅ `lib/validations/offer.ts` - Complete

### 3. Type Definitions (100% Complete)
- ✅ All types exported from schema
- ✅ Extended types with relations (LeadWithRelations, ListingWithRelations, etc.)

**Files:**
- `src/types/index.ts` - Complete

### 4. Existing API Routes (Partial)
- ✅ `GET/POST /api/v1/leads` - Exists
- ✅ `GET/POST /api/v1/seller-leads` - Exists
- ✅ `GET/POST /api/v1/notes` - Exists
- ✅ `GET/POST /api/v1/visits` - Exists (basic)
- ✅ `GET /api/v1/listings/active` - Exists

---

## ❌ What's Missing

### 1. API Routes - Missing Individual Entity Routes

#### Critical Missing Routes:
- ❌ `GET/PUT/DELETE /api/v1/leads/[id]` - **MISSING**
- ❌ `GET/PUT /api/v1/listings/[id]` - **MISSING**
- ❌ `GET/PUT/POST /api/v1/visits/[id]` - **MISSING** (needed for workflow actions)
- ❌ `GET/POST /api/v1/buildings` - **MISSING**
- ❌ `GET/PUT /api/v1/buildings/[id]` - **MISSING**

#### New Entity Routes (All Missing):
- ❌ `GET/POST /api/v1/media` - **MISSING**
- ❌ `GET/PUT/DELETE /api/v1/media/[id]` - **MISSING**
- ❌ `GET/POST /api/v1/inspections` - **MISSING**
- ❌ `GET/PUT/POST /api/v1/inspections/[id]` - **MISSING**
- ❌ `GET/POST /api/v1/catalogues` - **MISSING**
- ❌ `GET/PUT/POST /api/v1/catalogues/[id]` - **MISSING**
- ❌ `GET/POST /api/v1/offers` - **MISSING**
- ❌ `GET/PUT/POST /api/v1/offers/[id]` - **MISSING**
- ❌ `GET/POST /api/v1/buyer-events` - **MISSING**

**Impact:** Cannot fetch/update individual entities, cannot manage new entities

---

### 2. Server Actions - Missing Critical Functions

#### Notes Management (Missing):
- ❌ `createNote(entityType, entityId, content)` - **MISSING**
- ❌ `updateNote(noteId, content)` - **MISSING**
- ❌ `deleteNote(noteId)` - **MISSING**
- ❌ `getNotesByEntity(entityType, entityId)` - **MISSING**

#### Media Management (Missing):
- ❌ `uploadMedia(entityType, entityId, file, tag, metadata)` - **MISSING**
- ❌ `updateMediaOrder(mediaItems)` - **MISSING**
- ❌ `deleteMedia(mediaId)` - **MISSING**
- ❌ `getMediaByEntity(entityType, entityId)` - **MISSING**

#### Inspection Management (Missing):
- ❌ `createInspection(listingId, data)` - **MISSING**
- ❌ `updateInspection(inspectionId, data)` - **MISSING**
- ❌ `completeInspection(inspectionId, location, data)` - **MISSING**
- ❌ `getInspectionsByListing(listingId)` - **MISSING**

#### Catalogue Management (Missing):
- ❌ `createCatalogue(listingId, inspectionId, data)` - **MISSING**
- ❌ `updateCatalogue(catalogueId, data)` - **MISSING**
- ❌ `approveCatalogue(catalogueId)` - **MISSING**
- ❌ `rejectCatalogue(catalogueId, reason)` - **MISSING**
- ❌ `getCataloguesByListing(listingId)` - **MISSING**

#### Visit Workflow Actions (Missing):
- ❌ `confirmVisit(visitId)` - **MISSING**
- ❌ `cancelVisit(visitId, reason)` - **MISSING**
- ❌ `rescheduleVisit(visitId, newScheduledAt)` - **MISSING**
- ❌ `completeVisit(visitId, otpCode, location, feedback)` - **MISSING** (verifyVisitOTP exists but needs update)

#### Offer Management (Missing):
- ❌ `createOffer(listingId, leadId, offerAmount, terms)` - **MISSING**
- ❌ `updateOffer(offerId, data)` - **MISSING**
- ❌ `acceptOffer(offerId)` - **MISSING**
- ❌ `rejectOffer(offerId, reason)` - **MISSING**
- ❌ `counterOffer(offerId, newAmount, terms)` - **MISSING**

#### Existing Actions Need Updates:
- ⚠️ `createSellerLead` - Needs to handle new fields (profile_id, secondary_phone, drop_reason, source_listing_url)
- ⚠️ `createLead` - Needs to handle new fields (preference_json, locality, zone, pipeline, etc.)
- ⚠️ `verifyVisitOTP` - Needs location capture requirement
- ⚠️ `updateListingStatus` - Needs to handle new status values

**Impact:** Cannot perform CRUD operations on new entities, cannot use workflow actions

---

### 3. UI Components - Not Updated

#### Forms (Need Updates):
- ❌ `components/sellers/new-seller-form.tsx` - Missing secondary_phone, drop_reason, source_listing_url
- ❌ `components/buyers/new-lead-form.tsx` - Missing new lead fields, expanded preferences
- ❌ `components/visits/visit-form.tsx` - Missing workflow state UI, OTP, location capture

#### Detail Views (Need Updates):
- ❌ `components/sellers/detail/seller-detail-view.tsx` - Missing new fields, notes list
- ❌ `components/buyers/detail/` - May not exist, needs all new lead fields
- ❌ `components/listings/detail/` - Missing new listing fields, media gallery, notes list
- ❌ `components/visits/detail/visit-detail-view.tsx` - May not exist, needs workflow states

#### New Components (All Missing):
- ❌ `components/shared/notes-section.tsx` - **MISSING**
- ❌ `components/shared/media-gallery.tsx` - **MISSING**
- ❌ `components/listings/inspection-form.tsx` - **MISSING**
- ❌ `components/listings/catalogue-form.tsx` - **MISSING**
- ❌ `components/listings/offer-form.tsx` - **MISSING**
- ❌ `components/visits/visit-workflow-actions.tsx` - **MISSING**

#### Table Components (Need Updates):
- ❌ `components/sellers/sellers-table.tsx` - Missing new columns
- ❌ `components/buyers/buyers-table.tsx` - Missing new columns
- ❌ `components/listings/listings-table.tsx` - Missing new columns
- ❌ `components/visits/visits-table.tsx` - Missing workflow state indicators

**Impact:** UI cannot display or edit new fields, cannot use new features

---

## 📋 Implementation Priority

### Phase 1: Core API Routes (HIGH PRIORITY)
1. Create individual entity routes:
   - `/api/v1/leads/[id]/route.ts`
   - `/api/v1/listings/[id]/route.ts`
   - `/api/v1/visits/[id]/route.ts`
   - `/api/v1/buildings/route.ts` and `[id]`

2. Create new entity routes:
   - `/api/v1/media/route.ts` and `[id]`
   - `/api/v1/inspections/route.ts` and `[id]`
   - `/api/v1/catalogues/route.ts` and `[id]`
   - `/api/v1/offers/route.ts` and `[id]`
   - `/api/v1/buyer-events/route.ts`

**Estimated Time:** 2-3 days

### Phase 2: Server Actions (HIGH PRIORITY)
1. Notes management actions
2. Media management actions
3. Inspection management actions
4. Catalogue management actions
5. Offer management actions
6. Visit workflow actions
7. Update existing actions with new fields

**Estimated Time:** 2-3 days

### Phase 3: UI Components (MEDIUM PRIORITY)
1. Update existing forms with new fields
2. Create shared components (notes-section, media-gallery)
3. Create new entity forms (inspection, catalogue, offer)
4. Update detail views
5. Update table components

**Estimated Time:** 3-4 days

### Phase 4: Testing & Integration (MEDIUM PRIORITY)
1. Test all API endpoints
2. Test workflow states
3. Test notes/media management
4. Integration testing

**Estimated Time:** 1-2 days

---

## ✅ Ready to Build?

### Answer: **YES, with caveats**

**What you can start building immediately:**
1. ✅ API routes for new entities (validation schemas ready)
2. ✅ Server actions (database schema ready)
3. ✅ UI components (types and validations ready)

**What you need to be aware of:**
1. ⚠️ Existing API routes may need updates to include new fields in responses
2. ⚠️ Existing server actions need updates to handle new fields
3. ⚠️ UI components currently using mock data need to be connected to real APIs
4. ⚠️ Visit workflow needs careful implementation (state transitions)

**Recommended Approach:**
1. Start with API routes (foundation)
2. Then server actions (business logic)
3. Then UI components (user interface)
4. Test incrementally as you build

---

## 🎯 Next Steps

1. **Create API routes** for missing endpoints (Phase 1)
2. **Create server actions** for new entities (Phase 2)
3. **Update existing actions** to handle new fields
4. **Create/update UI components** (Phase 3)
5. **Test integration** (Phase 4)

**Total Estimated Time:** 8-12 days of focused development

---

## Notes

- The database schema is production-ready
- Validation schemas are comprehensive
- Type safety is maintained throughout
- The foundation is solid - now it's about building on top of it

**You're ready to build!** 🚀

