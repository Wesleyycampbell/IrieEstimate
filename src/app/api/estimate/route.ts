import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  houseTypes,
  customizationOptions,
  leads,
  leadCustomizations,
  partners,
  leadDistributions,
  parishes,
} from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { leadSchema } from "@/lib/validations";
import { calculateEstimate } from "@/lib/calculate";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = rateLimit(`estimate:${ip}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Fetch house type
    const [houseType] = await db
      .select()
      .from(houseTypes)
      .where(and(eq(houseTypes.id, data.houseTypeId), eq(houseTypes.isActive, true)));

    if (!houseType) {
      return NextResponse.json({ error: "Invalid house type" }, { status: 400 });
    }

    // Fetch parish multiplier
    let parish: { name: string; costMultiplier: string } | null = null;
    if (data.parishId) {
      const [p] = await db
        .select({ name: parishes.name, costMultiplier: parishes.costMultiplier })
        .from(parishes)
        .where(eq(parishes.id, data.parishId));
      if (!p) {
        return NextResponse.json({ error: "Invalid parish" }, { status: 400 });
      }
      parish = p;
    }

    // Fetch selected options
    let selectedOptions: (typeof customizationOptions.$inferSelect)[] = [];
    if (data.selectedOptionIds.length > 0) {
      selectedOptions = await db
        .select()
        .from(customizationOptions)
        .where(inArray(customizationOptions.id, data.selectedOptionIds));
    }

    // Server-side calculation
    const estimate = calculateEstimate(houseType, data.totalSquareFootage, selectedOptions, parish);

    // Capture IP address
    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || null;
    const isLocal = ipAddress ? isJamaicanRequest(ipAddress) : null;

    // Save lead
    const [lead] = await db
      .insert(leads)
      .values({
        contactValue: data.contactValue,
        contactType: data.contactType,
        houseTypeId: data.houseTypeId,
        parishId: data.parishId ?? null,
        totalSquareFootage: data.totalSquareFootage,
        finalEstimatedCost: estimate.totalCost.toFixed(2),
        consentToSharePartners: Boolean(data.consentToSharePartners),
        ipAddress,
        isLocal,
      })
      .returning();

    // Save customization selections
    if (data.selectedOptionIds.length > 0) {
      await db.insert(leadCustomizations).values(
        data.selectedOptionIds.map((optionId) => ({
          leadId: lead.id,
          optionId,
        }))
      );
    }

    // Async lead distribution (fire and forget)
    distributeLead(lead.id, data.parishId ?? null).catch(console.error);

    return NextResponse.json({
      leadId: lead.id,
      estimate: {
        houseType: houseType.name,
        squareFootage: data.totalSquareFootage,
        baseCost: estimate.baseCost,
        modifiers: estimate.modifiers,
        parishName: estimate.parishName,
        parishMultiplier: estimate.parishMultiplier,
        subtotalBeforeParish: estimate.subtotalBeforeParish,
        totalCost: estimate.totalCost,
      },
    });
  } catch (err) {
    console.error("Estimate API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function isAllowedWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname;
    if (
      host === "localhost" ||
      host.startsWith("127.") ||
      host.startsWith("169.254.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host === "metadata.google.internal" ||
      host.endsWith(".internal") ||
      host === "[::1]"
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function distributeLead(leadId: string, parishId: string | null) {
  const activePartners = await db
    .select()
    .from(partners)
    .where(eq(partners.isActive, true));

  // Filter partners: if a partner has parishes_served set, only route leads
  // from those parishes. Partners with an empty array serve all parishes.
  const matchedPartners = activePartners.filter((partner) => {
    if (!partner.parishesServed || partner.parishesServed.length === 0) return true;
    if (!parishId) return true;
    return partner.parishesServed.includes(parishId);
  });

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));

  // Fetch parish name for webhook payload
  let parishName: string | null = null;
  if (lead.parishId) {
    const [p] = await db
      .select({ name: parishes.name })
      .from(parishes)
      .where(eq(parishes.id, lead.parishId));
    parishName = p?.name ?? null;
  }

  for (const partner of matchedPartners) {
    const [dist] = await db
      .insert(leadDistributions)
      .values({ leadId, partnerId: partner.id })
      .returning();

    if (!partner.webhookUrl || !isAllowedWebhookUrl(partner.webhookUrl)) continue;

    try {
      const payload = JSON.stringify({
        leadId: lead.id,
        contact: lead.contactValue,
        contactType: lead.contactType,
        squareFootage: lead.totalSquareFootage,
        estimatedCost: lead.finalEstimatedCost,
        parish: parishName,
      });
      const webhookSecret = process.env.WEBHOOK_SECRET || "";
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = webhookSecret
        ? crypto.createHmac("sha256", webhookSecret).update(`${timestamp}.${payload}`).digest("hex")
        : "";

      const resp = await fetch(partner.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(signature && {
            "X-Webhook-Signature": signature,
            "X-Webhook-Timestamp": timestamp,
          }),
        },
        body: payload,
      });

      await db
        .update(leadDistributions)
        .set({
          status: resp.ok ? "sent" : "failed",
          sentAt: new Date(),
        })
        .where(eq(leadDistributions.id, dist.id));
    } catch {
      await db
        .update(leadDistributions)
        .set({ status: "failed", sentAt: new Date() })
        .where(eq(leadDistributions.id, dist.id));
    }
  }
}

function isJamaicanRequest(ip: string): boolean | null {
  // Jamaica IP ranges (LACNIC allocated blocks)
  // This is a basic check — for production, use a GeoIP database
  const jamaicanPrefixes = [
    "196.1.96.", "196.1.97.", "196.1.98.", "196.1.99.",
    "196.3.56.", "196.3.57.", "196.3.58.", "196.3.59.",
    "200.9.132.", "200.9.133.", "200.9.134.", "200.9.135.",
    "72.252.", "76.5.",
  ];
  if (ip === "127.0.0.1" || ip === "::1") return null;
  return jamaicanPrefixes.some((prefix) => ip.startsWith(prefix));
}
