import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Your Estimate",
  description:
    "Build your custom construction labour cost estimate for Jamaica. Choose bedrooms, pick a tier, customise finishes, and get a detailed price breakdown.",
  alternates: { canonical: "/estimate" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://irieestimate.com/" },
    { "@type": "ListItem", position: 2, name: "Get Your Estimate" },
  ],
};

export default function EstimateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
