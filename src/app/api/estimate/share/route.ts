import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { estimateShares } from "@/db/schema";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

const shareSchema = z.object({
  leadId: z.string().uuid(),
  estimateData: z.object({
    houseType: z.string(),
    squareFootage: z.number(),
    baseCost: z.number(),
    modifiers: z.array(z.object({ name: z.string(), amount: z.number(), type: z.string() })),
    parishName: z.string().nullable(),
    parishMultiplier: z.number(),
    subtotalBeforeParish: z.number(),
    totalCost: z.number(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = rateLimit(`share:${ip}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = shareSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(estimateShares).values({
      token,
      leadId: parsed.data.leadId,
      estimateData: JSON.stringify(parsed.data.estimateData),
      expiresAt,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

    return NextResponse.json({
      shareUrl: `${siteUrl}/estimate/share/${token}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("Share create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
