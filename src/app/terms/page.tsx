import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and conditions for using IrieEstimate, Jamaica's free construction labour cost estimator.",
  alternates: { canonical: "/terms" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://irieestimate.com/" },
    { "@type": "ListItem", position: 2, name: "Terms & Conditions" },
  ],
};

export default function TermsPage() {
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
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Terms &amp; Conditions</h1>
        <p className="text-ink-400 text-sm mb-10">
          Last updated: September 1, 2026
        </p>

        <div className="space-y-8 text-sm text-ink-600 leading-relaxed">
          <section>
            <h2 className="font-bold text-lg text-ink-800 mb-3">1. Estimate Disclaimer</h2>
            <p>
              The estimate provided by IrieEstimate is for <strong>labour costs only</strong> and
              does not include material costs, permit fees, professional fees, or any other
              expenses. All figures are approximate and based on standard residential construction
              practices in Jamaica as of the current date. Actual costs may vary depending on site
              conditions, contractor availability, market fluctuations, and project complexity.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-ink-800 mb-3">2. Not a Quote or Contract</h2>
            <p>
              This estimate does not constitute a quote, bid, or contract. It is intended for
              informational and planning purposes only. We recommend obtaining formal quotes from
              licensed contractors and consulting a Quantity Surveyor for a detailed Bill of
              Quantities before commencing any construction work.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-ink-800 mb-3">3. Use of Your Information</h2>
            <p>
              By submitting your contact details, you agree that IrieEstimate may store your
              project information and contact details for the purpose of generating your estimate.
              If you consent to sharing with partners, your details may be shared with verified
              local contractors and building suppliers who may contact you with quotes and offers
              relevant to your project.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-ink-800 mb-3">4. Data Retention</h2>
            <p>
              Your estimate data is stored securely. Shared estimate links expire after 24 hours
              and are automatically deleted from our database. You may request deletion of your
              data at any time by contacting us
              at{" "}
              <a
                href="mailto:hello@irieestimate.com"
                className="text-ink-800 font-semibold hover:underline"
              >
                hello@irieestimate.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-ink-800 mb-3">5. Limitation of Liability</h2>
            <p>
              IrieEstimate, its owners, and affiliates shall not be held liable for any financial
              loss, project delay, or damages arising from reliance on the estimates provided.
              Users accept full responsibility for all construction and financial decisions made
              based on the information provided.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-ink-800 mb-3">6. Third-Party Content</h2>
            <p>
              Advertisements displayed on IrieEstimate are from third-party sponsors. We do not
              endorse or guarantee the products or services advertised. Users engage with
              advertisers at their own discretion and risk.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-ink-800 mb-3">7. Intellectual Property</h2>
            <p>
              All content, design, and functionality of IrieEstimate are the intellectual property
              of IrieEstimate and are protected by applicable copyright laws. You may not
              reproduce, distribute, or create derivative works from this content without prior
              written permission.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-ink-800 mb-3">8. Changes to Terms</h2>
            <p>
              We reserve the right to update these terms at any time. Changes will be posted on
              this page with a revised &ldquo;Last updated&rdquo; date. Continued use of the
              service after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-ink-800 mb-3">9. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of
              Jamaica. Any disputes arising from the use of IrieEstimate shall be subject to the
              exclusive jurisdiction of the courts of Jamaica.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg text-ink-800 mb-3">10. Contact</h2>
            <p>
              If you have questions about these terms, contact us
              at{" "}
              <a
                href="mailto:hello@irieestimate.com"
                className="text-ink-800 font-semibold hover:underline"
              >
                hello@irieestimate.com
              </a>.
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
