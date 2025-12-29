import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { BuyerDetailView } from "@/components/buyers/detail/buyer-detail-view";
import type { BuyerDetail } from "@/components/buyers/detail/buyer-detail-view";

export default async function BuyerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Basic UUID regex validation to prevent DB errors if invalid ID passed
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return <BuyerDetailView buyer={null} id={id} />;
  }

  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, id),
    with: {
      profile: true,
      assignedAgent: true,
    }
  });

  if (!lead) {
     return <BuyerDetailView buyer={null} id={id} />;
  }

  // Transform to BuyerDetail
  const budgetMin = lead.requirementJson?.budget_min;
  const budgetMax = lead.requirementJson?.budget_max;
  
  let budgetStr = "Not specified";
  if (budgetMin && budgetMax) {
      if (budgetMin >= 10000000) {
           budgetStr = `₹${(budgetMin/10000000).toFixed(1)}Cr - ₹${(budgetMax/10000000).toFixed(1)}Cr`;
      } else {
           budgetStr = `₹${(budgetMin/100000).toFixed(0)}L - ₹${(budgetMax/100000).toFixed(0)}L`;
      }
  } else if (budgetMin) {
      budgetStr = `Min ₹${(budgetMin/100000).toFixed(0)}L`;
  } else if (budgetMax) {
      budgetStr = `Max ₹${(budgetMax/100000).toFixed(0)}L`;
  }

  const buyer: BuyerDetail = {
    id: lead.id,
    name: lead.profile?.fullName || "Unknown",
    location: lead.profile?.territoryId || "Unknown Location",
    addedDate: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    status: lead.status?.charAt(0).toUpperCase() + (lead.status?.slice(1) || "") || "New",
    assignedAgent: {
      name: lead.assignedAgent?.fullName || "Unassigned",
      avatar: undefined, 
      initials: lead.assignedAgent?.fullName?.split(" ").map(n => n[0]).join("") || "??",
    },
    lastContact: lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString() : "Never",
    nextFollowUp: "Pending", // TODO: Fetch from tasks
    source: lead.source || "Unknown",
    contact: {
      whatsapp: lead.profile?.phone || "",
      mobile: lead.profile?.phone || "",
      email: lead.profile?.email || "",
    },
    preferences: {
      budget: budgetStr,
      type: "Apartment", // TODO: Extract from requirementJson if available or schema update
      timeline: "Immediate", // TODO: Add to schema
    },
    activityLog: [
       {
        type: "lead",
        title: "Lead Created",
        date: lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "",
        description: `Imported from ${lead.source || "Unknown"}.`,
        iconName: "userPlus"
      }
    ]
  };

  return <BuyerDetailView buyer={buyer} id={id} />;
}
