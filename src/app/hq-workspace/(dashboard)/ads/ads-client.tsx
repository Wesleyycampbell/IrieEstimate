"use client";

import { useEffect, useState } from "react";

interface Ad {
  id: string;
  title: string;
  content: string;
  adType: string;
  targetUrl: string | null;
  targetPages: string[];
  sponsorParishIds: string[];
  sponsorName: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
}

interface Parish {
  id: string;
  name: string;
}

type View = "list" | "create" | "edit";

const PAGE_OPTIONS = [
  { value: "blog", label: "Blog" },
  { value: "estimate_results", label: "Estimate Results" },
];

function Tooltip({ text, visible }: { text: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute z-50 bottom-full left-0 mb-1.5 w-64 sm:w-72 p-2.5 bg-ink-800 text-white text-xs leading-relaxed rounded-lg shadow-lg">
      {text}
      <div className="absolute top-full left-4 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-ink-800" />
    </div>
  );
}

function InfoIcon({ tooltip, showTooltips }: { tooltip: string; showTooltips: boolean }) {
  const [hover, setHover] = useState(false);
  if (!showTooltips) return null;
  return (
    <span
      className="relative inline-flex items-center ml-1.5 cursor-help"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => setHover(!hover)}
    >
      <span className="w-4 h-4 rounded-full bg-ink-200 text-ink-500 text-[10px] font-bold flex items-center justify-center">?</span>
      <Tooltip text={tooltip} visible={hover} />
    </span>
  );
}

