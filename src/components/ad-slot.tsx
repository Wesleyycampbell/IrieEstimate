"use client";

import { useEffect, useState, useRef } from "react";

interface AdData {
  id: string;
  title: string;
  content: string;
  adType: string;
  targetUrl: string | null;
  sponsorName: string | null;
}

const shownAdIds = new Set<string>();

export function resetAdTracking() {
  shownAdIds.clear();
}

export default function AdSlot({ page, parishId, minH = "90px" }: { page: string; parishId?: string; minH?: string }) {
  const [pickedAds, setPickedAds] = useState<AdData[]>([]);
  const claimedRef = useRef<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({ page });
    if (parishId) params.set("parishId", parishId);
    fetch(`/api/ads?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const allAds: AdData[] = d.ads || [];

        const available = allAds.filter((a) => !shownAdIds.has(a.id));

        const localAd = available.find((a) => a.adType === "local");
        const googleAd = available.find((a) => a.adType === "google" && a.id !== localAd?.id);

        const picked: AdData[] = [];
        if (localAd) picked.push(localAd);
        if (googleAd) picked.push(googleAd);

        if (picked.length === 0 && available.length > 0) {
          picked.push(available[0]);
        }

        const claimed: string[] = [];
        for (const ad of picked) {
          shownAdIds.add(ad.id);
          claimed.push(ad.id);
        }
        claimedRef.current = claimed;

        setPickedAds(picked);
      })
      .catch(() => {});

    return () => {
      for (const id of claimedRef.current) {
        shownAdIds.delete(id);
      }
    };
  }, [page, parishId]);

  if (pickedAds.length === 0) {
    return (
      <div className="bg-ink-50 border border-ink-200/70 rounded-lg mb-6 flex items-center justify-center text-ink-300 text-xs w-full"
        style={{ minHeight: minH }}>
        Ad Space
      </div>
    );
  }

  function handleClick(ad: AdData) {
    fetch("/api/ads/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ad.id }),
    }).catch(() => {});
  }

  function renderAd(ad: AdData) {
    return (
      <div key={ad.id} className="rounded-lg overflow-hidden border border-ink-200/70 w-full" style={{ minHeight: minH }}>
        {ad.targetUrl ? (
          <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer sponsored" onClick={() => handleClick(ad)}
            className="block w-full"
            dangerouslySetInnerHTML={{ __html: ad.content }} />
        ) : (
          <div className="w-full" dangerouslySetInnerHTML={{ __html: ad.content }} />
        )}
        {ad.sponsorName && (
          <div className="text-[10px] text-ink-300 text-right px-2 py-1 bg-ink-50">Sponsored by {ad.sponsorName}</div>
        )}
      </div>
    );
  }

  if (pickedAds.length === 2) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 w-full">
        {pickedAds.map((ad) => renderAd(ad))}
      </div>
    );
  }

  return <div className="mb-6 w-full">{renderAd(pickedAds[0])}</div>;
}
