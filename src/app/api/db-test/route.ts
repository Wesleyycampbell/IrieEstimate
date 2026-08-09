import { NextResponse } from "next/server";
import { sql } from "@/db";

export async function GET() {
  try {
    const result = await sql`select now() as now`;
    const now = Array.isArray(result) && result.length > 0 ? result[0].now : null;
    return NextResponse.json({ ok: true, now });
  } catch (err) {
    console.error("DB test error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
