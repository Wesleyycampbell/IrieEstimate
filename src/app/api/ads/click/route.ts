import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ads } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const clickSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = clickSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await db
      .update(ads)
      .set({ clicks: sql`${ads.clicks} + 1` })
      .where(eq(ads.id, parsed.data.id));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
