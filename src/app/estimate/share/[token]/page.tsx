"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface EstimateResult {
  houseType: string;
  squareFootage: number;
  baseCost: number;
  modifiers: { name: string; amount: number; type: string }[];
  parishName: string | null;
  parishMultiplier: number;
  subtotalBeforeParish: number;
  totalCost: number;
}

export default function SharedEstimatePage() {
  const params = useParams();
  const token = params.token as string;
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [pdfEnabled, setPdfEnabled] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch(`/api/estimate/share/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "expired" : "error");
        return r.json();
      })
      .then((data) => {
        setEstimate(data.estimate);
        setPdfEnabled(data.pdfEnabled);
        setExpiresAt(data.expiresAt);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message === "expired" ? "This link has expired." : "Something went wrong.");
        setLoading(false);
      });
  }, [token]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-JM", { style: "currency", currency: "JMD", maximumFractionDigits: 0 }).format(n);

  async function downloadPdf() {
    if (!estimate) return;
    setGenerating(true);

    const content = buildPdfHtml(estimate, fmt);
    const printWindow = window.open("", "_blank");
    if (!printWindow) { setGenerating(false); return; }

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      setGenerating(false);
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-ink-200 border-t-ink-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16 flex-1 text-center">
          <div className="text-5xl font-bold text-ink-200 mb-4">
            {error.includes("expired") ? "Expired" : "Error"}
          </div>
          <h1 className="text-xl font-bold mb-2">
            {error.includes("expired") ? "This estimate link has expired" : "Something went wrong"}
          </h1>
          <p className="text-ink-400 text-sm mb-8 max-w-sm mx-auto">
            {error.includes("expired")
              ? "Shared estimate links are valid for 24 hours. Request a new link from the person who shared this estimate."
              : "Please try again later."}
          </p>
          <Link
            href="/estimate"
            className="px-6 py-2.5 bg-ink-800 text-cane-400 rounded-lg font-bold text-sm hover:bg-ink-900 transition"
          >
            Create your own estimate
          </Link>
        </main>
      </>
    );
  }

  if (!estimate) return null;

  const timeLeft = expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 3600000)) : 0;

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-cane-100 text-cane-700 rounded-full text-xs font-bold">Shared Estimate</span>
              {timeLeft > 0 && (
                <span className="text-xs text-ink-300">{timeLeft}h remaining</span>
              )}
            </div>
          </div>
          {pdfEnabled && (
            <button
              onClick={downloadPdf}
              disabled={generating}
              className="px-4 py-2 bg-ink-800 text-cane-400 rounded-lg text-sm font-bold hover:bg-ink-900 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {generating ? "Generating..." : "Download PDF"}
            </button>
          )}
        </div>

        <EstimateBreakdown estimate={estimate} fmt={fmt} />

        <div className="mt-8 bg-ink-800 text-white rounded-lg p-6">
          <h3 className="font-bold text-lg mb-2">Get your own estimate</h3>
          <p className="text-ink-300 text-sm mb-4">
            Create a personalised construction cost estimate for your Jamaican build project.
          </p>
          <Link
            href="/estimate"
            className="inline-block px-6 py-2.5 bg-cane-400 text-ink-800 rounded-lg font-bold text-sm hover:bg-cane-500 transition"
          >
            Start your estimate
          </Link>
        </div>
      </main>
    </>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-ink-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink-800 text-base">
          <span className="w-8 h-8 bg-ink-800 rounded-md flex items-center justify-center text-cane-400 text-[11px] font-bold">
            IE
          </span>
          IrieEstimate
        </Link>
        <Link
          href="/estimate"
          className="px-5 py-2.5 min-h-[44px] flex items-center bg-cane-400 text-ink-800 rounded-lg font-semibold text-base hover:bg-cane-500 transition"
        >
          Get Estimate
        </Link>
      </div>
    </header>
  );
}

function EstimateBreakdown({
  estimate,
  fmt,
}: {
  estimate: EstimateResult;
  fmt: (n: number) => string;
}) {
  const perSqFt = Math.round(estimate.totalCost / estimate.squareFootage);

  return (
    <>
      {/* Hero card */}
      <div className="bg-ink-800 text-white rounded-lg p-6 sm:p-8 mb-6">
        <div className="text-center">
          <div className="text-sm text-ink-300 mb-1">
            {estimate.houseType} &middot; {estimate.squareFootage.toLocaleString()} sq ft
            {estimate.parishName && <> &middot; {estimate.parishName}</>}
          </div>
          <div className="text-4xl sm:text-5xl font-bold mb-2 tabular-nums">{fmt(estimate.totalCost)}</div>
          <div className="text-ink-300 text-sm">
            USD ${Math.round(estimate.totalCost / 156).toLocaleString()} &middot; {fmt(perSqFt)} per sq ft &middot; labour only
          </div>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="bg-white rounded-lg border border-ink-200/70 p-5 sm:p-6 mb-6">
        <h3 className="font-bold text-sm mb-4">Full Cost Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-ink-700 font-medium">Base cost</span>
              <span className="text-ink-300 ml-2 text-xs">
                {estimate.squareFootage.toLocaleString()} sq ft &times; {fmt(Math.round(estimate.baseCost / estimate.squareFootage))}/sqft
              </span>
            </div>
            <span className="font-semibold tabular-nums">{fmt(estimate.baseCost)}</span>
          </div>

          {estimate.modifiers.length > 0 && (
            <div className="border-t border-ink-100 pt-3">
              <div className="text-xs text-ink-400 font-semibold uppercase tracking-wider mb-2">Customisations</div>
              {estimate.modifiers.map((m, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <div>
                    <span className="text-ink-500">{m.name}</span>
                    <span className="text-ink-300 ml-2 text-xs">
                      {m.type === "percentage" ? "%" : m.type === "per_sq_ft" ? "/sqft" : "flat"}
                    </span>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {m.amount >= 0 ? "+" : ""}{fmt(Math.round(m.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}

          {estimate.parishName && estimate.parishMultiplier !== 1 && (
            <div className="border-t border-ink-100 pt-3">
              <div className="flex justify-between text-sm py-1">
                <span className="text-ink-500">Subtotal before parish adjustment</span>
                <span className="font-semibold tabular-nums">{fmt(estimate.subtotalBeforeParish)}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <div>
                  <span className="text-ink-500">{estimate.parishName} adjustment</span>
                  <span className="text-ink-300 ml-2 text-xs">&times;{estimate.parishMultiplier}</span>
                </div>
                <span className="font-semibold tabular-nums">
                  +{fmt(Math.round(estimate.totalCost - estimate.subtotalBeforeParish))}
                </span>
              </div>
            </div>
          )}

          <div className="border-t-2 border-ink-200/70 pt-3 flex justify-between font-bold text-lg">
            <span>Total Estimated Labour Cost</span>
            <span className="tabular-nums">{fmt(estimate.totalCost)}</span>
          </div>

          {/* Per-unit summary */}
          <div className="bg-ink-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
            <div>
              <div className="text-xs text-ink-400 font-semibold">Per Sq Ft</div>
              <div className="font-bold tabular-nums">{fmt(perSqFt)}</div>
            </div>
            <div>
              <div className="text-xs text-ink-400 font-semibold">USD Equivalent</div>
              <div className="font-bold tabular-nums">${Math.round(estimate.totalCost / 156).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-ink-400 font-semibold">Square Footage</div>
              <div className="font-bold tabular-nums">{estimate.squareFootage.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 sm:p-6 mb-6">
        <h3 className="font-bold text-sm text-amber-800 mb-2">Important</h3>
        <p className="text-sm text-amber-700">
          This estimate is for labour costs only. Material costs are not included.
          We recommend consulting a Quantity Surveyor for a full Bill of Quantities.
        </p>
      </div>
    </>
  );
}

function buildPdfHtml(
  estimate: EstimateResult,
  fmt: (n: number) => string
): string {
  const perSqFt = Math.round(estimate.totalCost / estimate.squareFootage);
  const modRows = estimate.modifiers
    .map(
      (m) =>
        `<tr><td style="padding:6px 0;color:#555">${m.name} <span style="color:#999;font-size:11px">${m.type === "percentage" ? "%" : m.type === "per_sq_ft" ? "/sqft" : "flat"}</span></td><td style="padding:6px 0;text-align:right;font-weight:600">${m.amount >= 0 ? "+" : ""}${fmt(Math.round(m.amount))}</td></tr>`
    )
    .join("");

  const parishRows =
    estimate.parishName && estimate.parishMultiplier !== 1
      ? `<tr><td style="padding:6px 0;color:#555">Subtotal</td><td style="padding:6px 0;text-align:right;font-weight:600">${fmt(estimate.subtotalBeforeParish)}</td></tr>
         <tr><td style="padding:6px 0;color:#555">${estimate.parishName} adjustment (&times;${estimate.parishMultiplier})</td><td style="padding:6px 0;text-align:right;font-weight:600">+${fmt(Math.round(estimate.totalCost - estimate.subtotalBeforeParish))}</td></tr>`
      : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>IrieEstimate - ${estimate.houseType} Estimate</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,system-ui,sans-serif;color:#1a1a2e;padding:40px;max-width:700px;margin:0 auto}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #eee}
.logo{font-weight:700;font-size:18px}.date{color:#999;font-size:13px}
.hero{background:#1a1a2e;color:#fff;border-radius:12px;padding:32px;text-align:center;margin-bottom:24px}
.hero .total{font-size:36px;font-weight:700;margin:8px 0}.hero .sub{color:#aaa;font-size:14px}
table{width:100%;border-collapse:collapse}
.section-title{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:600;padding:12px 0 4px}
.total-row td{border-top:2px solid #1a1a2e;padding-top:12px;font-size:18px;font-weight:700}
.summary{display:flex;gap:24px;background:#f5f5f5;border-radius:8px;padding:16px;margin-top:16px}
.summary div .label{font-size:11px;color:#999;font-weight:600}.summary div .val{font-weight:700;font-size:15px}
.disclaimer{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-top:24px;font-size:13px;color:#92400e}
@media print{body{padding:20px}}</style></head><body>
<div class="header"><div class="logo">IrieEstimate</div><div class="date">${new Date().toLocaleDateString("en-JM", { year: "numeric", month: "long", day: "numeric" })}</div></div>
<div class="hero"><div class="sub">${estimate.houseType} &middot; ${estimate.squareFootage.toLocaleString()} sq ft${estimate.parishName ? ` &middot; ${estimate.parishName}` : ""}</div><div class="total">${fmt(estimate.totalCost)}</div><div class="sub">USD $${Math.round(estimate.totalCost / 156).toLocaleString()} &middot; ${fmt(perSqFt)} per sq ft &middot; labour only</div></div>
<table>
<tr><td style="padding:6px 0;color:#555">Base cost <span style="color:#999;font-size:11px">${estimate.squareFootage.toLocaleString()} sq ft</span></td><td style="padding:6px 0;text-align:right;font-weight:600">${fmt(estimate.baseCost)}</td></tr>
${modRows ? `<tr><td colspan="2" class="section-title">Customisations</td></tr>${modRows}` : ""}
${parishRows}
<tr class="total-row"><td>Total Estimated Labour Cost</td><td style="text-align:right">${fmt(estimate.totalCost)}</td></tr>
</table>
<div class="summary"><div><div class="label">Per Sq Ft</div><div class="val">${fmt(perSqFt)}</div></div><div><div class="label">USD Equivalent</div><div class="val">$${Math.round(estimate.totalCost / 156).toLocaleString()}</div></div><div><div class="label">Square Footage</div><div class="val">${estimate.squareFootage.toLocaleString()}</div></div></div>
<div class="disclaimer"><strong>Important:</strong> This estimate is for labour costs only. Material costs are not included. We recommend consulting a Quantity Surveyor for a full Bill of Quantities.</div>
</body></html>`;
}
