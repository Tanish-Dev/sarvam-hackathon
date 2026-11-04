import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import {
  Geist, Geist_Mono, Noto_Sans_Bengali, Noto_Sans_Devanagari, Noto_Sans_Gujarati, Noto_Sans_Gurmukhi,
  Noto_Sans_Kannada, Noto_Sans_Malayalam, Noto_Sans_Oriya, Noto_Sans_Tamil, Noto_Sans_Telugu,
} from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { DeviceFrame } from "@/components/DeviceFrame";
import { NavTracker } from "@/components/NavTracker";
import { PlanProvider } from "@/components/PlanProvider";
import { readSession, SESSION_COOKIE } from "@/lib/auth";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", weight: ["300", "400", "500", "600"], preload: false, display: "swap" });
const beng = Noto_Sans_Bengali({ variable: "--font-beng", weight: ["300", "400", "500", "600"], preload: false, display: "swap" });
const gujr = Noto_Sans_Gujarati({ variable: "--font-gujr", weight: ["300", "400", "500", "600"], preload: false, display: "swap" });
const guru = Noto_Sans_Gurmukhi({ variable: "--font-guru", weight: ["300", "400", "500", "600"], preload: false, display: "swap" });
const knda = Noto_Sans_Kannada({ variable: "--font-knda", weight: ["300", "400", "500", "600"], preload: false, display: "swap" });
const mlym = Noto_Sans_Malayalam({ variable: "--font-mlym", weight: ["300", "400", "500", "600"], preload: false, display: "swap" });
const orya = Noto_Sans_Oriya({ variable: "--font-orya", weight: ["300", "400", "500", "600"], preload: false, display: "swap" });
const taml = Noto_Sans_Tamil({ variable: "--font-taml", weight: ["300", "400", "500", "600"], preload: false, display: "swap" });
const telu = Noto_Sans_Telugu({ variable: "--font-telu", weight: ["300", "400", "500", "600"], preload: false, display: "swap" });

export const metadata: Metadata = {
  title: "Samjho — your discharge paper, explained",
  description: "Photograph your hospital discharge summary. Samjho explains it in your language, reads it aloud, and answers your questions — powered by Sarvam AI.",
};

export const viewport: Viewport = { themeColor: "#0B0F14", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  const fonts = [geist, geistMono, deva, beng, gujr, guru, knda, mlym, orya, taml, telu].map((f) => f.variable).join(" ");
  return (
    <html lang="en-IN" className={`${fonts} antialiased`}>
      <body className="min-h-dvh">
        <PlanProvider initialUser={user}>
          <NavTracker />
          <DeviceFrame>{children}<AppNav /></DeviceFrame>
        </PlanProvider>
      </body>
    </html>
  );
}
