import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { consultationRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/workspace-auth";
import { rateLimit } from "@/lib/rate-limit";
import { consultationSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = rateLimit(`consultation:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await req.json();
    const parsed = consultationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const [request] = await db
      .insert(consultationRequests)
      .values({
        leadId: data.leadId,
        siteAddress: data.siteAddress,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
        notes: data.notes || null,
      })
      .returning();

    return NextResponse.json({ ok: true, id: request.id });
  } catch (err) {
    console.error("Consultation create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().uuid(),
  paymentStatus: z.enum(["pending", "paid", "refunded"]).optional(),
  meetingStatus: z.enum(["requested", "scheduled", "completed", "cancelled"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "viewer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, paymentStatus, meetingStatus } = parsed.data;

    const updates: Record<string, unknown> = {};
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (meetingStatus) updates.meetingStatus = meetingStatus;

    await db
      .update(consultationRequests)
      .set(updates)
      .where(eq(consultationRequests.id, id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Consultation update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
