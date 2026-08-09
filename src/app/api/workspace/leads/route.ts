import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, houseTypes, parishes } from "@/db/schema";
import { getSession } from "@/lib/workspace-auth";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const allLeads = await db
      .select({
        id: leads.id,
        contactValue: leads.contactValue,
        contactType: leads.contactType,
        houseTypeId: leads.houseTypeId,
        totalSquareFootage: leads.totalSquareFootage,
        parishId: leads.parishId,
        finalEstimatedCost: leads.finalEstimatedCost,
        consentToSharePartners: leads.consentToSharePartners,
        ipAddress: leads.ipAddress,
        isLocal: leads.isLocal,
        createdAt: leads.createdAt,
        houseTypeName: houseTypes.name,
        parishName: parishes.name,
      })
      .from(leads)
      .leftJoin(houseTypes, eq(leads.houseTypeId, houseTypes.id))
      .leftJoin(parishes, eq(leads.parishId, parishes.id))
      .orderBy(desc(leads.createdAt));

    const houseTypeList = await db
      .select({ id: houseTypes.id, name: houseTypes.name })
      .from(houseTypes)
      .orderBy(houseTypes.name);

    const parishList = await db
      .select({ id: parishes.id, name: parishes.name })
      .from(parishes)
      .orderBy(parishes.name);

    return NextResponse.json({ leads: allLeads, houseTypes: houseTypeList, parishes: parishList });
  } catch (err) {
    console.error("Leads GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().uuid(),
  contactValue: z.string().min(1).max(200).optional(),
  contactType: z.enum(["email", "phone"]).optional(),
  totalSquareFootage: z.number().int().positive().max(50000).optional(),
  finalEstimatedCost: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  parishId: z.string().uuid().optional().or(z.literal("")),
  houseTypeId: z.string().uuid().optional(),
  consentToSharePartners: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "viewer") return NextResponse.json({ error: "Insufficient role" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { id, ...fields } = parsed.data;
    const updates: Record<string, unknown> = {};
    if (fields.contactValue !== undefined) updates.contactValue = fields.contactValue;
    if (fields.contactType !== undefined) updates.contactType = fields.contactType;
    if (fields.totalSquareFootage !== undefined) updates.totalSquareFootage = fields.totalSquareFootage;
    if (fields.finalEstimatedCost !== undefined) updates.finalEstimatedCost = fields.finalEstimatedCost;
    if (fields.parishId !== undefined) updates.parishId = fields.parishId || null;
    if (fields.houseTypeId !== undefined) updates.houseTypeId = fields.houseTypeId;
    if (fields.consentToSharePartners !== undefined) updates.consentToSharePartners = fields.consentToSharePartners;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updated] = await db.update(leads).set(updates).where(eq(leads.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    return NextResponse.json({ lead: updated });
  } catch (err) {
    console.error("Leads PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await db.delete(leads).where(eq(leads.id, parsed.data.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Leads DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
