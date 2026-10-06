import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import Lablec from "@/components/Lablec";
import "./globals.css";

// Címbetű; a törzsszöveg rendszerbetű (gyorsabb betöltés)
const cimBetu = Bricolage_Grotesque({
  variable: "--font-cim",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AI-Munkaprofil",
    template: "%s | AI-Munkaprofil",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hu" className={`${cimBetu.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="flex-1">{children}</div>
        <Lablec adatVerzio="fejlesztői" />
      </body>
    </html>
  );
}
