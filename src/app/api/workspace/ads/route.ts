import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ads, parishes } from "@/db/schema";
import { getSession } from "@/lib/workspace-auth";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const adSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  adType: z.enum(["local", "google"]).default("local"),
  targetUrl: z.string().url().optional().or(z.literal("")),
  targetPages: z.array(z.enum(["blog", "estimate_results"])).min(1),
  sponsorParishIds: z.array(z.string().uuid()).max(3).default([]),
  sponsorName: z.string().max(200).optional().or(z.literal("")),
  startDate: z.string().min(1),
  endDate: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allAds = await db
    .select({
      id: ads.id,
      title: ads.title,
      content: ads.content,
      adType: ads.adType,
      targetUrl: ads.targetUrl,
      targetPages: ads.targetPages,
      sponsorParishIds: ads.sponsorParishIds,
      sponsorName: ads.sponsorName,
      startDate: ads.startDate,
      endDate: ads.endDate,
      isActive: ads.isActive,
      impressions: ads.impressions,
      clicks: ads.clicks,
      createdAt: ads.createdAt,
    })
    .from(ads)
    .orderBy(desc(ads.createdAt));

  const parishList = await db
    .select({ id: parishes.id, name: parishes.name })
    .from(parishes)
    .orderBy(parishes.name);

  return NextResponse.json({ ads: allAds, parishes: parishList });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "viewer") return NextResponse.json({ error: "Insufficient role" }, { status: 403 });

  const body = await req.json();
  const parsed = adSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const [ad] = await db
    .insert(ads)
    .values({
      title: d.title,
      content: d.content,
      adType: d.adType,
      targetUrl: d.targetUrl || null,
      targetPages: d.targetPages,
      sponsorParishIds: d.sponsorParishIds,
      sponsorName: d.sponsorName || null,
      startDate: new Date(d.startDate),
      endDate: d.endDate ? new Date(d.endDate) : null,
      isActive: d.isActive ?? true,
    })
    .returning();

  return NextResponse.json({ ad });
}

const patchAdSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  adType: z.enum(["local", "google"]).optional(),
  targetUrl: z.string().url().optional().or(z.literal("")),
  targetPages: z.array(z.enum(["blog", "estimate_results"])).min(1).optional(),
  sponsorParishIds: z.array(z.string().uuid()).max(3).optional(),
  sponsorName: z.string().max(200).optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "viewer") return NextResponse.json({ error: "Insufficient role" }, { status: 403 });

  const body = await req.json();
  const parsed = patchAdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }
  const { id, ...fields } = parsed.data;

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (fields.title !== undefined) updates.title = fields.title;
  if (fields.content !== undefined) updates.content = fields.content;
  if (fields.adType !== undefined) updates.adType = fields.adType;
  if (fields.targetUrl !== undefined) updates.targetUrl = fields.targetUrl || null;
  if (fields.targetPages !== undefined) updates.targetPages = fields.targetPages;
  if (fields.sponsorParishIds !== undefined) updates.sponsorParishIds = fields.sponsorParishIds;
  if (fields.sponsorName !== undefined) updates.sponsorName = fields.sponsorName || null;
  if (fields.startDate !== undefined) updates.startDate = new Date(fields.startDate);
  if (fields.endDate !== undefined) updates.endDate = fields.endDate ? new Date(fields.endDate) : null;
  if (fields.isActive !== undefined) updates.isActive = fields.isActive;

  const [updated] = await db.update(ads).set(updates).where(eq(ads.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Ad not found" }, { status: 404 });

  return NextResponse.json({ ad: updated });
}

const deleteAdSchema = z.object({ id: z.string().uuid() });

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = deleteAdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await db.delete(ads).where(eq(ads.id, parsed.data.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Ad delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
