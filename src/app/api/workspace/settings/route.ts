import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workspaceSettings } from "@/db/schema";
import { getSession } from "@/lib/workspace-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.select().from(workspaceSettings);
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;

  return NextResponse.json({ settings: map });
}

const updateSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(1000),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    await db
      .insert(workspaceSettings)
      .values({ key: parsed.data.key, value: parsed.data.value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: workspaceSettings.key,
        set: { value: parsed.data.value, updatedAt: new Date() },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Settings update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
