/**
 * Mock Housing.com Integration Service
 * Used for development and testing without live API keys
 */

export interface HousingLeadPayload {
  lead_id: string;
  name: string;
  phone: string;
  email?: string;
  property_type?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_localities?: string[];
  bhk?: number[];
  timestamp: string;
}

export interface HousingWebhookResponse {
  success: boolean;
  message: string;
  jumbo_lead_id?: string;
}

/**
 * Simulates receiving a lead webhook from Housing.com
 * In production, this would be called by the actual Housing.com API
 */
export function generateMockHousingLead(): HousingLeadPayload {
  const names = [
    "Rahul Sharma",
    "Priya Patel",
    "Amit Kumar",
    "Sneha Reddy",
    "Vikram Singh",
  ];
  const localities = [
    "Whitefield",
    "Koramangala",
    "HSR Layout",
    "Indiranagar",
    "Marathahalli",
  ];

  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomPhone = `+91${Math.floor(9000000000 + Math.random() * 999999999)}`;

  return {
    lead_id: `HSG_${Date.now()}`,
    name: randomName,
    phone: randomPhone,
    email: `${randomName.toLowerCase().replace(" ", ".")}@example.com`,
    property_type: "apartment",
    budget_min: 5000000,
    budget_max: 15000000,
    preferred_localities: [
      localities[Math.floor(Math.random() * localities.length)],
      localities[Math.floor(Math.random() * localities.length)],
    ],
    bhk: [2, 3],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock validation of Housing.com webhook signature
 * In production, verify using shared secret
 */
export function validateHousingWebhook(
  _signature: string,
  _payload: unknown
): boolean {
  // In mock mode, always return true
  // Production: verify HMAC signature
  return true;
}

/**
 * Transform Housing.com lead format to Jumbo internal format
 */
export function transformHousingLead(payload: HousingLeadPayload) {
  return {
    source: "Housing.com",
    externalId: payload.lead_id,
    profile: {
      fullName: payload.name,
      phone: payload.phone,
      email: payload.email,
    },
    requirements: {
      bhk: payload.bhk,
      budget_min: payload.budget_min,
      budget_max: payload.budget_max,
      localities: payload.preferred_localities,
    },
    receivedAt: payload.timestamp,
  };
}

