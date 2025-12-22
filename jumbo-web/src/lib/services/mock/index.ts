/**
 * Mock Services Index
 * Re-exports all mock integrations for easy importing
 */

export * from "./housing";
export * from "./exotel";
export * from "./whatsapp";

/**
 * Check if we're in mock mode
 * Returns true if API keys are not configured
 */
export function isMockMode(): boolean {
  const hasHousingKey = !!process.env.HOUSING_API_KEY;
  const hasExotelKeys = !!process.env.EXOTEL_SID && !!process.env.EXOTEL_TOKEN;
  const hasWhatsAppKey = !!process.env.WHATSAPP_BUSINESS_TOKEN;

  // If any key is missing, we're in mock mode
  return !hasHousingKey || !hasExotelKeys || !hasWhatsAppKey;
}

/**
 * Get service status for debugging
 */
export function getServiceStatus() {
  return {
    housing: {
      mode: process.env.HOUSING_API_KEY ? "live" : "mock",
      configured: !!process.env.HOUSING_API_KEY,
    },
    exotel: {
      mode: process.env.EXOTEL_SID ? "live" : "mock",
      configured: !!process.env.EXOTEL_SID && !!process.env.EXOTEL_TOKEN,
    },
    whatsapp: {
      mode: process.env.WHATSAPP_BUSINESS_TOKEN ? "live" : "mock",
      configured: !!process.env.WHATSAPP_BUSINESS_TOKEN,
    },
  };
}

