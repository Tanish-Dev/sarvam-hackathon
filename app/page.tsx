"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Checkmark, ChevronLeft } from "@/components/icons";
import { usePlan } from "@/components/PlanProvider";
import { darkBtn, Shell } from "@/components/ui";
import { LANGS, langInfo } from "@/lib/langs";
import { unlockAudio } from "@/lib/audio";

/** Welcome → language, then sign-in. Signed-in users never see this (proxy.ts sends them Home). */
export default function Welcome() {
  const { user, t, lang, setLang } = usePlan();
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const signedIn = !!user?.name;

  useEffect(() => { if (signedIn) router.replace("/home"); }, [signedIn, router]);
  if (signedIn) return <Shell className="hero-gradient" />;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
        {step === 0 ? (
          <Shell className="hero-gradient overflow-hidden text-white">
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              <div className="absolute -top-16 left-1/2 size-[440px] -translate-x-1/2 rounded-full bg-teal/40 blur-3xl drift" />
            </div>
            <div className="relative flex min-h-(--app-h) flex-col px-6 pt-[max(var(--safe-top),20px)] pb-[max(var(--safe-bottom),20px)]">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
                <div className="grid size-20 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-xl">
                  <span className="text-[1.6rem] font-extralight">स</span>
                </div>
                <h1 className="mt-8 text-[2.4rem] font-extralight tracking-tight">samjho</h1>
                <p className="mx-auto mt-3 max-w-[26ch] text-balance text-[1rem] font-light leading-relaxed text-white/80">{t.tagline}</p>
              </motion.div>
              <div className="space-y-3">
                <button onClick={() => { unlockAudio(); setStep(1); }} className={darkBtn}>
                  {t.getStarted} <ArrowRight className="size-4" />
                </button>
                <Link href="/login" className="flex h-11 w-full items-center justify-center rounded-full text-[0.85rem] text-ink/70">{t.haveAccount}</Link>
                <p className="text-center text-[0.7rem] text-ink/45">Powered by Sarvam AI</p>
              </div>
            </div>
          </Shell>
        ) : (
          <Shell className="bg-paper">
            <div className="flex min-h-(--app-h) flex-col px-5 pt-[max(var(--safe-top),10px)] pb-[max(var(--safe-bottom),20px)]">
              <header className="flex h-11 items-center">
                <button onClick={() => setStep(0)} aria-label={t.back} className="-ml-2 grid size-11 place-items-center rounded-full hover:bg-ink/5">
                  <ChevronLeft className="size-5" />
                </button>
              </header>
              <div className="flex-1 pt-4">
                <p className="text-[0.85rem] text-ink/55">{langInfo(lang).hello}</p>
                <h1 className="mt-1 text-[1.6rem] font-light tracking-tight">{t.chooseLanguage}</h1>
                <div className="mt-6 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label={t.chooseLanguage}>
                  {LANGS.map((l) => {
                    const on = l.code === lang;
                    return (
                      <button key={l.code} role="radio" aria-checked={on} onClick={() => setLang(l.code)}
                        className={`flex h-14 items-center justify-between rounded-2xl px-4 text-left transition active:scale-[0.97] ${on ? "bg-night text-white" : "bg-white/70 ring-1 ring-white/80 backdrop-blur-xl hover:bg-white"}`}>
                        <span>
                          <span className="block text-[0.95rem]">{l.native}</span>
                          <span className={`block text-[0.68rem] ${on ? "text-white/55" : "text-ink/45"}`}>{l.english}</span>
                        </span>
                        {on && <Checkmark className="size-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => router.push("/login")} className={`mt-8 ${darkBtn}`}>{t.continue} <ArrowRight className="size-4" /></button>
            </div>
          </Shell>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
