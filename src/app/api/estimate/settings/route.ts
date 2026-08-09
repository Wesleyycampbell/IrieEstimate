import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspaceSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const [pdfSetting] = await db
      .select()
      .from(workspaceSettings)
      .where(eq(workspaceSettings.key, "pdf_download_enabled"));

    return NextResponse.json(
      { pdfEnabled: pdfSetting?.value === "true" },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch {
    return NextResponse.json({ pdfEnabled: false });
  }
}
