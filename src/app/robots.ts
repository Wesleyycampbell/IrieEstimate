import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://irieestimate.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/hq-workspace/", "/api/workspace/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
