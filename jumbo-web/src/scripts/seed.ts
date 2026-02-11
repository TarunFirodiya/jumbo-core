
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../lib/db/schema";
import { buyers } from "../mock-data/buyers";
import { mockListings } from "../mock-data/listings";
import { sellers } from "../mock-data/sellers";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deterministic pseudo-random from a seed (0-1 range) */
function rand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/** Pick a random item from an array using a seed */
function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

/** Create a date relative to today (-days in the past, +days in the future) */
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function seed() {
  console.log("🌱 Starting seed...\n");

  try {
    // ================================================================
    // 1. TEAM MEMBERS (Agents)
    // ================================================================
    const teamMap = new Map<string, any>();

    const addTeamMember = (
      name: string,
      phone: string,
      email: string | undefined,
      role: "buyer_agent" | "listing_agent" | "seller_agent" | "visit_agent" | "dispatch_agent" | "team_lead" | "super_admin"
    ) => {
      const key = phone;
      if (!teamMap.has(key)) {
        teamMap.set(key, { fullName: name, phone, email, role });
      }
      return key;
    };

    // Agents from buyer mock data
    buyers.forEach((b) => {
      const dummyPhone = `+91 90000 ${b.assignedAgent.initials
        .split("")
        .map((c) => c.charCodeAt(0))
        .join("")
        .slice(0, 5)}`;
      addTeamMember(
        b.assignedAgent.name,
        dummyPhone,
        `${b.assignedAgent.name.toLowerCase().replace(" ", ".")}@jumbo.com`,
        "buyer_agent"
      );
    });

    // Agents from listing mock data
    mockListings.forEach((l) => {
      const dummyPhone = `+91 91000 ${l.listingAgentInitials
        .split("")
        .map((c) => c.charCodeAt(0))
        .join("")
        .slice(0, 5)}`;
      addTeamMember(
        l.listingAgentName,
        dummyPhone,
        `${l.listingAgentName.toLowerCase().replace(" ", ".")}@jumbo.com`,
        "listing_agent"
      );
    });

    // Agents from seller mock data
    sellers.forEach((s) => {
      const dummyPhone = `+91 93000 ${s.assignedAgent.initials
        .split("")
        .map((c) => c.charCodeAt(0))
        .join("")
        .slice(0, 5)}`;
      addTeamMember(
        s.assignedAgent.name,
        dummyPhone,
        `${s.assignedAgent.name.toLowerCase().replace(" ", ".")}@jumbo.com`,
        "seller_agent"
      );
    });

    // Add a few extra roles for variety
    addTeamMember("Dispatch Raj", "+91 94000 00001", "dispatch.raj@jumbo.com", "dispatch_agent");
    addTeamMember("Visit Kumar", "+91 94000 00002", "visit.kumar@jumbo.com", "visit_agent");
    addTeamMember("TL Priya", "+91 94000 00003", "tl.priya@jumbo.com", "team_lead");
    addTeamMember("Admin Tarun", "+91 94000 00004", "admin.tarun@jumbo.com", "super_admin");

    console.log(`Found ${teamMap.size} unique team members to insert.`);

    const insertedTeamMembers = await db
      .insert(schema.team)
      .values(Array.from(teamMap.values()))
      .onConflictDoNothing({ target: schema.team.phone })
      .returning();

    console.log(`✅ Inserted ${insertedTeamMembers.length} team members.`);

    // Re-fetch all team members for lookups
    const allTeamMembers = await db.select().from(schema.team);
    const teamPhoneLookup = new Map(allTeamMembers.map((m) => [m.phone, m]));
    const teamNameLookup = new Map(allTeamMembers.map((m) => [m.fullName, m]));
    const teamByRole = (role: string) => allTeamMembers.filter((m) => m.role === role);

    const findTeamMemberId = (name: string, phone?: string): string | null => {
      if (phone && teamPhoneLookup.has(phone)) return teamPhoneLookup.get(phone)!.id;
      if (teamNameLookup.has(name)) return teamNameLookup.get(name)!.id;
      return null;
    };

    // ================================================================
    // 2. CONTACTS (Buyers + Sellers + Listing Owners)
    // ================================================================
    const contactsMap = new Map<string, any>();

    const addContact = (name: string, phone: string, email?: string) => {
      if (!contactsMap.has(phone)) {
        contactsMap.set(phone, { phone, name, email, type: "customer" as const });
      }
    };

    buyers.forEach((b) => addContact(b.name, b.contact.mobile, b.contact.email));
    sellers.forEach((s) => {
      const dummyPhone = `+91 92000 ${s.id.padStart(5, "0")}`;
      addContact(s.name, dummyPhone, s.email);
    });
    mockListings.forEach((l) => addContact(l.ownerName, l.ownerPhone));

    console.log(`Found ${contactsMap.size} unique contacts to insert.`);

    const insertedContacts = await db
      .insert(schema.contacts)
      .values(Array.from(contactsMap.values()))
      .onConflictDoNothing({ target: schema.contacts.phone })
      .returning();

    console.log(`✅ Inserted ${insertedContacts.length} contacts.`);

    // Re-fetch contacts for lookups
    const allContacts = await db.select().from(schema.contacts);
    const contactPhoneLookup = new Map(allContacts.map((c) => [c.phone, c]));

    const findContactId = (phone: string): string | null =>
      contactPhoneLookup.get(phone)?.id ?? null;

    // ================================================================
    // 3. BUILDINGS
    // ================================================================
    const buildingsMap = new Map<string, any>();

    const bangaloreLocalities: Record<string, { lat: number; lng: number }> = {
      Whitefield: { lat: 12.9698, lng: 77.7500 },
      Rajajinagar: { lat: 12.9888, lng: 77.5528 },
      Balagere: { lat: 12.9364, lng: 77.7579 },
      Devanahalli: { lat: 13.2473, lng: 77.7124 },
      "Electronic City": { lat: 12.8399, lng: 77.6770 },
      "Kudlu Gate": { lat: 12.8843, lng: 77.6440 },
      Yelahanka: { lat: 13.1007, lng: 77.5963 },
      Bellandur: { lat: 12.9261, lng: 77.6756 },
      "Rajaji Nagar": { lat: 12.9888, lng: 77.5528 },
      Budigere: { lat: 13.0820, lng: 77.7148 },
      Koramangala: { lat: 12.9352, lng: 77.6245 },
      "Sarjapur Road": { lat: 12.9080, lng: 77.6720 },
      Hinjewadi: { lat: 18.5912, lng: 73.7389 },
    };

    mockListings.forEach((l) => {
      if (!buildingsMap.has(l.buildingName)) {
        const coords = bangaloreLocalities[l.locality] ?? { lat: 12.9716, lng: 77.5946 };
        buildingsMap.set(l.buildingName, {
          name: l.buildingName,
          locality: l.locality,
          city: "Bangalore",
          latitude: coords.lat + (rand(l.buildingName.length) - 0.5) * 0.01,
          longitude: coords.lng + (rand(l.buildingName.length + 1) - 0.5) * 0.01,
          totalFloors: Math.floor(rand(l.buildingName.length + 2) * 20) + 5,
          totalUnits: Math.floor(rand(l.buildingName.length + 3) * 200) + 50,
        });
      }
    });

    console.log(`Found ${buildingsMap.size} buildings.`);

    const insertedBuildings = [];
    for (const b of buildingsMap.values()) {
      const [inserted] = await db.insert(schema.buildings).values(b).returning();
      insertedBuildings.push(inserted);
    }

    console.log(`✅ Inserted ${insertedBuildings.length} buildings.`);

    const buildingLookup = new Map(insertedBuildings.map((b) => [b.name, b]));

    // ================================================================
    // 4. UNITS & LISTINGS
    // ================================================================
    let unitsCount = 0;
    let listingsCount = 0;
    const insertedListings: schema.Listing[] = [];
    const insertedUnits: schema.Unit[] = [];

    for (const l of mockListings) {
      const building = buildingLookup.get(l.buildingName);
      const agentId = findTeamMemberId(l.listingAgentName);

      if (!building) continue;

      const viewOptions: schema.View[] = ["park", "road", "pool", "garden", "city", "lake"];
      const facingOptions: schema.Facing[] = ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"];

      const [unit] = await db
        .insert(schema.units)
        .values({
          buildingId: building.id,
          unitNumber: l.unitNumber,
          bhk: l.bhk,
          floorNumber: l.floorNumber,
          carpetArea: l.carpetArea,
          view: pick(viewOptions, l.floorNumber),
          facing: pick(facingOptions, l.carpetArea),
          bedroomCount: Math.ceil(l.bhk),
          bathroomCount: Math.ceil(l.bhk),
          balconyCount: Math.min(Math.ceil(l.bhk) - 1, 3) || 1,
          parkingCount: l.bhk >= 3 ? 2 : 1,
        })
        .returning();
      insertedUnits.push(unit);
      unitsCount++;

      const configMap: Record<number, schema.Configuration> = {
        1: "1BHK",
        2: "2BHK",
        2.5: "3BHK",
        3: "3BHK",
        4: "4BHK",
      };

      const askPriceLacs = l.askingPrice / 100000;
      const pricePerSqft = l.carpetArea > 0 ? Math.round(l.askingPrice / l.carpetArea) : null;

      const [listing] = await db
        .insert(schema.listings)
        .values({
          unitId: unit.id,
          listingAgentId: agentId,
          configuration: configMap[l.bhk] ?? "2BHK",
          flatNumber: l.unitNumber,
          status: l.status,
          askingPrice: l.askingPrice.toString(),
          askPriceLacs: askPriceLacs.toString(),
          pricePerSqft: pricePerSqft?.toString() ?? null,
          propertyType: "apartment",
          occupancy: pick(["ready_to_move", "under_construction"] as const, listingsCount),
          furnishing: pick(["furnished", "semi_furnished", "unfurnished"] as const, listingsCount + 1),
          inventoryType: pick(["primary", "secondary", "resale"] as const, listingsCount + 2),
          images: l.images,
          amenitiesJson: l.amenities,
          isVerified: l.isVerified,
          publishedAt: l.status === "active" ? daysAgo(Math.floor(rand(listingsCount) * 30)) : null,
          createdAt: new Date(l.createdAt),
        })
        .returning();
      insertedListings.push(listing);
      listingsCount++;
    }

    console.log(`✅ Inserted ${unitsCount} units and ${listingsCount} listings.`);

    // ================================================================
    // 5. LEADS (Buyer Leads)
    // ================================================================
    let leadsCount = 0;
    const insertedLeads: schema.Lead[] = [];

    for (const b of buyers) {
      const contactId = findContactId(b.contact.mobile);
      const agentId = findTeamMemberId(b.assignedAgent.name);

      if (!contactId) {
        console.warn(`⚠️  Contact not found for buyer ${b.name}`);
        continue;
      }

      const budgetMin = (50 + (leadsCount % 10) * 10) * 100000;
      const budgetMax = budgetMin + 2000000;
      const bhkOptions = [2, 3];

      const [lead] = await db
        .insert(schema.leads)
        .values({
          contactId,
          assignedAgentId: agentId,
          source: b.source,
          status: b.status.toLowerCase(),
          locality: b.location.split(",")[0].trim(),
          requirementJson: {
            bhk: [pick(bhkOptions, leadsCount)],
            budget_min: budgetMin,
            budget_max: budgetMax,
            localities: ["Whitefield", "Sarjapur Road", "Bellandur"].slice(0, 1 + (leadsCount % 3)),
          },
          preferenceJson: {
            property_type: b.preferences.type.toLowerCase(),
            configuration: [b.preferences.type === "Villa" ? "Villa" : `${pick(bhkOptions, leadsCount)}BHK`],
          },
          lastContactedAt: daysAgo(leadsCount % 7),
          createdAt: new Date(b.addedDate),
        })
        .returning();
      insertedLeads.push(lead);
      leadsCount++;
    }

    console.log(`✅ Inserted ${leadsCount} leads.`);

    // ================================================================
    // 6. SELLER LEADS
    // ================================================================
    let sellerLeadsCount = 0;
    const insertedSellerLeads: schema.SellerLead[] = [];

    const sellerLeadSources: schema.SellerLeadSource[] = [
      "website", "99acres", "magicbricks", "housing", "nobroker", "referral",
    ];
    const sellerLeadStatuses: schema.SellerLeadStatus[] = [
      "new", "proposal_sent", "proposal_accepted",
    ];

    for (const s of sellers) {
      const dummyPhone = `+91 92000 ${s.id.padStart(5, "0")}`;
      const contactId = findContactId(dummyPhone);
      const agentId = findTeamMemberId(s.assignedAgent.name);

      if (!contactId) {
        console.warn(`⚠️  Contact not found for seller ${s.name}`);
        continue;
      }

      // Link some seller leads to existing buildings
      const buildingsList = Array.from(buildingLookup.values());
      const linkedBuilding = sellerLeadsCount < buildingsList.length
        ? buildingsList[sellerLeadsCount]
        : null;

      const [sellerLead] = await db
        .insert(schema.sellerLeads)
        .values({
          contactId,
          source: pick(sellerLeadSources, sellerLeadsCount),
          status: pick(sellerLeadStatuses, sellerLeadsCount),
          assignedToId: agentId,
          buildingId: linkedBuilding?.id ?? null,
          followUpDate: daysFromNow(Math.floor(rand(sellerLeadsCount) * 14) + 1),
          isNri: sellerLeadsCount % 5 === 0,
        })
        .returning();
      insertedSellerLeads.push(sellerLead);
      sellerLeadsCount++;
    }

    console.log(`✅ Inserted ${sellerLeadsCount} seller leads.`);

    // ================================================================
    // 7. VISIT TOURS & VISITS
    // ================================================================

    // We need some dispatch + visit agents
    const dispatchAgents = teamByRole("dispatch_agent");
    const visitAgents = teamByRole("visit_agent");
    // Fall back to buyer agents if dedicated roles not found
    const fallbackAgents = teamByRole("buyer_agent");
    const vaAgents = visitAgents.length > 0 ? visitAgents : fallbackAgents;
    const daAgents = dispatchAgents.length > 0 ? dispatchAgents : fallbackAgents;

    let toursCount = 0;
    let visitsCount = 0;
    const insertedVisits: schema.Visit[] = [];

    // Create tours for the last 14 days + a couple future ones
    const tourDays = Array.from({ length: 16 }, (_, i) => daysAgo(14 - i));

    for (let t = 0; t < tourDays.length; t++) {
      const tourDate = tourDays[t];
      const dispatchAgent = pick(daAgents, t);
      const fieldAgent = pick(vaAgents, t + 1);

      const [tour] = await db
        .insert(schema.visitTours)
        .values({
          dispatchAgentId: dispatchAgent.id,
          fieldAgentId: fieldAgent.id,
          tourDate: tourDate.toISOString().split("T")[0],
          status: tourDate < new Date() ? "completed" : "planned",
        })
        .returning();
      toursCount++;

      // Each tour has 2-4 visits
      const visitCount = 2 + (t % 3);
      const activeListings = insertedListings.filter((l) => l.status === "active" || l.status === "draft");

      for (let v = 0; v < visitCount && v < insertedLeads.length; v++) {
        const lead = pick(insertedLeads, t * 10 + v);
        const listing = pick(activeListings.length > 0 ? activeListings : insertedListings, t * 10 + v + 3);

        const isPast = tourDate < new Date();
        let visitStatus: string;
        let visitCompleted = false;
        let visitConfirmed = false;
        let visitCanceled = false;
        let completedAt: Date | null = null;
        let confirmedAt: Date | null = null;
        let canceledAt: Date | null = null;

        if (isPast) {
          // Past visits: 60% completed, 20% confirmed but not done, 10% cancelled, 10% no-show
          const roll = rand(t * 100 + v);
          if (roll < 0.6) {
            visitStatus = "completed";
            visitCompleted = true;
            visitConfirmed = true;
            completedAt = tourDate;
            confirmedAt = new Date(tourDate.getTime() - 86400000); // confirmed day before
          } else if (roll < 0.8) {
            visitStatus = "confirmed";
            visitConfirmed = true;
            confirmedAt = new Date(tourDate.getTime() - 86400000);
          } else if (roll < 0.9) {
            visitStatus = "cancelled";
            visitCanceled = true;
            canceledAt = tourDate;
          } else {
            visitStatus = "no_show";
          }
        } else {
          // Future visits: 70% scheduled, 30% confirmed
          if (rand(t * 100 + v + 50) < 0.7) {
            visitStatus = "scheduled";
          } else {
            visitStatus = "confirmed";
            visitConfirmed = true;
            confirmedAt = new Date();
          }
        }

        const buyerContact = allContacts.find((c) => c.id === lead.contactId);
        const feedbackOptions = [
          "Liked the property, will discuss with family",
          "Too expensive for the area",
          "Great layout but needs renovation",
          "Interested, wants to revisit next week",
          "Location is perfect, negotiating price",
          "Bathroom condition was a concern",
          "Loved the view from the balcony",
          "Parking situation is not ideal",
        ];

        const [visit] = await db
          .insert(schema.visits)
          .values({
            tourId: tour.id,
            leadId: lead.id,
            listingId: listing.id,
            visitorName: buyerContact?.name ?? "Unknown Visitor",
            visitStatus,
            status: visitStatus,
            visitCompleted,
            visitConfirmed,
            visitCanceled,
            completedAt,
            confirmedAt,
            canceledAt,
            scheduledAt: tourDate,
            assignedVaId: fieldAgent.id,
            completedById: visitCompleted ? fieldAgent.id : null,
            visitedWith: visitCompleted ? pick(["alone", "family", "friends"] as const, v) : null,
            primaryPainPoint: visitCompleted ? pick(["price", "location", "size", "condition", "amenities"] as const, v + 1) : null,
            feedbackText: visitCompleted ? pick(feedbackOptions, t + v) : null,
            feedbackRating: visitCompleted ? Math.floor(rand(t + v + 99) * 5) + 1 : null,
            otpCode: String(1000 + Math.floor(rand(t * 100 + v + 200) * 9000)),
            otpVerified: visitCompleted,
          })
          .returning();
        insertedVisits.push(visit);
        visitsCount++;
      }
    }

    console.log(`✅ Inserted ${toursCount} tours and ${visitsCount} visits.`);

    // ================================================================
    // 8. COMMUNICATIONS
    // ================================================================
    let commsCount = 0;

    // Add some communications for leads
    for (let i = 0; i < Math.min(insertedLeads.length, 20); i++) {
      const lead = insertedLeads[i];
      const agent = allTeamMembers.find((m) => m.id === lead.assignedAgentId);

      const channels = ["whatsapp", "phone_call", "phone_call", "whatsapp"];
      const directions = ["outgoing", "incoming", "outgoing", "outgoing"];
      const contents = [
        "Hi, I'm reaching out regarding your property search. When would be a good time to discuss?",
        "Thanks for the information. I'll review the listings you sent.",
        "Following up on your visit to Prestige Lakeside. Would you like to schedule another viewing?",
        "Great news! A new listing matching your requirements just came in. Check it out!",
      ];

      // 1-3 communications per lead
      const numComms = 1 + (i % 3);
      for (let c = 0; c < numComms; c++) {
        await db.insert(schema.communications).values({
          leadId: lead.id,
          agentId: agent?.id ?? null,
          channel: channels[(i + c) % channels.length],
          direction: directions[(i + c) % directions.length],
          content: contents[(i + c) % contents.length],
          metadata: channels[(i + c) % channels.length] === "phone_call"
            ? { duration: Math.floor(rand(i * 10 + c) * 300) + 30 }
            : undefined,
          createdAt: daysAgo(Math.floor(rand(i + c) * 14)),
        });
        commsCount++;
      }
    }

    // Add communications for some visits
    for (let i = 0; i < Math.min(insertedVisits.length, 15); i++) {
      const visit = insertedVisits[i];
      const agent = allTeamMembers.find((m) => m.id === visit.assignedVaId);

      await db.insert(schema.communications).values({
        visitId: visit.id,
        leadId: visit.leadId,
        agentId: agent?.id ?? null,
        channel: "whatsapp",
        direction: "outgoing",
        content: `Visit reminder: Your property visit is scheduled for ${visit.scheduledAt?.toLocaleDateString() ?? "soon"}. Please confirm.`,
        createdAt: visit.scheduledAt
          ? new Date(visit.scheduledAt.getTime() - 86400000)
          : daysAgo(1),
      });
      commsCount++;
    }

    console.log(`✅ Inserted ${commsCount} communications.`);

    // ================================================================
    // 9. TASKS
    // ================================================================
    let tasksCount = 0;

    const taskTemplates = [
      { title: "Follow up with buyer after visit", priority: "high" },
      { title: "Schedule property inspection", priority: "medium" },
      { title: "Send listing details to buyer", priority: "low" },
      { title: "Coordinate with seller for showing", priority: "medium" },
      { title: "Update listing photos", priority: "low" },
      { title: "Prepare comparative market analysis", priority: "high" },
      { title: "Call back - missed call from buyer", priority: "urgent" },
      { title: "Verify property documents", priority: "high" },
      { title: "Schedule photoshoot for listing", priority: "medium" },
      { title: "Arrange home inspection", priority: "medium" },
    ];

    for (let i = 0; i < taskTemplates.length; i++) {
      const template = taskTemplates[i];
      const creator = pick(allTeamMembers, i);
      const assignee = pick(allTeamMembers, i + 3);
      const relatedLead = i < insertedLeads.length ? insertedLeads[i] : null;
      const relatedSellerLead = i < insertedSellerLeads.length ? insertedSellerLeads[i] : null;

      const statusOptions = ["open", "in_progress", "completed", "open", "open"];
      const status = statusOptions[i % statusOptions.length];

      await db.insert(schema.tasks).values({
        creatorId: creator.id,
        assigneeId: assignee.id,
        title: template.title,
        description: `Auto-generated task for seeding. ${relatedLead ? "Related to a buyer lead." : ""}`,
        priority: template.priority,
        status,
        relatedLeadId: relatedLead?.id ?? null,
        sellerLeadId: !relatedLead && relatedSellerLead ? relatedSellerLead.id : null,
        dueAt: status === "completed" ? daysAgo(Math.floor(rand(i) * 7)) : daysFromNow(Math.floor(rand(i) * 7) + 1),
        completedAt: status === "completed" ? daysAgo(Math.floor(rand(i) * 3)) : null,
      });
      tasksCount++;
    }

    console.log(`✅ Inserted ${tasksCount} tasks.`);

    // ================================================================
    // 10. CREDIT RULES & LEDGER
    // ================================================================
    const rules = [
      { actionType: "visit_completed", coinValue: 10, description: "Coins awarded when a visit is marked completed" },
      { actionType: "visit_no_show", coinValue: -5, description: "Penalty when buyer is a no-show" },
      { actionType: "listing_created", coinValue: 5, description: "Coins for creating a new listing" },
      { actionType: "deal_closed", coinValue: 50, description: "Coins for closing a deal" },
      { actionType: "inspection_completed", coinValue: 8, description: "Coins for completing an inspection" },
    ];

    for (const rule of rules) {
      await db
        .insert(schema.creditRules)
        .values(rule)
        .onConflictDoNothing({ target: schema.creditRules.actionType });
    }
    console.log(`✅ Inserted ${rules.length} credit rules.`);

    // Award coins for completed visits
    let ledgerCount = 0;
    const completedVisits = insertedVisits.filter((v) => v.visitCompleted);

    for (const visit of completedVisits) {
      if (!visit.assignedVaId) continue;

      await db.insert(schema.creditLedger).values({
        agentId: visit.assignedVaId,
        amount: 10,
        actionType: "visit_completed",
        referenceId: visit.id,
        notes: "Awarded for completing a visit",
      });
      ledgerCount++;

      // Update the agent's total coins cache
      const agent = allTeamMembers.find((m) => m.id === visit.assignedVaId);
      if (agent) {
        const newTotal = (agent.totalCoins ?? 0) + 10;
        await db.update(schema.team).set({ totalCoins: newTotal }).where(
          eq(schema.team.id, agent.id)
        );
        agent.totalCoins = newTotal; // keep in-memory cache fresh
      }
    }

    console.log(`✅ Inserted ${ledgerCount} credit ledger entries.`);

    // ================================================================
    // 11. NOTES
    // ================================================================
    let notesCount = 0;

    const noteContents = [
      "Buyer seems very interested in this area. Budget is flexible.",
      "Seller wants to close quickly, open to negotiation on price.",
      "Property needs minor renovation. Kitchen is outdated.",
      "Great location, close to schools and metro. High demand area.",
      "Buyer prefers east-facing units. Has visited 3 properties so far.",
      "Need to follow up next week. Buyer is comparing with another property.",
      "Documents verified. Ready for next steps.",
      "Seller is NRI, communication via WhatsApp preferred.",
      "Buyer wants to move in within 2 months. Needs ready-to-move property.",
      "Price negotiation ongoing. Seller's bottom line is 95L.",
    ];

    // Notes on leads
    for (let i = 0; i < Math.min(insertedLeads.length, 10); i++) {
      const lead = insertedLeads[i];
      const author = allTeamMembers.find((m) => m.id === lead.assignedAgentId) ?? pick(allTeamMembers, i);

      await db.insert(schema.notes).values({
        entityType: "lead",
        entityId: lead.id,
        content: noteContents[i % noteContents.length],
        createdById: author.id,
      });
      notesCount++;
    }

    // Notes on listings
    for (let i = 0; i < Math.min(insertedListings.length, 8); i++) {
      const listing = insertedListings[i];
      const author = allTeamMembers.find((m) => m.id === listing.listingAgentId) ?? pick(allTeamMembers, i);

      await db.insert(schema.notes).values({
        entityType: "listing",
        entityId: listing.id,
        content: noteContents[(i + 5) % noteContents.length],
        createdById: author.id,
      });
      notesCount++;
    }

    // Notes on visits
    for (let i = 0; i < Math.min(insertedVisits.length, 6); i++) {
      const visit = insertedVisits[i];
      if (!visit.assignedVaId) continue;

      await db.insert(schema.notes).values({
        entityType: "visit",
        entityId: visit.id,
        content: noteContents[(i + 3) % noteContents.length],
        createdById: visit.assignedVaId,
      });
      notesCount++;
    }

    // Notes on seller leads
    for (let i = 0; i < Math.min(insertedSellerLeads.length, 5); i++) {
      const sellerLead = insertedSellerLeads[i];
      const author = allTeamMembers.find((m) => m.id === sellerLead.assignedToId) ?? pick(allTeamMembers, i);

      await db.insert(schema.notes).values({
        entityType: "seller_lead",
        entityId: sellerLead.id,
        content: noteContents[(i + 7) % noteContents.length],
        createdById: author.id,
      });
      notesCount++;
    }

    console.log(`✅ Inserted ${notesCount} notes.`);

    // ================================================================
    // 12. AUDIT LOGS (sample activity)
    // ================================================================
    let auditCount = 0;

    // Log lead creation
    for (let i = 0; i < Math.min(insertedLeads.length, 8); i++) {
      const lead = insertedLeads[i];
      await db.insert(schema.auditLogs).values({
        entityType: "lead",
        entityId: lead.id,
        action: "create",
        changes: { status: { old: null, new: lead.status } },
        performedById: lead.assignedAgentId,
        createdAt: lead.createdAt,
      });
      auditCount++;
    }

    // Log visit status changes
    for (let i = 0; i < Math.min(completedVisits.length, 10); i++) {
      const visit = completedVisits[i];
      await db.insert(schema.auditLogs).values({
        entityType: "visit",
        entityId: visit.id,
        action: "update",
        changes: {
          status: { old: "scheduled", new: "completed" },
          visitCompleted: { old: false, new: true },
        },
        performedById: visit.completedById ?? visit.assignedVaId,
        createdAt: visit.completedAt ?? visit.createdAt,
      });
      auditCount++;
    }

    console.log(`✅ Inserted ${auditCount} audit logs.`);

    // ================================================================
    // SUMMARY
    // ================================================================
    console.log("\n========================================");
    console.log("🎉 Seed completed successfully!");
    console.log("========================================");
    console.log(`  Team members:    ${insertedTeamMembers.length}`);
    console.log(`  Contacts:        ${insertedContacts.length}`);
    console.log(`  Buildings:       ${insertedBuildings.length}`);
    console.log(`  Units:           ${unitsCount}`);
    console.log(`  Listings:        ${listingsCount}`);
    console.log(`  Buyer leads:     ${leadsCount}`);
    console.log(`  Seller leads:    ${sellerLeadsCount}`);
    console.log(`  Tours:           ${toursCount}`);
    console.log(`  Visits:          ${visitsCount}`);
    console.log(`  Communications:  ${commsCount}`);
    console.log(`  Tasks:           ${tasksCount}`);
    console.log(`  Credit rules:    ${rules.length}`);
    console.log(`  Ledger entries:  ${ledgerCount}`);
    console.log(`  Notes:           ${notesCount}`);
    console.log(`  Audit logs:      ${auditCount}`);
    console.log("========================================\n");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
