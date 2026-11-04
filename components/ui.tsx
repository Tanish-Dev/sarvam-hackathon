"use client";
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { audioStore, speak, stopAudio, unlockAudio } from "@/lib/audio";
import { LANGS, type LangCode } from "@/lib/langs";
import { previousPath } from "@/lib/nav";
import { Checkmark, ChevronLeft, ExclamationmarkCircle, Globe, Speaker2Fill, SpeakerSlashFill, StopFill } from "./icons";
import { usePlan } from "./PlanProvider";

/**
 * Back returns to the previous in-app page when there is one; otherwise it replaces this page with
 * `fallback`, so it never leaves the app or piles up history. `strict` only goes back to `fallback` itself.
 */
export function useGoBack(fallback: string, strict = false) {
  const router = useRouter();
  return () => {
    const prev = previousPath();
    if (prev && (!strict || prev === fallback)) router.back();
    else router.replace(fallback);
  };
}

export const useAudioState = () => useSyncExternalStore(audioStore.subscribe, audioStore.get, audioStore.server);

export function ListenButton({ id, text, label, dark, big }: { id: string; text: string; label?: string; dark?: boolean; big?: boolean }) {
  const { lang, t } = usePlan();
  const a = useAudioState();
  const active = a.id === id;
  return (
    <button
      type="button"
      aria-label={active ? t.stop : `${t.listen}${label ? `: ${label}` : ""}`}
      onClick={(e) => { e.stopPropagation(); unlockAudio(); if (active) stopAudio(); else void speak(id, text, lang); }}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full ${big ? "h-12 px-5" : "h-10 px-4"} text-[0.8rem] font-normal transition active:scale-95 ${
        dark ? "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15" : "bg-ink/5 text-ink ring-1 ring-ink/10 hover:bg-ink/10"
      }`}
    >
      {active && a.loading ? <Spinner className="size-4" /> : active ? <StopFill className="size-3.5" aria-hidden /> : <Speaker2Fill className="size-4" aria-hidden />}
      <span>{label ?? (active ? t.stop : t.listen)}</span>
    </button>
  );
}

export function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-mono text-[0.68rem] uppercase tracking-[0.14em] ${className}`}>{children}</div>;
}

export function Card({ children, className = "", dark }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-[28px] p-5 ${dark ? "bg-white/[0.06] text-white ring-1 ring-white/12 backdrop-blur-xl" : "bg-white/65 text-ink ring-1 ring-white/80 backdrop-blur-xl shadow-[0_10px_30px_-14px_rgba(11,15,20,0.18)]"} ${className}`}
    >
      {children}
    </motion.section>
  );
}

export function LanguagePill({ dark }: { dark?: boolean }) {
  const { lang, setLang, t } = usePlan();
  return (
    <label className={`relative inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-[0.75rem] ${dark ? "bg-white/10 text-white ring-1 ring-white/15" : "bg-ink/5 text-ink ring-1 ring-ink/10"}`}>
      <Globe className="size-3.5" aria-hidden />
      <span className="sr-only">{t.chooseLanguage}</span>
      <select
        value={lang}
        onChange={(e) => { stopAudio(); setLang(e.target.value as LangCode); }}
        className="appearance-none bg-transparent pr-1 outline-none [&>option]:text-ink"
      >
        {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
      </select>
    </label>
  );
}

/**
 * Page header with no background of its own, so it blends into whatever it sits on. It scrolls away with the page.
 * `back` is the parent screen and shows a back button; `title` is the page name; `left` replaces both.
 */
export function TopBar({ dark = true, back, title, left }: { dark?: boolean; back?: string; title?: string; left?: React.ReactNode }) {
  const goBack = useGoBack(back ?? "/home");
  const { t, muted, setMuted } = usePlan();
  const btn = `grid size-10 place-items-center rounded-full transition ${dark ? "text-white/85 hover:bg-white/10" : "text-ink/75 hover:bg-ink/5"}`;
  return (
    <header className={`relative z-30 px-4 pt-[max(var(--safe-top),8px)] pb-1 ${dark ? "text-white" : "text-ink"}`}>
      <div className="flex h-11 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          {back && <button className={`${btn} -ml-2`} onClick={goBack} aria-label={t.back}><ChevronLeft className="size-5" /></button>}
          {title && <h1 className="truncate text-[1.35rem] font-light tracking-tight">{title}</h1>}
          {left}
        </div>
        <div className="flex items-center gap-1">
          <LanguagePill dark={dark} />
          <button className={btn} onClick={() => { if (!muted) stopAudio(); setMuted(!muted); }} aria-label={muted ? t.unmute : t.mute}>
            {muted ? <SpeakerSlashFill className="size-[18px]" /> : <Speaker2Fill className="size-[18px]" />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function Disclaimer({ dark }: { dark?: boolean }) {
  const { t } = usePlan();
  return (
    <p className={`mx-auto mt-8 max-w-sm px-6 pb-32 text-center text-[0.78rem] leading-relaxed ${dark ? "text-white/55" : "text-ink/55"}`}>
      <ExclamationmarkCircle className="mr-1 inline size-3.5 -translate-y-px" aria-hidden />{t.disclaimer}
    </p>
  );
}

export function TickBox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`grid size-7 shrink-0 place-items-center rounded-full ring-1 transition ${checked ? "bg-sage text-white ring-sage" : "bg-white/70 ring-ink/15"}`}>
      {checked && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
          <Checkmark className="size-3.5" />
        </motion.span>
      )}
    </button>
  );
}

export function Spinner({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

export function Shell({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <div className={`relative mx-auto min-h-(--app-h) w-full max-w-[440px] overflow-x-clip sm:shadow-[0_0_80px_-20px_rgba(0,0,0,0.6)] ${className}`}>{children}</div>;
}

export const darkBtn = "flex h-14 w-full items-center justify-center gap-2 rounded-full bg-night text-[0.95rem] font-light text-white shadow-[0_20px_50px_-15px_rgba(11,15,20,0.6)] transition active:scale-[0.98] disabled:opacity-40";
