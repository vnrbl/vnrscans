import { NextRequest, NextResponse } from "next/server";
import { $syncDueScheduledSeries, $scanAllSeriesTimings } from "@/lib/api/scraper.actions";

export const maxDuration = 300; // Allow up to 5 minutes on pro / serverless runtimes
export const dynamic = "force-dynamic";

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
    const secretParam = searchParams.get("secret");

    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret) {
      const providedSecret = authHeader?.replace(/^Bearer\s+/i, "") || secretParam;
      if (providedSecret !== expectedSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (scanTimingOnly) {
      const scanResult = await $scanAllSeriesTimings({
        data: { accessToken: "cron-internal" },
      });
      return NextResponse.json(scanResult);
    }

    const result = await $syncDueScheduledSeries({
      data: {
        accessToken: "cron-internal",
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
