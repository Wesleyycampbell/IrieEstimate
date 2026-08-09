import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ads } from "@/db/schema";
import { eq, and, sql, lte, or, isNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get("page");
  const parishId = req.nextUrl.searchParams.get("parishId");

  if (!page) {
    return NextResponse.json({ error: "page param required" }, { status: 400 });
  }

  const nowStr = new Date().toISOString();

  const activeAds = await db
    .select({
      id: ads.id,
      title: ads.title,
      content: ads.content,
      adType: ads.adType,
      targetUrl: ads.targetUrl,
      targetPages: ads.targetPages,
      sponsorParishIds: ads.sponsorParishIds,
      sponsorName: ads.sponsorName,
    })
    .from(ads)
    .where(
      and(
        eq(ads.isActive, true),
        lte(ads.startDate, new Date(nowStr)),
        or(isNull(ads.endDate), sql`${ads.endDate} >= ${nowStr}`)
      )
    );

  const pageAds = activeAds.filter((ad) => {
    return (ad.targetPages || []).includes(page);
  });

  const localAds = pageAds.filter((a) => a.adType === "local");
  const googleAds = pageAds.filter((a) => a.adType === "google");

  // Sort local ads: parish-matched first
  localAds.sort((a, b) => {
    if (parishId) {
      const aMatch = (a.sponsorParishIds || []).includes(parishId) ? 0 : 1;
      const bMatch = (b.sponsorParishIds || []).includes(parishId) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }
    return 0;
  });

  // Interleave: local first, then google — let the client decide layout
  const sorted = [...localAds, ...googleAds];

  // Increment impressions for returned ads
  const adIds = sorted.map((a) => a.id);
  if (adIds.length > 0) {
    for (const adId of adIds) {
      db.update(ads)
        .set({ impressions: sql`${ads.impressions} + 1` })
        .where(eq(ads.id, adId))
        .execute()
        .catch(() => {});
    }
  }

  return NextResponse.json({ ads: sorted });
}
