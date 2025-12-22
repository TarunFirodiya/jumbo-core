/**
 * Mock Exotel Telephony Integration Service
 * Used for development and testing without live API keys
 */

export interface ExotelCallPayload {
  call_sid: string;
  from: string;
  to: string;
  direction: "inbound" | "outbound";
  status: "initiated" | "ringing" | "in-progress" | "completed" | "failed" | "busy" | "no-answer";
  duration?: number;
  recording_url?: string;
  start_time: string;
  end_time?: string;
}

export interface ExotelCallResponse {
  success: boolean;
  call_sid: string;
  message: string;
}

/**
 * Simulates initiating an outbound call via Exotel
 */
export async function initiateCall(
  fromNumber: string,
  toNumber: string,
  _agentId: string
): Promise<ExotelCallResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const callSid = `EXT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[Mock Exotel] Initiating call from ${fromNumber} to ${toNumber}`);

  return {
    success: true,
    call_sid: callSid,
    message: "Call initiated successfully",
  };
}

/**
 * Generates a mock call completion webhook payload
 */
export function generateMockCallCompletion(
  callSid: string,
  from: string,
  to: string
): ExotelCallPayload {
  const duration = Math.floor(Math.random() * 300) + 30; // 30-330 seconds

  return {
    call_sid: callSid,
    from,
    to,
    direction: "outbound",
    status: "completed",
    duration,
    recording_url: `https://mock-recordings.exotel.com/${callSid}.mp3`,
    start_time: new Date(Date.now() - duration * 1000).toISOString(),
    end_time: new Date().toISOString(),
  };
}

/**
 * Mock validation of Exotel webhook
 */
export function validateExotelWebhook(
  _signature: string,
  _payload: unknown
): boolean {
  // In mock mode, always return true
  return true;
}

/**
 * Transform Exotel call data to Jumbo communication format
 */
export function transformExotelCall(payload: ExotelCallPayload) {
  return {
    channel: "call" as const,
    direction: payload.direction,
    content: `Call ${payload.status} - Duration: ${payload.duration || 0}s`,
    recordingUrl: payload.recording_url,
    metadata: {
      call_sid: payload.call_sid,
      duration: payload.duration,
      status: payload.status,
      start_time: payload.start_time,
      end_time: payload.end_time,
    },
  };
}

/**
 * Get call recording URL (mock)
 */
export async function getRecordingUrl(callSid: string): Promise<string | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return `https://mock-recordings.exotel.com/${callSid}.mp3`;
}

