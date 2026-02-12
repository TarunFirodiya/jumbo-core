import { NextRequest, NextResponse } from "next/server";
import * as lifecycleService from "@/services/lead-lifecycle.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/process-lifecycle
 * Daily cron job to process buyer lead time-decay transitions.
 * Secured with CRON_SECRET header.
 *
 * Usage (Vercel Cron):
 *   Schedule: "0 1 * * *" (daily at 1:00 AM IST)
 *   Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET is not configured");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const token = authHeader?.replace("Bearer ", "");
    if (token !== cronSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Process time-decay transitions
    const result = await lifecycleService.processTimeDecay();

    console.log(
      `[lifecycle-cron] Processed: ${result.preVisitDecayed} pre-visit, ${result.postVisitDecayed} post-visit, ${result.total} total`
    );

    return NextResponse.json({
      success: true,
      result,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[lifecycle-cron] Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
