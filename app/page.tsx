"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Camera, ExternalLink, FileText, Info, MessageCircle, ScanLine, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import { usePlan } from "@/components/PlanProvider";
import { Label, Shell } from "@/components/ui";
import { LANGS, langInfo } from "@/lib/langs";
import { SAMPLE_PLANS } from "@/lib/sample";
import { unlockAudio } from "@/lib/audio";

const glass = "bg-white/[0.07] ring-1 ring-white/15 backdrop-blur-xl";

export default function Welcome() {
  const { t, lang, setLang, base, setPlan, ready, setFiles } = usePlan();
  const router = useRouter();

  const instantDemo = () => {
    unlockAudio();
    setPlan(SAMPLE_PLANS["en-IN"]!, true);
    router.push("/plan");
  };
  const scanSample = () => {
    unlockAudio();
    setFiles([]);
    router.push("/scan?sample=1");
  };

  const steps = [
    { icon: Camera, title: t.step1Title, body: t.step1Body },
    { icon: Volume2, title: t.step2Title, body: t.step2Body },
    { icon: MessageCircle, title: t.step3Title, body: t.step3Body },
  ];

  return (
    <Shell className="bg-night text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 left-1/2 size-[560px] -translate-x-1/2 rounded-full bg-teal/45 blur-3xl drift" />
        <div className="absolute top-[520px] -right-40 size-[420px] rounded-full bg-rose/25 blur-3xl drift [animation-delay:-5s]" />
        <div className="absolute top-[980px] -left-40 size-[420px] rounded-full bg-slate blur-3xl" />
      </div>

      <div className="relative px-5 pt-[max(env(safe-area-inset-top),14px)] pb-10">
        <header className="flex h-11 items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[1.2rem] font-light tracking-tight">samjho</span>
            <Label className="text-white/45">Sarvam AI</Label>
          </div>
          <Link href="/how-it-works" className="grid size-10 place-items-center rounded-full text-white/75 hover:bg-white/10" aria-label={t.howItWorks}>
            <Info className="size-[18px]" />
          </Link>
        </header>

        {/* Hero */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="pt-12 text-center">
          <p className="text-[0.9rem] text-white/60">{langInfo(lang).hello}</p>
          <h1 className="mx-auto mt-2 max-w-[20ch] text-balance text-[1.6rem] font-light leading-tight tracking-tight">{t.welcomeTitle}</h1>
          <p className="mx-auto mt-3 max-w-[30ch] text-[0.85rem] leading-relaxed text-white/60">{t.tagline}</p>
        </motion.section>

        {/* Language */}
        <section className="mt-9">
          <Label className="mb-3 text-center text-white/50">{t.chooseLanguage}</Label>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t.chooseLanguage}>
            {LANGS.map((l) => {
              const on = l.code === lang;
              return (
                <button key={l.code} role="radio" aria-checked={on} onClick={() => setLang(l.code)}
                  className={`h-12 rounded-2xl text-[0.9rem] transition active:scale-95 ${on ? "bg-white text-ink" : `${glass} text-white/85 hover:bg-white/15`}`}>
                  {l.native}
                </button>
              );
            })}
          </div>
        </section>

        {/* Steps */}
        <section className="mt-10">
          <Label className="mb-3 text-white/50">{t.stepsTitle}</Label>
          <ol className="space-y-2.5">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <motion.li key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
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
        </section>

        {/* Primary CTA */}
        <section className="mt-8 space-y-3">
          {ready && base && (
            <Link href="/plan" className={`flex h-14 w-full items-center justify-center gap-2 rounded-full text-[0.9rem] text-white ${glass}`}>
              <FileText className="size-[18px]" strokeWidth={1.6} /> {t.openMyPlan}
            </Link>
          )}
          <Link href="/scan" onClick={unlockAudio}
            className="flex h-14 w-full items-center justify-between rounded-full bg-white/[0.16] pl-6 pr-1.5 text-[0.95rem] font-light text-white ring-1 ring-white/30 backdrop-blur-xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] transition hover:bg-white/[0.22] active:scale-[0.98]">
            <span>{t.getStarted}</span>
            <span className="grid size-11 place-items-center rounded-full bg-white text-ink"><ArrowRight className="size-[18px]" /></span>
          </Link>
          <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[0.72rem] text-white/45">
            <ShieldCheck className="size-3.5" aria-hidden /> {t.nothingStored}
          </p>
        </section>

        {/* Testing */}
        <section className={`mt-10 rounded-[26px] p-5 ${glass}`}>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-peach" aria-hidden />
            <h2 className="text-[0.95rem]">{t.testingTitle}</h2>
          </div>
          <p className="mt-1.5 text-[0.8rem] leading-relaxed text-white/55">{t.testingBody}</p>
          <div className="mt-4 grid gap-2">
            <button onClick={scanSample} className="flex h-12 items-center justify-center gap-2 rounded-full bg-night/60 text-[0.85rem] text-white ring-1 ring-white/20">
              <ScanLine className="size-4" /> {t.useSamplePhoto}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <a href="/sample-paper" target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-1.5 rounded-full text-[0.78rem] text-white/80 ring-1 ring-white/15">
                <ExternalLink className="size-3.5" /> {t.viewSamplePaper}
              </a>
              <button onClick={instantDemo} className="h-11 rounded-full px-2 text-[0.78rem] text-white/80 ring-1 ring-white/15">{t.trySample}</button>
            </div>
          </div>
        </section>
      </div>
    </Shell>
  );
}
