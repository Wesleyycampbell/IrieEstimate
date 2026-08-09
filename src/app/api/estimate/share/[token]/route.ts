import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { estimateShares, workspaceSettings } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || !/^[a-f0-9]{32}$/.test(token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const [share] = await db
      .select()
      .from(estimateShares)
      .where(
        and(
          eq(estimateShares.token, token),
          gt(estimateShares.expiresAt, new Date())
        )
      );

    if (!share) {
      return NextResponse.json({ error: "Link expired or not found" }, { status: 404 });
    }

    const [pdfSetting] = await db
      .select()
      .from(workspaceSettings)
      .where(eq(workspaceSettings.key, "pdf_download_enabled"));

    return NextResponse.json({
      estimate: JSON.parse(share.estimateData),
      expiresAt: share.expiresAt,
      pdfEnabled: pdfSetting?.value === "true",
    });
  } catch (err) {
    console.error("Share GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
