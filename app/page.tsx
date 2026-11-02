"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";
import { usePlan } from "@/components/PlanProvider";
import { OnboardingFrame, glass, primaryBtn } from "@/components/Onboarding";
import { unlockAudio } from "@/lib/audio";

export default function Welcome() {
  const { t, base, ready } = usePlan();
  return (
    <OnboardingFrame
      step={1}
      footer={
        <>
          {ready && base && (
            <Link href="/plan" className={`flex h-12 w-full items-center justify-center gap-2 rounded-full text-[0.85rem] text-white/85 ${glass}`}>
              <FileText className="size-4" strokeWidth={1.6} /> {t.openMyPlan}
            </Link>
          )}
          <Link href="/language" onClick={unlockAudio} className={primaryBtn}>
            {t.getStarted} <ArrowRight className="size-[18px]" />
          </Link>
        </>
      }
    >
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="grid size-20 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-xl">
          <span className="text-[1.6rem] font-extralight">स</span>
        </div>
        <h1 className="mt-8 text-[2.2rem] font-extralight tracking-tight">samjho</h1>
        <p className="mx-auto mt-3 max-w-[26ch] text-balance text-[0.95rem] font-light leading-relaxed text-white/70">{t.tagline}</p>
        
      </motion.div>
    </OnboardingFrame>
  );
}
