
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";
import { buyers } from "../mock-data/buyers";
import { mockListings } from "../mock-data/listings";
import { sellers } from "../mock-data/sellers";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Starting seed...");

  try {
    // 1. Seed Profiles (Agents, Sellers, Buyers)
    // We'll use a Map to deduplicate by phone/email to avoid conflicts
    const profilesMap = new Map<string, any>();

    // Helper to add profile
    const addProfile = (name: string, phone: string, email: string | undefined, role: string, avatar?: string) => {
      const key = phone || email || name; // Prefer phone as unique key
      if (!profilesMap.has(key)) {
        profilesMap.set(key, {
          fullName: name,
          phone,
          email,
          role,
          // We can't easily set ID to match mock ID because UUIDs are different.
          // We'll rely on returning inserted records to map them back.
        });
      }
      return key;
    };

    // Add Agents from Mock Data
    // From Buyers (assignedAgent)
    buyers.forEach(b => {
      // Mock agents don't have phone numbers, generate dummy ones
      const dummyPhone = `+91 90000 ${b.assignedAgent.initials.split('').map(c => c.charCodeAt(0)).join('').slice(0, 5)}`;
      addProfile(b.assignedAgent.name, dummyPhone, `${b.assignedAgent.name.toLowerCase().replace(' ', '.')}@jumbo.com`, "buyer_agent");
    });

    // From Listings (listingAgent)
    mockListings.forEach(l => {
      const dummyPhone = `+91 91000 ${l.listingAgentInitials.split('').map(c => c.charCodeAt(0)).join('').slice(0, 5)}`;
      addProfile(l.listingAgentName, dummyPhone, `${l.listingAgentName.toLowerCase().replace(' ', '.')}@jumbo.com`, "listing_agent");
    });

    // Add Sellers (Owners)
    // From Sellers mock
    sellers.forEach(s => {
       // Using dummy phone since mock sellers only have email usually, but schema requires phone
       const dummyPhone = `+91 92000 ${s.id.padStart(5, '0')}`;
       addProfile(s.name, dummyPhone, s.email, "buyer_agent"); // Using buyer_agent as default user role
    });

    // From Listings (owners)
    mockListings.forEach(l => {
      addProfile(l.ownerName, l.ownerPhone, undefined, "buyer_agent");
    });

    // Add Buyers
    buyers.forEach(b => {
      addProfile(b.name, b.contact.mobile, b.contact.email, "buyer_agent");
    });

    console.log(`Found ${profilesMap.size} unique profiles to insert.`);

    // Bulk Insert Profiles
    const insertedProfiles = await db.insert(schema.profiles)
      .values(Array.from(profilesMap.values()))
      .onConflictDoNothing({ target: schema.profiles.phone }) // Skip if exists
      .returning();
    
    console.log(`Inserted ${insertedProfiles.length} profiles.`);

    // Re-fetch all profiles (both new and existing) to get IDs
    const allProfiles = await db.select().from(schema.profiles);
    const profileLookup = new Map(allProfiles.map(p => [p.phone, p]));
    const nameLookup = new Map(allProfiles.map(p => [p.fullName, p]));

    // Helper to find profile ID
    const findProfileId = (name: string, phone?: string) => {
      if (phone && profileLookup.has(phone)) return profileLookup.get(phone)?.id;
      if (nameLookup.has(name)) return nameLookup.get(name)?.id;
      return null;
    };

    // 2. Seed Buildings
    const buildingsMap = new Map<string, any>();
    
    mockListings.forEach(l => {
      if (!buildingsMap.has(l.buildingName)) {
        buildingsMap.set(l.buildingName, {
          name: l.buildingName,
          locality: l.locality,
          // Mock data doesn't have lat/lng/city, filling defaults
          city: "Bangalore",
        });
      }
    });

    console.log(`Found ${buildingsMap.size} buildings.`);
    
    // Insert Buildings
    // We process sequentially to capture IDs easily or just fetch back
    const insertedBuildings = [];
    for (const b of buildingsMap.values()) {
        const [inserted] = await db.insert(schema.buildings).values(b).returning();
        insertedBuildings.push(inserted);
    }
    
    const buildingLookup = new Map(insertedBuildings.map(b => [b.name, b.id]));

    // 3. Seed Units & Listings
    let unitsCount = 0;
    let listingsCount = 0;

    for (const l of mockListings) {
      const buildingId = buildingLookup.get(l.buildingName);
      const ownerId = findProfileId(l.ownerName, l.ownerPhone);
      const agentId = findProfileId(l.listingAgentName);

      if (!buildingId) continue;

      // Create Unit
      const [unit] = await db.insert(schema.units).values({
        buildingId,
        unitNumber: l.unitNumber,
        bhk: l.bhk,
        floorNumber: l.floorNumber,
        carpetArea: l.carpetArea,
        ownerId: ownerId, // Can be null if not found (though we seeded them)
      }).returning();
      unitsCount++;

      // Create Listing
      await db.insert(schema.listings).values({
        unitId: unit.id,
        listingAgentId: agentId,
        status: l.status,
        askingPrice: l.askingPrice.toString(),
        images: l.images,
        amenitiesJson: l.amenities,
        isVerified: l.isVerified,
        createdAt: new Date(l.createdAt), // Mock date string to Date
      });
      listingsCount++;
    }

    console.log(`Inserted ${unitsCount} units and ${listingsCount} listings.`);

    // 4. Seed Leads (Buyers)
    let leadsCount = 0;
    for (const b of buyers) {
      const profileId = findProfileId(b.name, b.contact.mobile);
      const agentId = findProfileId(b.assignedAgent.name); // No phone for agent in buyer mock, use name

      if (!profileId) {
        console.warn(`Profile not found for buyer ${b.name}`);
        continue;
      }

      await db.insert(schema.leads).values({
        profileId,
        assignedAgentId: agentId,
        source: b.source,
        status: b.status.toLowerCase(), // "Active" -> "active" (schema default is 'new')
        requirementJson: {
          budget_desc: b.preferences.budget,
          type: b.preferences.type,
          timeline: b.preferences.timeline
        },
        lastContactedAt: new Date(), // Just use now
        createdAt: new Date(b.addedDate),
      });
      leadsCount++;
    }

    console.log(`Inserted ${leadsCount} leads.`);
    console.log("✅ Seed completed successfully.");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();

