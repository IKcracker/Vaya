import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();

const siteDescription =
  "Vaya connects passengers with verified drivers travelling between cities, towns and provinces across South Africa.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Vaya | Shared trips across South Africa",
    template: "%s | Vaya",
  },
  description: siteDescription,
  applicationName: "Vaya",
  keywords: [
    "Vaya",
    "shared trips South Africa",
    "intercity travel South Africa",
    "interprovincial rides",
    "ride sharing South Africa",
  ],
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: "Vaya",
    title: "Vaya | Shared trips across South Africa",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "Vaya | Shared trips across South Africa",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "travel",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-ZA" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
