import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how IrieEstimate provides free construction labour cost estimates for homeowners across all 14 parishes in Jamaica.",
  alternates: { canonical: "/about" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://irieestimate.com/" },
    { "@type": "ListItem", position: 2, name: "About" },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-ink-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-ink-800 text-base">
            <span className="w-8 h-8 bg-ink-800 rounded-md flex items-center justify-center text-cane-400 text-[11px] font-bold">
              IE
            </span>
            IrieEstimate
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-base">
            <Link href="/blog" className="py-2 text-ink-400 hover:text-ink-800 transition">
              Blog
            </Link>
            <Link
              href="/estimate"
              className="px-5 py-2.5 min-h-[44px] flex items-center bg-cane-400 text-ink-800 rounded-lg font-semibold text-base hover:bg-cane-500 transition"
            >
              Get Estimate
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">About IrieEstimate</h1>
        <p className="text-ink-400 text-lg mb-10 leading-relaxed max-w-xl">
          Free construction labour cost estimates for homeowners across Jamaica.
        </p>

        <div className="space-y-8">
          <section className="bg-white rounded-lg border border-ink-200/70 p-6">
            <h2 className="font-bold text-lg mb-3">What we do</h2>
            <p className="text-ink-500 text-sm leading-relaxed">
              IrieEstimate helps Jamaicans plan their home construction projects by providing
              transparent labour cost estimates. Choose from four build tiers — Affordable,
              Standard, Premium, and Luxury — customise your finishes across 11 trade
              categories, and get a detailed cost breakdown adjusted for your parish in
              under two minutes.
            </p>
          </section>

          <section className="bg-white rounded-lg border border-ink-200/70 p-6">
            <h2 className="font-bold text-lg mb-3">How estimates work</h2>
            <div className="space-y-4 text-ink-500 text-sm leading-relaxed">
              <p>
                Every estimate starts with a base rate per square foot set by your chosen
                house type. From there, your selections for site work, block work, roofing,
                plumbing, electrical, wall finishes, flooring, doors, windows, painting, and
                contingency each adjust the total — some as flat fees, others per square
                foot or as a percentage.
              </p>
              <p>
                If you select a parish, a location-based multiplier is applied to reflect
                differences in labour availability and transport costs across Jamaica&apos;s
                14 parishes. The final figure covers <strong>labour only</strong> — material
                costs are not included. For a full Bill of Quantities including materials,
                we recommend requesting a consultation with a Quantity Surveyor through
                the platform.
              </p>
            </div>
          </section>

          <section className="bg-white rounded-lg border border-ink-200/70 p-6">
            <h2 className="font-bold text-lg mb-3">Contractor network</h2>
            <p className="text-ink-500 text-sm leading-relaxed">
              When you submit your estimate, your project details can be shared with
              verified local contractors in your parish who are actively taking on work.
              This is optional and requires your consent. Contractors receive a summary of
              your build specifications so they can provide you with accurate quotes
              directly.
            </p>
          </section>

          <section className="bg-white rounded-lg border border-ink-200/70 p-6">
            <h2 className="font-bold text-lg mb-3">Coverage</h2>
            <p className="text-ink-500 text-sm leading-relaxed mb-4">
              IrieEstimate covers all 14 parishes of Jamaica, each with a cost multiplier
              that reflects local labour market conditions:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-sm text-ink-500">
              {[
                "Kingston",
                "St. Andrew",
                "St. Thomas",
                "Portland",
                "St. Mary",
                "St. Ann",
                "Trelawny",
                "St. James",
                "Hanover",
                "Westmoreland",
                "St. Elizabeth",
                "Manchester",
                "Clarendon",
                "St. Catherine",
              ].map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg border border-ink-200/70 p-6">
            <h2 className="font-bold text-lg mb-3">Contact</h2>
            <p className="text-ink-500 text-sm leading-relaxed">
              IrieEstimate is built and maintained in Jamaica. For questions, partnership
              enquiries, or to join the contractor network, reach us
              at <a href="mailto:hello@irieestimate.com" className="text-ink-800 font-semibold hover:underline">hello@irieestimate.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 flex gap-4">
          <Link
            href="/estimate"
            className="px-8 py-3 bg-ink-800 text-cane-400 rounded-lg font-bold text-sm hover:bg-ink-900 transition"
          >
            Start your estimate
          </Link>
          <Link
            href="/"
            className="px-6 py-3 text-ink-400 font-semibold text-sm hover:text-ink-800 transition"
          >
            Back to home
          </Link>
        </div>
      </main>

      <footer className="border-t border-ink-200/50 text-ink-300 text-sm py-8 mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-semibold text-ink-500">
              <span className="w-6 h-6 bg-ink-800 rounded-md flex items-center justify-center text-cane-400 text-[9px] font-bold">
                IE
              </span>
              IrieEstimate
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/estimate" className="text-ink-300 hover:text-ink-500 transition">Estimate</Link>
              <Link href="/blog" className="text-ink-300 hover:text-ink-500 transition">Blog</Link>
              <Link href="/about" className="text-ink-300 hover:text-ink-500 transition">About</Link>
              <Link href="/terms" className="text-ink-300 hover:text-ink-500 transition">Terms</Link>
            </nav>
            <span className="text-ink-300">Jamaica &middot; 2026</span>
          </div>
        </div>
      </footer>
    </>
  );
}
