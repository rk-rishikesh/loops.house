import type { Metadata } from "next";
import {
  DM_Mono,
  Funnel_Sans,
  Geist,
  Geist_Mono,
  Pixelify_Sans,
  Press_Start_2P,
} from "next/font/google";
import { LayoutShell } from "@/components/layout-shell";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} ${dmMono.variable} ${pixelifySans.variable} ${funnelSans.variable}`}
    >
      <body className="antialiased">
        {/* Mobile / small-screen blocker */}
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center px-8 text-center md:hidden"
          style={{ backgroundColor: "#F8FFE8" }}
        >
          <div>
            <p
              className="font-black uppercase leading-none mb-4"
              style={{
                fontFamily: "var(--font-pixelify-sans), sans-serif",
                fontSize: 28,
                letterSpacing: "-0.025em",
                color: "#0F2C23",
              }}
            >
              Desktop Only
            </p>
            <p
              className="text-sm leading-relaxed max-w-[320px] mx-auto"
              style={{
                fontFamily: "var(--font-funnel-sans), sans-serif",
                color: "rgba(15,44,35,0.7)",
              }}
            >
              This experience is designed for desktop screens. Please switch to a laptop or desktop
              to continue.
            </p>
          </div>
        </div>
        <SupabaseProvider>
          <LayoutShell>{children}</LayoutShell>
        </SupabaseProvider>
      </body>
    </html>
  );
}
