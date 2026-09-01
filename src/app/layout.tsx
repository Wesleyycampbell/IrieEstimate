import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://irieestimate.com";

export const metadata: Metadata = {
  title: {
    default: "IrieEstimate — Jamaica Construction Labour Costs",
    template: "%s | IrieEstimate",
  },
  description:
    "Get accurate house-building cost estimates for Jamaica. Compare tiers, customize finishes, and connect with verified local contractors across all 14 parishes.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_JM",
    siteName: "IrieEstimate",
    title: "IrieEstimate — Jamaica Construction Labour Costs",
    description:
      "Free construction labour cost estimates for homeowners across Jamaica. Choose your tier, customise finishes, and get connected with verified contractors.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "IrieEstimate — Jamaica Construction Labour Costs",
    description:
      "Free construction labour cost estimates for Jamaica. Compare tiers, customise finishes, get a detailed breakdown.",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
