"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, ExternalLink, MessageCircle, ScanLine, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import { usePlan } from "@/components/PlanProvider";
import { OnboardingFrame, glass, primaryBtn } from "@/components/Onboarding";
import { Label } from "@/components/ui";
import { SAMPLE_PLANS } from "@/lib/sample";
import { unlockAudio } from "@/lib/audio";

export default function Guide() {
  const { t, setPlan, setFiles } = usePlan();
  const router = useRouter();
  const steps = [
    { icon: Camera, title: t.step1Title, body: t.step1Body },
    { icon: Volume2, title: t.step2Title, body: t.step2Body },
    { icon: MessageCircle, title: t.step3Title, body: t.step3Body },
  ];
  return (
    <OnboardingFrame
      step={3}
      footer={
        <>
          <Link href="/scan" onClick={() => { unlockAudio(); setFiles([]); }} className={primaryBtn}>
            <Camera className="size-[18px]" strokeWidth={1.6} /> {t.scanPaper}
          </Link>
          <p className="flex items-center justify-center gap-1.5 text-center text-[0.7rem] text-white/45">
            <ShieldCheck className="size-3.5" aria-hidden /> {t.nothingStored}
          </p>
        </>
      }
    >
      <div className="pt-8">
        <h1 className="text-[1.5rem] font-light tracking-tight">{t.stepsTitle}</h1>
        <ol className="mt-6 space-y-2.5">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <motion.li key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
              className={`flex items-start gap-4 rounded-[22px] p-4 ${glass}`}>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/15"><Icon className="size-[18px]" strokeWidth={1.6} /></span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[0.65rem] text-white/40">0{i + 1}</span>
                  <span className="text-[0.95rem]">{title}</span>
                </div>
                <p className="mt-1 text-[0.8rem] leading-relaxed text-white/55">{body}</p>
              </div>
            </motion.li>
          ))}
        </ol>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className={`mt-6 rounded-[24px] p-4 ${glass}`}>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-peach" aria-hidden />
            <Label className="text-white/60">{t.testingTitle}</Label>
          </div>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-white/55">{t.testingBody}</p>
          <div className="mt-3 grid gap-2">
            <button onClick={() => { unlockAudio(); setFiles([]); router.push("/scan?sample=1"); }}
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-night/50 text-[0.82rem] text-white ring-1 ring-white/20">
              <ScanLine className="size-4" /> {t.useSamplePhoto}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <a href="/sample-paper" target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center gap-1.5 rounded-full text-[0.75rem] text-white/75 ring-1 ring-white/15">
                <ExternalLink className="size-3.5" /> {t.viewSamplePaper}
              </a>
              <button onClick={() => { unlockAudio(); setPlan(SAMPLE_PLANS["en-IN"]!, true); router.push("/plan"); }}
                className="h-10 rounded-full px-2 text-[0.75rem] text-white/75 ring-1 ring-white/15">{t.trySample}</button>
            </div>
          </div>
        </motion.section>
      </div>
    </OnboardingFrame>
  );
}
