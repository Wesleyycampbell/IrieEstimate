import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Construction tips, cost guides, and building advice for homeowners in Jamaica. Learn about labour costs, materials, and best practices.",
  alternates: { canonical: "/blog" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://irieestimate.com/" },
    { "@type": "ListItem", position: 2, name: "Blog" },
  ],
};

export default function BlogLayout({
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
