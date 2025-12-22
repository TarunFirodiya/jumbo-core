/**
 * Mock WhatsApp Business API Integration Service
 * Used for development and testing without live API keys
 */

export interface WhatsAppMessagePayload {
  message_id: string;
  from: string;
  to: string;
  type: "text" | "image" | "document" | "template";
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read" | "failed";
}

export interface WhatsAppSendResponse {
  success: boolean;
  message_id: string;
  status: string;
}

/**
 * Simulates sending a WhatsApp message
 */
export async function sendMessage(
  to: string,
  content: string,
  _agentId: string
): Promise<WhatsAppSendResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const messageId = `WA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[Mock WhatsApp] Sending message to ${to}: ${content.substring(0, 50)}...`);

  return {
    success: true,
    message_id: messageId,
    status: "sent",
  };
}

/**
 * Simulates sending a template message (for notifications)
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  templateParams: Record<string, string>
): Promise<WhatsAppSendResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const messageId = `WA_TPL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[Mock WhatsApp] Sending template "${templateName}" to ${to}`);
  console.log(`[Mock WhatsApp] Template params:`, templateParams);

  return {
    success: true,
    message_id: messageId,
    status: "sent",
  };
}

/**
 * Available message templates
 */
export const MESSAGE_TEMPLATES = {
  VISIT_CONFIRMATION: "visit_confirmation",
  VISIT_REMINDER: "visit_reminder",
  VISIT_OTP: "visit_otp",
  LEAD_WELCOME: "lead_welcome",
  LISTING_UPDATE: "listing_update",
} as const;

/**
 * Generate template content for preview
 */
export function getTemplatePreview(
  templateName: string,
  params: Record<string, string>
): string {
  const templates: Record<string, string> = {
    [MESSAGE_TEMPLATES.VISIT_CONFIRMATION]: `Hi {{name}}, your property visit is confirmed for {{date}} at {{time}}. Address: {{address}}. Your OTP is: {{otp}}`,
    [MESSAGE_TEMPLATES.VISIT_REMINDER]: `Reminder: Your property visit is scheduled for tomorrow at {{time}}. Location: {{address}}`,
    [MESSAGE_TEMPLATES.VISIT_OTP]: `Your Jumbo Homes visit verification OTP is: {{otp}}. Please share this with the agent upon arrival.`,
    [MESSAGE_TEMPLATES.LEAD_WELCOME]: `Welcome to Jumbo Homes, {{name}}! We've received your inquiry and will connect you with a property expert shortly.`,
    [MESSAGE_TEMPLATES.LISTING_UPDATE]: `Update on your property listing at {{address}}: Status changed to {{status}}.`,
  };

  let content = templates[templateName] || "Template not found";

  Object.entries(params).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
  });

  return content;
}

/**
 * Generates a mock incoming message webhook payload
 */
export function generateMockIncomingMessage(
  from: string,
  content: string
): WhatsAppMessagePayload {
  return {
    message_id: `WA_IN_${Date.now()}`,
    from,
    to: "+919876543210", // Jumbo business number
    type: "text",
    content,
    timestamp: new Date().toISOString(),
    status: "delivered",
  };
}

/**
 * Transform WhatsApp message to Jumbo communication format
 */
export function transformWhatsAppMessage(payload: WhatsAppMessagePayload) {
  return {
    channel: "whatsapp" as const,
    direction: payload.to.startsWith("+91") ? "outbound" : "inbound",
    content: payload.content,
    metadata: {
      wa_message_id: payload.message_id,
      message_type: payload.type,
      status: payload.status,
    },
  };
}

