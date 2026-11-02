"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Camera, FileText, Info, ShieldCheck } from "lucide-react";
import { usePlan } from "@/components/PlanProvider";
import { Label, Shell } from "@/components/ui";
import { LANGS, langInfo } from "@/lib/langs";
import { SAMPLE_PLANS } from "@/lib/sample";
import { unlockAudio } from "@/lib/audio";

export default function Welcome() {
  const { t, lang, setLang, base, setPlan, ready } = usePlan();
  const router = useRouter();
  const trySample = () => {
    unlockAudio();
    setPlan(SAMPLE_PLANS["en-IN"]!, true);
    router.push("/plan");
  };
  return (
    <Shell className="hero-gradient text-white">
      <div className="pointer-events-none absolute -top-24 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-teal/40 blur-3xl drift" aria-hidden />
      <div className="relative flex min-h-dvh flex-col px-5 pt-[max(env(safe-area-inset-top),16px)] pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[1.35rem] font-light tracking-tight">samjho</span>
            <Label className="text-white/50">by Sarvam AI</Label>
          </div>
          <Link href="/how-it-works" className="grid size-11 place-items-center rounded-full text-white/80 hover:bg-white/10" aria-label={t.howItWorks}>
            <Info className="size-5" />
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mt-14 text-center">
          <h1 className="mt-5 text-balance text-[1.7rem] font-light leading-tight tracking-tight">
            {langInfo(lang).hello}.<br />{t.welcomeTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-[0.95rem] text-white/70">{t.tagline}</p>
        </motion.div>

        <div className="mt-10">
          <Label className="mb-3 text-center text-white/60">{t.chooseLanguage}</Label>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t.chooseLanguage}>
            {LANGS.map((l) => {
              const on = l.code === lang;
              return (
                <button key={l.code} role="radio" aria-checked={on} onClick={() => setLang(l.code)}
                  className={`h-14 rounded-2xl text-[1rem] transition active:scale-95 ${on ? "bg-white text-ink shadow-lg" : "bg-white/8 text-white ring-1 ring-white/15 hover:bg-white/15"}`}>
                  {l.native}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto space-y-3 pt-10">
          {ready && base && (
            <Link href="/plan" className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white/10 text-white ring-1 ring-white/20">
              <FileText className="size-5" /> {t.openMyPlan}
            </Link>
          )}
          <Link href="/scan" onClick={unlockAudio}
            className="flex h-16 w-full items-center justify-between rounded-full bg-white pl-6 pr-2 text-[1.05rem] font-medium text-ink shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] active:scale-[0.98]">
            <span className="flex items-center gap-3"><Camera className="size-5" /> {t.scanPaper}</span>
            <span className="grid size-12 place-items-center rounded-full bg-night text-white"><ArrowRight className="size-5" /></span>
          </Link>
          <button onClick={trySample} className="h-14 w-full rounded-full text-[0.95rem] text-ink/80 underline-offset-4 hover:underline">
            {t.trySample}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-center text-[0.75rem] text-ink/60">
            <ShieldCheck className="size-4" aria-hidden /> {t.nothingStored}
          </p>
        </div>
      </div>
    </Shell>
  );
}
