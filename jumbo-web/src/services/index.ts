/**
 * Service Layer
 * Centralized exports for all services
 *
 * Usage:
 * import * as teamService from "@/services/team.service";
 * import * as contactService from "@/services/contact.service";
 * import * as services from "@/services";
 */

// Core Entity Services
export * as buildingService from "./building.service";
export * as unitService from "./unit.service";
export * as teamService from "./team.service";
export * as contactService from "./contact.service";
export * as coinService from "./coin.service";

// Backwards-compatible alias (use teamService in new code)
export * as profileService from "./team.service";

// CRM Services
export * as leadService from "./lead.service";
export * as sellerLeadService from "./seller-lead.service";

// Inventory Services
export * as listingService from "./listing.service";

// Visit & Tour Services
export * as tourService from "./tour.service";
export * as visitService from "./visit.service";

// Communication & Media Services
export * as communicationService from "./communication.service";
export * as noteService from "./note.service";
export * as mediaService from "./media.service";

// Workflow Services
export * as inspectionService from "./inspection.service";
export * as catalogueService from "./catalogue.service";
export * as offerService from "./offer.service";

// Types
export * from "./types";

// Errors
export * from "./errors";
