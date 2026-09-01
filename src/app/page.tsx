import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://irieestimate.com";

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "IrieEstimate",
  description:
    "Free construction labour cost estimates for homeowners across Jamaica. Compare tiers, customise finishes, and connect with verified contractors.",
  url: SITE_URL,
  areaServed: {
    "@type": "Country",
    name: "Jamaica",
  },
  serviceType: "Construction Cost Estimation",
  priceRange: "Free",
  email: "hello@irieestimate.com",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "IrieEstimate",
  url: SITE_URL,
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([localBusinessSchema, websiteSchema]) }}
      />
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-ink-800 text-base">
            <span className="w-8 h-8 bg-ink-800 rounded-md flex items-center justify-center text-cane-400 text-[11px] font-bold">
              IE
            </span>
            IrieEstimate
          </div>
          <nav className="flex items-center gap-4 sm:gap-6 text-base">
            <a href="#how-it-works" className="hidden sm:inline py-2 text-ink-400 hover:text-ink-800 transition">
              How it works
            </a>
            <Link href="/blog" className="hidden sm:inline py-2 text-ink-400 hover:text-ink-800 transition">
              Blog
            </Link>
            <Link href="/about" className="hidden sm:inline py-2 text-ink-400 hover:text-ink-800 transition">
              About
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

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
          <p className="text-cane-600 font-semibold text-sm tracking-widest uppercase mb-4">
            Jamaica Construction Costs
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold leading-[1.1] mb-6 max-w-2xl">
            Know what your house will cost{" "}
            <span className="text-cane-500">before you start.</span>
          </h1>
          <p className="text-ink-400 text-lg max-w-lg mb-10 leading-relaxed">
            Accurate construction cost estimates across Jamaica&apos;s 14 parishes.
            Choose your tier, customise finishes, and get connected with verified
            contractors.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/estimate"
              className="px-8 py-3.5 bg-ink-800 text-cane-400 rounded-lg font-bold text-base hover:bg-ink-900 transition inline-flex items-center gap-2"
            >
              Start your estimate
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="bg-ink-800 rounded-lg p-8 sm:p-10 text-white max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-cane-600/20 text-cane-400 rounded-full text-xs font-bold">
                SAMPLE
              </span>
              <span className="text-ink-300 text-sm">
                Standard Tier &middot; 1,200 sq ft
              </span>
            </div>
            <div className="text-4xl sm:text-5xl font-bold mb-2 tabular-nums">
              JMD $8,400,000
            </div>
            <p className="text-ink-300 text-sm">
              USD $53,846 &middot; $7,000 per sq ft &middot; labour only
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {[
                ["Roof", "Zinc + Sarking"],
                ["Walls", "Smooth Render"],
                ["Floor", "Standard Tiles"],
                ["Fixtures", "Standard Package"],
              ].map(([label, value]) => (
                <div key={label} className="bg-white/5 rounded-lg p-3">
                  <div className="text-ink-300 text-xs mb-1">{label}</div>
                  <div className="font-semibold text-sm">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-ink-100">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Choose your tier",
                desc: "Select from Affordable, Standard, Premium, or Luxury house types with different base costs per square foot.",
              },
              {
                step: "2",
                title: "Customise finishes",
                desc: "Pick your roof type, foundation, wall finish, flooring, and fixtures. Each option adjusts the cost.",
              },
              {
                step: "3",
                title: "Get your estimate",
                desc: "Enter your square footage and contact details to receive a detailed cost breakdown and connect with local contractors.",
              },
            ].map((item) => (
              <div key={item.step}>
                <div className="w-10 h-10 bg-ink-800 text-cane-400 rounded-lg flex items-center justify-center font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-ink-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-200/50 text-ink-300 text-sm py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
