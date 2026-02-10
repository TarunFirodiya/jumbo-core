
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
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

async function seed() {
  console.log("Starting seed...");

  try {
    // 1. Seed Team Members (Agents)
    const teamMap = new Map<string, any>();

    const addTeamMember = (name: string, phone: string, email: string | undefined, role: string) => {
      const key = phone || email || name;
      if (!teamMap.has(key)) {
        teamMap.set(key, {
          fullName: name,
          phone,
          email,
          role,
        });
      }
      return key;
    };

    // Add Agents from Mock Data (Buyers)
    buyers.forEach(b => {
      const dummyPhone = `+91 90000 ${b.assignedAgent.initials.split('').map(c => c.charCodeAt(0)).join('').slice(0, 5)}`;
      addTeamMember(b.assignedAgent.name, dummyPhone, `${b.assignedAgent.name.toLowerCase().replace(' ', '.')}@jumbo.com`, "buyer_agent");
    });

    // Add Agents from Mock Data (Listings)
    mockListings.forEach(l => {
      const dummyPhone = `+91 91000 ${l.listingAgentInitials.split('').map(c => c.charCodeAt(0)).join('').slice(0, 5)}`;
      addTeamMember(l.listingAgentName, dummyPhone, `${l.listingAgentName.toLowerCase().replace(' ', '.')}@jumbo.com`, "listing_agent");
    });

    console.log(`Found ${teamMap.size} unique team members to insert.`);

    // Bulk Insert Team Members
    const insertedTeamMembers = await db.insert(schema.team)
      .values(Array.from(teamMap.values()))
      .onConflictDoNothing({ target: schema.team.phone })
      .returning();
    
    console.log(`Inserted ${insertedTeamMembers.length} team members.`);

    // Re-fetch all team members to get IDs
    const allTeamMembers = await db.select().from(schema.team);
    const teamPhoneLookup = new Map(allTeamMembers.map(m => [m.phone, m]));
    const teamNameLookup = new Map(allTeamMembers.map(m => [m.fullName, m]));

    const findTeamMemberId = (name: string, phone?: string) => {
      if (phone && teamPhoneLookup.has(phone)) return teamPhoneLookup.get(phone)?.id;
      if (teamNameLookup.has(name)) return teamNameLookup.get(name)?.id;
      return null;
    };

    // 2. Seed Contacts (Buyers + Sellers)
    const contactsMap = new Map<string, any>();

    const addContact = (name: string, phone: string, email?: string) => {
      if (!contactsMap.has(phone)) {
        contactsMap.set(phone, {
          phone,
          name,
          email,
          type: "customer",
        });
      }
    };

    // Buyers as contacts
    buyers.forEach(b => {
      addContact(b.name, b.contact.mobile, b.contact.email);
    });

    // Sellers as contacts
    sellers.forEach(s => {
      const dummyPhone = `+91 92000 ${s.id.padStart(5, '0')}`;
      addContact(s.name, dummyPhone, s.email);
    });

    // Listing owners as contacts
    mockListings.forEach(l => {
      addContact(l.ownerName, l.ownerPhone);
    });

    console.log(`Found ${contactsMap.size} unique contacts to insert.`);

    const insertedContacts = await db.insert(schema.contacts)
      .values(Array.from(contactsMap.values()))
      .onConflictDoNothing({ target: schema.contacts.phone })
      .returning();

    console.log(`Inserted ${insertedContacts.length} contacts.`);

    // Re-fetch contacts for lookup
    const allContacts = await db.select().from(schema.contacts);
    const contactPhoneLookup = new Map(allContacts.map(c => [c.phone, c]));

    const findContactId = (phone: string) => {
      return contactPhoneLookup.get(phone)?.id ?? null;
    };

    // 3. Seed Buildings
    const buildingsMap = new Map<string, any>();
    
    mockListings.forEach(l => {
      if (!buildingsMap.has(l.buildingName)) {
        buildingsMap.set(l.buildingName, {
          name: l.buildingName,
          locality: l.locality,
          city: "Bangalore",
        });
      }
    });

    console.log(`Found ${buildingsMap.size} buildings.`);
    
    const insertedBuildings = [];
    for (const b of buildingsMap.values()) {
        const [inserted] = await db.insert(schema.buildings).values(b).returning();
        insertedBuildings.push(inserted);
    }
    
    const buildingLookup = new Map(insertedBuildings.map(b => [b.name, b.id]));

    // 4. Seed Units & Listings
    let unitsCount = 0;
    let listingsCount = 0;

    for (const l of mockListings) {
      const buildingId = buildingLookup.get(l.buildingName);
      const ownerId = findTeamMemberId(l.ownerName, l.ownerPhone);
      const agentId = findTeamMemberId(l.listingAgentName);

      if (!buildingId) continue;

      const [unit] = await db.insert(schema.units).values({
        buildingId,
        unitNumber: l.unitNumber,
        bhk: l.bhk,
        floorNumber: l.floorNumber,
        carpetArea: l.carpetArea,
        ownerId: ownerId,
      }).returning();
      unitsCount++;

      await db.insert(schema.listings).values({
        unitId: unit.id,
        listingAgentId: agentId,
        status: l.status,
        askingPrice: l.askingPrice.toString(),
        images: l.images,
        amenitiesJson: l.amenities,
        isVerified: l.isVerified,
        createdAt: new Date(l.createdAt),
      });
      listingsCount++;
    }

    console.log(`Inserted ${unitsCount} units and ${listingsCount} listings.`);

    // 5. Seed Leads (Buyers) — now using contacts instead of profiles
    let leadsCount = 0;
    for (const b of buyers) {
      const contactId = findContactId(b.contact.mobile);
      const agentId = findTeamMemberId(b.assignedAgent.name);

      if (!contactId) {
        console.warn(`Contact not found for buyer ${b.name}`);
        continue;
      }

      await db.insert(schema.leads).values({
        contactId,
        assignedAgentId: agentId,
        source: b.source,
        status: b.status.toLowerCase(),
        requirementJson: {},
        lastContactedAt: new Date(),
        createdAt: new Date(b.addedDate),
      });
      leadsCount++;
    }

    console.log(`Inserted ${leadsCount} leads.`);
    console.log("Seed completed successfully.");

  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
