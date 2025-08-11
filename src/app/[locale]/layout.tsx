import type { Metadata } from "next";
import Link from "next/link";
import LogoLink from "@/components/LogoLink";
import NavActions from "@/components/NavActions";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
// Simplified layout without next-intl provider for now
import Providers from "@/components/Providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plotter & Statistics",
  description: "Bar charts and reports",
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <html lang={locale}>
      <body suppressHydrationWarning className={`antialiased bg-slate-50 text-slate-900`}> 
        <Providers>
          <header className="border-b bg-white sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <LogoLink />
              <nav className="flex items-center gap-4 text-sm">
                <NavActions />
              </nav>
            </div>
          </header>
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}


