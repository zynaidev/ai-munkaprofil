import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Sans, Inter } from "next/font/google";
import Fejlec from "@/components/Fejlec";
import Lablec from "@/components/Lablec";
import { oldalUrl } from "@/lib/seo";
import "./globals.css";

// Csak a ténylegesen használt súlyok
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
  weight: "500",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
  preload: false, // csak apró címkék; ne versenyezzen a hero betűivel
});

export const metadata: Metadata = {
  metadataBase: new URL(oldalUrl()), // kanonikus és OG-URL-ek alapja (NEXT_PUBLIC_SITE_URL)
  title: {
    default: "AI-Munkaprofil",
    template: "%s | AI-Munkaprofil",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="hu"
      className={`${inter.variable} ${instrument.variable} ${geistMono.variable} h-full bg-base font-sans antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Fejlec />
        <div className="flex-1">{children}</div>
        <Lablec adatVerzio="fejlesztői" />
      </body>
    </html>
  );
}
