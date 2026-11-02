"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { usePlan } from "@/components/PlanProvider";
import { OnboardingFrame, glass, primaryBtn } from "@/components/Onboarding";
import { LANGS, langInfo } from "@/lib/langs";

export default function Language() {
  const { t, lang, setLang } = usePlan();
  return (
    <OnboardingFrame step={2} footer={<Link href="/guide" className={primaryBtn}>{t.continue} <ArrowRight className="size-[18px]" /></Link>}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="pt-10">
        <p className="text-[0.85rem] text-white/55">{langInfo(lang).hello}</p>
        <h1 className="mt-1 text-[1.5rem] font-light tracking-tight">{t.chooseLanguage}</h1>
        <div className="mt-7 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label={t.chooseLanguage}>
          {LANGS.map((l) => {
            const on = l.code === lang;
            return (
              <button key={l.code} role="radio" aria-checked={on} onClick={() => setLang(l.code)}
                className={`flex h-14 items-center justify-between rounded-2xl px-4 text-left transition active:scale-[0.97] ${on ? "bg-white text-ink" : `${glass} text-white/85 hover:bg-white/15`}`}>
                <span>
                  <span className="block text-[0.95rem]">{l.native}</span>
                  <span className={`block text-[0.68rem] ${on ? "text-ink/50" : "text-white/40"}`}>{l.english}</span>
                </span>
                {on && <Check className="size-4" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </OnboardingFrame>
  );
}
