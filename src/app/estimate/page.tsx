"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdSlot, { resetAdTracking } from "@/components/ad-slot";

interface HouseType {
  id: string;
  name: string;
  description: string | null;
  baseCostPerSqFt: string;
}

interface Option {
  id: string;
  categoryId: string;
  name: string;
  costModifier: string;
  modifierType: string;
}

interface Category {
  id: string;
  name: string;
  displayOrder: number;
  options: Option[];
}

interface Parish {
  id: string;
  name: string;
  costMultiplier: string;
}

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

type Step = "tier" | "customize" | "contact" | "results";

export default function EstimatePage() {
  const [step, setStep] = useState<Step>("tier");
  const [houseTypes, setHouseTypes] = useState<HouseType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parishesList, setParishesList] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);

  const [catPage, setCatPage] = useState(0);
  const CATS_PER_PAGE = 3;

  // Form state
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [sqft, setSqft] = useState<number>(1200);
  const [selectedParish, setSelectedParish] = useState<string>("");
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [contactValue, setContactValue] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [leadId, setLeadId] = useState<string>("");
  const [showConsultation, setShowConsultation] = useState(false);
  const [consultationSent, setConsultationSent] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [sharing, setSharing] = useState(false);
  const [pdfEnabled, setPdfEnabled] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => {
        setHouseTypes(data.houseTypes || []);
        setCategories(data.categories || []);
        setParishesList(data.parishes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch("/api/estimate/settings")
      .then((r) => r.json())
      .then((d) => setPdfEnabled(d.pdfEnabled === true))
      .catch(() => {});
  }, []);

  function selectOption(categoryId: string, optionId: string) {
    setSelectedOptions((prev) => ({ ...prev, [categoryId]: optionId }));
  }

  async function handleSubmit() {
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseTypeId: selectedTier,
          parishId: selectedParish || undefined,
          selectedOptionIds: Object.values(selectedOptions).filter(Boolean),
          totalSquareFootage: sqft,
          contactType,
          contactValue,
          consentToSharePartners: consent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      setResult(data.estimate);
      setLeadId(data.leadId);
      setStep("results");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-JM", { style: "currency", currency: "JMD", maximumFractionDigits: 0 }).format(n);

  async function handleShare() {
    if (!result || !leadId) return;
    setSharing(true);
    try {
      const res = await fetch("/api/estimate/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, estimateData: result }),
      });
      const data = await res.json();
      if (res.ok) setShareUrl(data.shareUrl);
    } catch { /* ignore */ } finally { setSharing(false); }
  }

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  function handleDownloadPdf() {
    if (!result) return;
    setGeneratingPdf(true);
    const content = buildPdfHtml(result, fmt);
    const w = window.open("", "_blank");
    if (!w) { setGeneratingPdf(false); return; }
    w.document.write(content);
    w.document.close();
    w.onload = () => { w.print(); setGeneratingPdf(false); };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-400">Loading pricing...</div>
      </div>
    );
  }

  const stepIndex = step === "tier" ? 0 : step === "customize" ? 1 : step === "contact" ? 2 : 3;
  const steps = [
    { label: "Tier", done: stepIndex > 0 },
    { label: "Finishes", done: stepIndex > 1 },
    { label: "Details", done: stepIndex > 2 },
    { label: "Results", done: stepIndex > 3 },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-ink-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-ink-800">
            <span className="w-7 h-7 bg-ink-800 rounded-md flex items-center justify-center text-cane-400 text-[10px] font-bold">
              IE
            </span>
            IrieEstimate
          </Link>
          {step !== "results" && (
            <button
              onClick={() => {
                if (step === "customize") setStep("tier");
                else if (step === "contact") setStep("customize");
              }}
              className={`text-sm text-ink-400 hover:text-ink-600 transition ${step === "tier" ? "invisible" : ""}`}
            >
              Back
            </button>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s.label} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-center">
                {i > 0 && (
                  <div className={`flex-1 h-0.5 ${i <= stepIndex ? "bg-ink-800" : "bg-ink-200/70"} transition-colors duration-300`} />
                )}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-300 ${
                  i < stepIndex ? "bg-ink-800 text-cane-400" :
                  i === stepIndex ? "bg-ink-800 text-cane-400 ring-2 ring-ink-300/30 ring-offset-2 ring-offset-[#faf9f6]" :
                  "bg-ink-200/50 text-ink-400"
                }`}>
                  {i < stepIndex ? (
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${i < stepIndex ? "bg-ink-800" : "bg-ink-200/70"} transition-colors duration-300`} />
                )}
              </div>
              <span className={`text-[11px] font-semibold ${i <= stepIndex ? "text-ink-600" : "text-ink-300"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* STEP 1: TIER */}
        {step === "tier" && (
          <section>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Choose your house type</h1>
            <p className="text-ink-400 mb-8">Each tier has a different base cost per square foot.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {houseTypes.map((ht) => (
                <button
                  key={ht.id}
                  onClick={() => setSelectedTier(ht.id)}
                  className={`text-left p-6 rounded-lg border-2 transition ${
                    selectedTier === ht.id
                      ? "border-ink-800 bg-ink-50"
                      : "border-ink-200/70 bg-white hover:border-ink-300"
                  }`}
                >
                  <h3 className="font-bold text-lg mb-1">{ht.name}</h3>
                  {ht.description && (
                    <p className="text-ink-400 text-sm mb-3">{ht.description}</p>
                  )}
                  <div className="text-ink-800 font-bold">
                    JMD ${Number(ht.baseCostPerSqFt).toLocaleString()}
                    <span className="text-xs text-ink-300 font-normal ml-1">per sq ft</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-8">
              <button
                disabled={!selectedTier}
                onClick={() => { setCatPage(0); setStep("customize"); }}
                className="px-8 py-3 rounded-lg font-bold bg-ink-800 text-cane-400 hover:bg-ink-900 transition disabled:opacity-30 disabled:cursor-not-allowed text-sm"
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: CUSTOMIZE */}
        {step === "customize" && (() => {
          const totalPages = Math.ceil(categories.length / CATS_PER_PAGE);
          const pageCats = categories.slice(catPage * CATS_PER_PAGE, (catPage + 1) * CATS_PER_PAGE);
          const isLastPage = catPage >= totalPages - 1;
          return (
            <section>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Customise your finishes</h1>
              <p className="text-ink-400 mb-8">
                Select one option from each category.
                <span className="ml-2 text-xs text-ink-300 font-medium">
                  Page {catPage + 1} of {totalPages}
                </span>
              </p>
              <div className="space-y-6">
                {pageCats.map((cat) => (
                  <div key={cat.id} className="bg-white rounded-lg border border-ink-200/70 p-5 sm:p-6">
                    <h3 className="font-bold text-sm mb-4">{cat.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {cat.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => selectOption(cat.id, opt.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
                            selectedOptions[cat.id] === opt.id
                              ? "border-ink-800 bg-ink-50 text-ink-800"
                              : "border-ink-200/70 text-ink-500 hover:border-ink-300"
                          }`}
                        >
                          {opt.name}
                          {Number(opt.costModifier) > 0 && (
                            <span className="ml-1.5 text-xs text-ink-300">
                              +{opt.modifierType === "percentage"
                                ? `${opt.costModifier}%`
                                : `$${Number(opt.costModifier).toLocaleString()}`}
                              {opt.modifierType === "per_sq_ft" && "/sqft"}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-8">
                <button
                  disabled={catPage === 0}
                  onClick={() => { setCatPage(catPage - 1); window.scrollTo(0, 0); }}
                  className="px-5 py-3 rounded-lg font-semibold text-ink-400 hover:bg-ink-100 transition text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => { setCatPage(i); window.scrollTo(0, 0); }}
                      className={`w-2 h-2 rounded-full transition ${i === catPage ? "bg-ink-800" : "bg-ink-200"}`}
                    />
                  ))}
                </div>
                {isLastPage ? (
                  <button
                    onClick={() => setStep("contact")}
                    className="px-8 py-3 rounded-lg font-bold bg-ink-800 text-cane-400 hover:bg-ink-900 transition text-sm"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={() => { setCatPage(catPage + 1); window.scrollTo(0, 0); }}
                    className="px-8 py-3 rounded-lg font-bold bg-ink-800 text-cane-400 hover:bg-ink-900 transition text-sm"
                  >
                    Next
                  </button>
                )}
              </div>
            </section>
          );
        })()}

        {/* STEP 3: CONTACT (LEAD GATE) */}
        {step === "contact" && (
          <section>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Get your estimate</h1>
            <p className="text-ink-400 mb-8">
              Enter your project details to see the full cost breakdown.
            </p>
            <div className="bg-white rounded-lg border border-ink-200/70 p-5 sm:p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                  Total Square Footage
                </label>
                <input
                  type="number"
                  value={sqft}
                  onChange={(e) => setSqft(parseInt(e.target.value) || 0)}
                  min={100}
                  max={50000}
                  className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none"
                  placeholder="e.g. 1200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                  Parish (build location)
                </label>
                <select
                  value={selectedParish}
                  onChange={(e) => setSelectedParish(e.target.value)}
                  className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none bg-white"
                >
                  <option value="">Select your parish</option>
                  {parishesList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{Number(p.costMultiplier) !== 1 ? ` (${Number(p.costMultiplier).toFixed(2)}x)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                  Contact Method
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setContactType("email")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
                      contactType === "email"
                        ? "border-ink-800 bg-ink-50"
                        : "border-ink-200/70 hover:border-ink-300"
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setContactType("phone")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
                      contactType === "phone"
                        ? "border-ink-800 bg-ink-50"
                        : "border-ink-200/70 hover:border-ink-300"
                    }`}
                  >
                    Phone
                  </button>
                </div>
                <input
                  type={contactType === "email" ? "email" : "tel"}
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none"
                  placeholder={contactType === "email" ? "you@example.com" : "+1 876 555 1234"}
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-5 h-5 accent-ink-800 rounded mt-0.5"
                />
                <span className="text-sm text-ink-500 leading-relaxed">
                  I agree to share my project details with verified local contractors to receive quotes.
                </span>
              </label>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-8">
              <button
                disabled={!contactValue || !consent || sqft < 100 || submitting}
                onClick={handleSubmit}
                className="px-8 py-3 rounded-lg font-bold bg-ink-800 text-cane-400 hover:bg-ink-900 transition disabled:opacity-30 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? "Calculating..." : "Get My Estimate"}
              </button>
            </div>
          </section>
        )}

        {/* STEP 4: RESULTS */}
        {step === "results" && result && (() => {
          const perSqFt = Math.round(result.totalCost / result.squareFootage);
          return (
          <section>
            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {!shareUrl ? (
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="px-4 py-2 bg-ink-800 text-cane-400 rounded-lg text-sm font-bold hover:bg-ink-900 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {sharing ? "Creating link..." : "Share (24hr link)"}
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 min-w-0 border border-ink-200/70 rounded-lg px-3 py-2 text-xs text-ink-500 bg-ink-50 truncate"
                  />
                  <button
                    onClick={copyShareUrl}
                    className="px-3 py-2 bg-ink-800 text-cane-400 rounded-lg text-xs font-bold hover:bg-ink-900 transition shrink-0"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
              {pdfEnabled && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={generatingPdf}
                  className="px-4 py-2 bg-white border border-ink-200/70 text-ink-700 rounded-lg text-sm font-bold hover:bg-ink-50 transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {generatingPdf ? "Generating..." : "Download PDF"}
                </button>
              )}
            </div>

            {/* Hero card */}
            <div className="bg-ink-800 text-white rounded-lg p-6 sm:p-8 mb-6">
              <div className="text-center">
                <div className="text-sm text-ink-300 mb-1">
                  {result.houseType} &middot; {result.squareFootage.toLocaleString()} sq ft
                  {result.parishName && <> &middot; {result.parishName}</>}
                </div>
                <div className="text-4xl sm:text-5xl font-bold mb-2 tabular-nums">
                  {fmt(result.totalCost)}
                </div>
                <div className="text-ink-300 text-sm">
                  USD ${Math.round(result.totalCost / 156).toLocaleString()} &middot;{" "}
                  {fmt(perSqFt)} per sq ft &middot; labour only
                </div>
              </div>
            </div>

            <AdSlot page="estimate_results" parishId={selectedParish} minH="90px" />

            {/* Full breakdown */}
            <div className="bg-white rounded-lg border border-ink-200/70 p-5 sm:p-6 mb-6">
              <h3 className="font-bold text-sm mb-4">Full Cost Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-ink-700 font-medium">Base cost</span>
                    <span className="text-ink-300 ml-2 text-xs">
                      {result.squareFootage.toLocaleString()} sq ft &times; {fmt(Math.round(result.baseCost / result.squareFootage))}/sqft
                    </span>
                  </div>
                  <span className="font-semibold tabular-nums">{fmt(result.baseCost)}</span>
                </div>

                {result.modifiers.length > 0 && (
                  <div className="border-t border-ink-100 pt-3">
                    <div className="text-xs text-ink-400 font-semibold uppercase tracking-wider mb-2">Customisations</div>
                    {result.modifiers.map((m, i) => (
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

                {result.parishName && result.parishMultiplier !== 1 && (
                  <div className="border-t border-ink-100 pt-3">
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-ink-500">Subtotal before parish adjustment</span>
                      <span className="font-semibold tabular-nums">{fmt(result.subtotalBeforeParish)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1">
                      <div>
                        <span className="text-ink-500">{result.parishName} adjustment</span>
                        <span className="text-ink-300 ml-2 text-xs">&times;{result.parishMultiplier}</span>
                      </div>
                      <span className="font-semibold tabular-nums">
                        +{fmt(Math.round(result.totalCost - result.subtotalBeforeParish))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t-2 border-ink-200/70 pt-3 flex justify-between font-bold text-lg">
                  <span>Total Estimated Labour Cost</span>
                  <span className="tabular-nums">{fmt(result.totalCost)}</span>
                </div>

                {/* Per-unit summary */}
                <div className="bg-ink-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                  <div>
                    <div className="text-xs text-ink-400 font-semibold">Per Sq Ft</div>
                    <div className="font-bold tabular-nums">{fmt(perSqFt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-400 font-semibold">USD Equivalent</div>
                    <div className="font-bold tabular-nums">${Math.round(result.totalCost / 156).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-400 font-semibold">Square Footage</div>
                    <div className="font-bold tabular-nums">{result.squareFootage.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 sm:p-6 mb-6">
              <h3 className="font-bold text-sm text-amber-800 mb-2">Important</h3>
              <p className="text-sm text-amber-700">
                This estimate is for labour costs only. Material costs are not included.
                We recommend consulting a Quantity Surveyor for a full Bill of Quantities.
              </p>
            </div>

            {/* Consultation Upsell */}
            {!showConsultation && !consultationSent && (
              <div className="bg-ink-800 text-white rounded-lg p-6 mb-6">
                <h3 className="font-bold text-lg mb-2">Want a full consultation?</h3>
                <p className="text-ink-300 text-sm mb-4">
                  Get a professional site visit, detailed material costing, and a complete
                  Bill of Quantities. Payment is collected offline before the visit.
                </p>
                <button
                  onClick={() => setShowConsultation(true)}
                  className="px-6 py-2.5 bg-cane-400 text-ink-800 rounded-lg font-bold text-sm hover:bg-cane-500 transition"
                >
                  Request a Full Consultation
                </button>
              </div>
            )}

            {showConsultation && !consultationSent && (
              <ConsultationForm
                leadId={leadId}
                onSuccess={() => {
                  setShowConsultation(false);
                  setConsultationSent(true);
                }}
              />
            )}

            {consultationSent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
                <h3 className="font-bold text-sm text-green-800 mb-1">Consultation requested</h3>
                <p className="text-sm text-green-700">
                  We&apos;ll be in touch to confirm your site visit. Payment will be collected
                  offline before the consultation date.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  resetAdTracking();
                  setStep("tier");
                  setResult(null);
                  setLeadId("");
                  setSelectedTier("");
                  setSelectedOptions({});
                  setSelectedParish("");
                  setCatPage(0);
                  setContactValue("");
                  setConsent(false);
                  setShowConsultation(false);
                  setConsultationSent(false);
                  setShareUrl("");
                  setCopied(false);
                }}
                className="flex-1 py-3 rounded-lg border-2 border-ink-300 text-ink-800 font-bold text-sm hover:bg-ink-50 transition"
              >
                New Estimate
              </button>
              <Link
                href="/"
                className="flex-1 py-3 rounded-lg border-2 border-ink-200/70 text-ink-500 font-bold text-sm hover:bg-ink-50 transition text-center"
              >
                Back to Home
              </Link>
            </div>
          </section>
          );
        })()}
      </main>
    </>
  );
}

function ConsultationForm({
  leadId,
  onSuccess,
}: {
  leadId: string;
  onSuccess: () => void;
}) {
  const [siteAddress, setSiteAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, siteAddress, preferredDate, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit");
        setSubmitting(false);
        return;
      }

      onSuccess();
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-ink-200/70 p-5 sm:p-6 mb-6 space-y-4">
      <h3 className="font-bold text-lg">Request a Full Consultation</h3>
      <p className="text-sm text-ink-400">
        Payment will be collected offline before the site visit.
      </p>
      <div>
        <label className="block text-sm font-semibold text-ink-700 mb-1.5">
          Site Address
        </label>
        <input
          type="text"
          value={siteAddress}
          onChange={(e) => setSiteAddress(e.target.value)}
          required
          className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-ink-300 outline-none"
          placeholder="e.g. Lot 14, Cherry Gardens, Kingston 8"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink-700 mb-1.5">
          Preferred Date
        </label>
        <input
          type="date"
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-ink-300 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink-700 mb-1.5">
          Project Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-ink-300 outline-none resize-none"
          placeholder="Any details about your project..."
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !siteAddress}
          className="px-6 py-2.5 bg-ink-800 text-cane-400 rounded-lg font-bold text-sm hover:bg-ink-900 transition disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </form>
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
