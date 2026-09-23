import { NextRequest, NextResponse } from "next/server";
import { $syncDueScheduledSeries, $scanAllSeriesTimings } from "@/lib/api/scraper.actions";

export const maxDuration = 300; // Allow up to 5 minutes on pro / serverless runtimes
export const dynamic = "force-dynamic";

function matchesSecret(supplied: string, expected: string) {
  if (supplied.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) {
    difference |= supplied.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

export async function GET(req: NextRequest) {
  return handleScheduledImport(req);
}

export async function POST(req: NextRequest) {
  return handleScheduledImport(req);
}

async function handleScheduledImport(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceAll = searchParams.get("forceAll") === "true";
    const scanTimingOnly = searchParams.get("scanTimingOnly") === "true";
    const authHeader = req.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;
    const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
    const providedSecret = bearerMatch?.[1];

    if (!expectedSecret || expectedSecret.length < 32 || !providedSecret || !matchesSecret(providedSecret, expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized: Invalid or missing CRON_SECRET" }, { status: 401 });
    }

    if (scanTimingOnly) {
      const scanResult = await $scanAllSeriesTimings({
        data: { accessToken: expectedSecret },
      });
      return NextResponse.json(scanResult);
    }

    const result = await $syncDueScheduledSeries({
      data: {
        accessToken: expectedSecret,
        forceAll,
        maxChaptersPerSeries: 25,
      },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[CronImportScheduled] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Scheduled import failed" },
      { status: 500 }
    );
  }
}