export default function AdsClient() {
  const [adsList, setAdsList] = useState<Ad[]>([]);
  const [parishList, setParishList] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showTooltips, setShowTooltips] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [adType, setAdType] = useState<"local" | "google">("local");
  const [targetUrl, setTargetUrl] = useState("");
  const [targetPages, setTargetPages] = useState<string[]>([]);
  const [sponsorParishIds, setSponsorParishIds] = useState<string[]>([]);
  const [sponsorName, setSponsorName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function loadAds() {
    setLoading(true);
    try {
      const res = await fetch("/api/workspace/ads");
      const data = await res.json();
      setAdsList(data.ads || []);
      setParishList(data.parishes || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAds(); }, []);

  function resetForm() {
    setTitle(""); setContent(""); setAdType("local"); setTargetUrl(""); setTargetPages([]);
    setSponsorParishIds([]); setSponsorName(""); setStartDate(""); setEndDate("");
    setIsActive(true); setError(""); setEditingAd(null);
  }

  function openCreate() {
    resetForm();
    setStartDate(new Date().toISOString().slice(0, 10));
    setView("create");
  }

  function openEdit(ad: Ad) {
    setEditingAd(ad);
    setTitle(ad.title);
    setContent(ad.content);
    setAdType(ad.adType as "local" | "google");
    setTargetUrl(ad.targetUrl || "");
    setTargetPages(ad.targetPages || []);
    setSponsorParishIds(ad.sponsorParishIds || []);
    setSponsorName(ad.sponsorName || "");
    setStartDate(ad.startDate ? new Date(ad.startDate).toISOString().slice(0, 10) : "");
    setEndDate(ad.endDate ? new Date(ad.endDate).toISOString().slice(0, 10) : "");
    setIsActive(ad.isActive);
    setError("");
    setView("edit");
  }

  function togglePage(page: string) {
    setTargetPages((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]
    );
  }

  function toggleParish(id: string) {
    setSponsorParishIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) { setError("Title and content are required."); return; }
    if (targetPages.length === 0) { setError("Select at least one target page."); return; }
    if (!startDate) { setError("Start date is required."); return; }

    setSaving(true); setError("");
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        adType,
        targetUrl: targetUrl.trim(),
        targetPages,
        sponsorParishIds,
        sponsorName: sponsorName.trim(),
        startDate,
        endDate,
        isActive,
      };

      if (view === "create") {
        const res = await fetch("/api/workspace/ads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to create ad"); setSaving(false); return; }
      } else if (view === "edit" && editingAd) {
        const res = await fetch("/api/workspace/ads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingAd.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to update ad"); setSaving(false); return; }
      }

      resetForm(); setView("list"); await loadAds();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ad? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/workspace/ads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error || "Failed"); return; }
      await loadAds();
    } catch { alert("Network error"); }
  }

  async function toggleActive(ad: Ad) {
    try {
      await fetch("/api/workspace/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ad.id, isActive: !ad.isActive }),
      });
      await loadAds();
    } catch { alert("Failed to update"); }
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-JM", { year: "numeric", month: "short", day: "numeric" });

  const parishNames = (ids: string[]) => {
    if (!ids || ids.length === 0) return "All parishes";
    return ids
      .map((id) => parishList.find((p) => p.id === id)?.name || "Unknown")
      .join(", ");
  };

  const isExpired = (ad: Ad) => ad.endDate && new Date(ad.endDate) < new Date();
  const isScheduled = (ad: Ad) => new Date(ad.startDate) > new Date();

  // EDITOR VIEW
  if (view === "create" || view === "edit") {
    return (
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">{view === "create" ? "New Ad" : "Edit Ad"}</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-400">
              <input type="checkbox" checked={showTooltips} onChange={(e) => setShowTooltips(e.target.checked)}
                className="w-4 h-4 accent-ink-800 rounded" />
              Help tips
            </label>
            <button onClick={() => { resetForm(); setView("list"); }} className="text-sm text-ink-400 hover:text-ink-600">Cancel</button>
          </div>
        </div>

        {showTooltips && view === "create" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-2">
            <p className="font-semibold">How to create an ad:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
              <li><strong>Title</strong> — internal name, not shown to visitors</li>
              <li><strong>Ad Type</strong> — "Local" for your own ads, "Google" for Google AdSense or external ad network code</li>
              <li><strong>Content</strong> — paste HTML for banners, or Google AdSense snippet for Google ads</li>
              <li><strong>Click URL</strong> — where the ad links to (leave blank for Google ads, they handle clicks)</li>
              <li><strong>Pages</strong> — choose which pages show this ad (Blog, Estimate Results, or both)</li>
              <li><strong>Parishes</strong> — select up to 3 parishes to prioritise this ad for visitors in those areas</li>
              <li><strong>Dates</strong> — control when the ad starts and optionally when it expires</li>
            </ol>
            <p className="text-xs">Where two ad slots exist, one shows a local ad and the other shows a Google ad.</p>
          </div>
        )}

        <div className="bg-white rounded-lg border border-ink-200/70 p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">
              Ad Type
              <InfoIcon tooltip="Local ads are your own partner/sponsor ads with custom HTML. Google ads use AdSense or external ad network code that manages its own display and clicks." showTooltips={showTooltips} />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setAdType("local")}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
                  adType === "local"
                    ? "border-ink-800 bg-ink-50 text-ink-800"
                    : "border-ink-200/70 text-ink-500 hover:border-ink-300"
                }`}>
                Local Ad
              </button>
              <button onClick={() => setAdType("google")}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
                  adType === "google"
                    ? "border-ink-800 bg-ink-50 text-ink-800"
                    : "border-ink-200/70 text-ink-500 hover:border-ink-300"
                }`}>
                Google / External
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">
              Title
              <InfoIcon tooltip="Internal reference name. Visitors never see this — it helps you identify the ad in the list." showTooltips={showTooltips} />
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none"
              placeholder={adType === "local" ? "e.g. Island Hardware Summer Sale" : "e.g. Google Ad Slot — Blog"} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">
              {adType === "local" ? "Ad Content" : "Ad Code"}
              <span className="text-ink-300 font-normal ml-1">
                ({adType === "local" ? "HTML banner displayed to visitors" : "paste your AdSense or ad network snippet"})
              </span>
              <InfoIcon tooltip={adType === "local"
                ? "Write HTML for your ad banner. Use inline styles for colors, backgrounds, and layout. Images should use full URLs. The ad automatically scales to fit mobile and desktop."
                : "Paste the full ad code snippet from Google AdSense, Media.net, or another ad network. The code will be rendered as-is on the page."
              } showTooltips={showTooltips} />
            </label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5}
              className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none resize-y"
              placeholder={adType === "local"
                ? '<div style="background:#1a5c2e;padding:20px;color:#fff;text-align:center">Your ad here</div>'
                : '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>\n<!-- Your ad unit code -->'
              } />
          </div>

          {adType === "local" && (
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">
                Click URL
                <span className="text-ink-300 font-normal ml-1">(optional)</span>
                <InfoIcon tooltip="When a visitor clicks the ad, they are taken to this URL. Opens in a new tab. Leave blank if your HTML already contains links." showTooltips={showTooltips} />
              </label>
              <input type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none"
                placeholder="https://sponsor-site.com" />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              Display on Pages
              <InfoIcon tooltip="Choose which pages show this ad. Select one or both. Where two ad slots exist on a page, one will show a local ad and one a Google/external ad." showTooltips={showTooltips} />
            </label>
            <div className="flex flex-wrap gap-2">
              {PAGE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => togglePage(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
                    targetPages.includes(opt.value)
                      ? "border-ink-800 bg-ink-50 text-ink-800"
                      : "border-ink-200/70 text-ink-500 hover:border-ink-300"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {adType === "local" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">
                    Sponsor Name
                    <span className="text-ink-300 font-normal ml-1">(optional)</span>
                    <InfoIcon tooltip="Shown as 'Sponsored by [name]' below the ad. Builds trust with visitors and gives credit to the partner." showTooltips={showTooltips} />
                  </label>
                  <input type="text" value={sponsorName} onChange={(e) => setSponsorName(e.target.value)}
                    className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none"
                    placeholder="Partner company name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">
                    Target Parishes
                    <span className="text-ink-300 font-normal ml-1">(up to 3)</span>
                    <InfoIcon tooltip="Select up to 3 parishes. Visitors from these parishes see this ad first. If none selected, the ad shows equally to all visitors." showTooltips={showTooltips} />
                  </label>
                  <div className="text-xs text-ink-400 mb-2">
                    {sponsorParishIds.length === 0
                      ? "No parishes selected — shows to everyone"
                      : `${sponsorParishIds.length}/3 selected: ${parishNames(sponsorParishIds)}`}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto border border-ink-200/70 rounded-lg p-2.5">
                    {parishList.map((p) => {
                      const selected = sponsorParishIds.includes(p.id);
                      const disabled = !selected && sponsorParishIds.length >= 3;
                      return (
                        <button
                          key={p.id}
                          onClick={() => toggleParish(p.id)}
                          disabled={disabled}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                            selected
                              ? "bg-ink-800 text-cane-400"
                              : disabled
                              ? "bg-ink-50 text-ink-300 cursor-not-allowed"
                              : "bg-ink-50 text-ink-600 hover:bg-ink-100"
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">
                Start Date
                <InfoIcon tooltip="The ad will start showing on this date. Set to today to make it live immediately." showTooltips={showTooltips} />
              </label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">
                End Date
                <span className="text-ink-300 font-normal ml-1">(optional)</span>
                <InfoIcon tooltip="Leave blank for ads that run indefinitely. Set a date to automatically stop the ad at midnight on that day." showTooltips={showTooltips} />
              </label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 accent-ink-800 rounded" />
            <span className="text-sm font-medium text-ink-700">Active</span>
            <InfoIcon tooltip="Inactive ads are saved but not shown to visitors. Toggle this to pause or resume an ad without deleting it." showTooltips={showTooltips} />
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-ink-800 text-cane-400 rounded-lg font-bold text-sm hover:bg-ink-900 transition disabled:opacity-50">
            {saving ? "Saving..." : view === "create" ? "Create Ad" : "Save Changes"}
          </button>
          <button onClick={() => { resetForm(); setView("list"); }}
            className="px-5 py-2.5 text-sm font-semibold text-ink-400 hover:underline">Cancel</button>
        </div>
      </div>
    );
  }

  // LIST VIEW
  const localCount = adsList.filter((a) => a.adType === "local").length;
  const googleCount = adsList.filter((a) => a.adType === "google").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-400">
          <span>{adsList.length} ad{adsList.length !== 1 ? "s" : ""}</span>
          {localCount > 0 && <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-bold">{localCount} Local</span>}
          {googleCount > 0 && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">{googleCount} Google</span>}
        </div>
        <button onClick={openCreate}
          className="px-5 py-2 bg-ink-800 text-cane-400 rounded-lg text-sm font-bold hover:bg-ink-900 transition shrink-0">
          + New Ad
        </button>
      </div>

      {loading ? (
        <div className="text-ink-400 text-sm">Loading...</div>
      ) : adsList.length === 0 ? (
        <div className="bg-white rounded-lg border border-ink-200/70 p-6 sm:p-8 text-center">
          <p className="text-ink-400 mb-4">No ads yet.</p>
          <button onClick={openCreate}
            className="px-5 py-2 bg-ink-800 text-cane-400 rounded-lg text-sm font-bold hover:bg-ink-900">
            Create your first ad
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {adsList.map((ad) => (
            <div key={ad.id} className={`bg-white rounded-lg border border-ink-200/70 p-3 sm:p-4 ${isExpired(ad) ? "opacity-60" : ""}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm truncate">{ad.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                      ad.adType === "google" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
                    }`}>
                      {ad.adType === "google" ? "Google" : "Local"}
                    </span>
                    <button onClick={() => toggleActive(ad)}
                      className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                        ad.isActive ? "bg-green-100 text-green-700" : "bg-ink-100 text-ink-400"
                      }`}>
                      {ad.isActive ? "Active" : "Inactive"}
                    </button>
                    {isExpired(ad) && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">Expired</span>}
                    {isScheduled(ad) && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-600">Scheduled</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400 mt-1">
                    <span>Pages: {ad.targetPages.map((p) => p === "estimate_results" ? "Estimate" : "Blog").join(", ")}</span>
                    <span>Parishes: {parishNames(ad.sponsorParishIds)}</span>
                    {ad.sponsorName && <span>Sponsor: {ad.sponsorName}</span>}
                    <span>{fmtDate(ad.startDate)}{ad.endDate ? ` — ${fmtDate(ad.endDate)}` : " — No end"}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs font-semibold">
                    <span className="text-ink-500">{ad.impressions.toLocaleString()} impressions</span>
                    <span className="text-ink-500">{ad.clicks.toLocaleString()} clicks</span>
                    {ad.impressions > 0 && (
                      <span className="text-cane-600">{((ad.clicks / ad.impressions) * 100).toFixed(1)}% CTR</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => openEdit(ad)} className="text-xs font-semibold text-cane-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(ad.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
