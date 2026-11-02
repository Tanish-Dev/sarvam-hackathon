"use client";
import Link from "next/link";
import { Info } from "lucide-react";
import { usePlan } from "./PlanProvider";
import { Label, Shell } from "./ui";

export const glass = "bg-white/[0.07] ring-1 ring-white/15 backdrop-blur-xl";
export const primaryBtn =
  "flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white/[0.16] text-[0.95rem] font-light text-white ring-1 ring-white/30 backdrop-blur-xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] transition hover:bg-white/[0.22] active:scale-[0.98]";

/** Dark gradient frame shared by the three onboarding screens, with step dots. */
export function OnboardingFrame({ step, children, footer }: { step: 1 | 2 | 3; children: React.ReactNode; footer: React.ReactNode }) {
  const { t } = usePlan();
  return (
    <Shell className="bg-night text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 left-1/2 size-[560px] -translate-x-1/2 rounded-full bg-teal/45 blur-3xl drift" />
        <div className="absolute bottom-[-120px] -right-32 size-[420px] rounded-full bg-rose/25 blur-3xl drift [animation-delay:-5s]" />
      </div>
      <div className="relative flex min-h-(--app-h) flex-col px-5 pt-[max(var(--safe-top),14px)] pb-[max(var(--safe-bottom),20px)]">
        <header className="flex h-11 items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-[1.2rem] font-light tracking-tight">samjho</span>
            <Label className="text-white/45">Sarvam AI</Label>
          </Link>
          <Link href="/how-it-works" className="grid size-10 place-items-center rounded-full text-white/75 hover:bg-white/10" aria-label={t.howItWorks}>
            <Info className="size-[18px]" />
          </Link>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <div className="mt-8 space-y-4">
          {footer}
          <div className="flex justify-center gap-1.5" aria-label={`${step} / 3`}>
            {[1, 2, 3].map((i) => (
              <span key={i} className={`h-1 rounded-full transition-all ${i === step ? "w-6 bg-white" : "w-1.5 bg-white/30"}`} />
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
