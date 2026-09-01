import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { estimateShares } from "@/db/schema";
import { lt } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await db
      .delete(estimateShares)
      .where(lt(estimateShares.expiresAt, new Date()))
      .returning({ id: estimateShares.id });

    return NextResponse.json({ deleted: result.length });
  } catch (err) {
    console.error("Cleanup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
