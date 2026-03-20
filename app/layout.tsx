import type { Metadata } from "next";
import {
  DM_Mono,
  Funnel_Sans,
  Geist,
  Geist_Mono,
  Pixelify_Sans,
  Press_Start_2P,
} from "next/font/google";
import Image from "next/image";
import { LayoutShell } from "@/components/layout-shell";
import { getServerAuth } from "@/lib/server-auth";
import { SupabaseProvider } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const pressStart2P = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
});

const pixelifySans = Pixelify_Sans({
  variable: "--font-pixelify-sans",
  subsets: ["latin"],
  display: "swap",
});

const funnelSans = Funnel_Sans({
  variable: "--font-funnel-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Loops - Build, Host, Discover",
  description: "Build hackathon projects, host events, and discover projects.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await getServerAuth();
  const capabilities = auth?.capabilities ?? null;
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} ${dmMono.variable} ${pixelifySans.variable} ${funnelSans.variable}`}
    >
      <body className="">
        {/* Mobile / small-screen blocker */}
        <div
          id="loops-mobile-blocker"
          className="fixed inset-0 z-9999 flex items-center justify-center bg-[#F8FFE8] px-8 text-center md:hidden"
        >
          <div className="flex flex-col items-center gap-8">
            <Image
              src="/assets/portal/peepingCat.svg"
              alt="Peeping Cat"
              width={200}
              height={200}
              className="h-40 w-40 object-contain"
            />
            <div className="flex flex-col gap-3">
              <h1
                className={`${pixelifySans.className} text-4xl font-bold uppercase leading-none tracking-tight text-[#0F2C23] sm:text-5xl`}
              >
                Big Ideas Need
                <br />
                Big Screen
              </h1>
              <p className={`${funnelSans.className} text-lg  text-[#0F2C23B3]`}>
                Switch to Desktop
              </p>
            </div>
          </div>
        </div>
        <SupabaseProvider>
          <LayoutShell capabilities={capabilities}>{children}</LayoutShell>
        </SupabaseProvider>
      </body>
    </html>
  );
}
