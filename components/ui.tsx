"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, CheckSquare, Home, Info, Languages, Loader2, Pill, Square, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { audioStore, speak, stopAudio, unlockAudio } from "@/lib/audio";
import { LANGS, type LangCode } from "@/lib/langs";
import { usePlan } from "./PlanProvider";

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
      className={`inline-flex shrink-0 items-center gap-2 rounded-full ${big ? "h-14 px-5" : "h-11 px-4"} text-[0.85rem] font-medium transition active:scale-95 ${
        dark ? "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15" : "bg-ink/5 text-ink ring-1 ring-ink/10 hover:bg-ink/10"
      }`}
    >
      {active && a.loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : active ? <Square className="size-4 fill-current" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
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
      className={`rounded-[28px] p-5 ${dark ? "bg-night text-white ring-1 ring-white/10" : "bg-white text-ink shadow-[0_1px_0_rgba(11,15,20,0.04),0_10px_30px_-12px_rgba(11,15,20,0.18)]"} ${className}`}
    >
      {children}
    </motion.section>
  );
}

export function LanguagePill({ dark }: { dark?: boolean }) {
  const { lang, setLang, t } = usePlan();
  return (
    <label className={`relative inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[0.8rem] ${dark ? "bg-white/10 text-white ring-1 ring-white/15" : "bg-ink/5 text-ink ring-1 ring-ink/10"}`}>
      <Languages className="size-4" aria-hidden />
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

export function TopBar({ dark = true, back }: { dark?: boolean; back?: string }) {
  const path = usePathname();
  const router = useRouter();
  const { t, largeText, setLargeText, muted, setMuted } = usePlan();
  const tabs = [
    { href: "/plan", icon: Home, label: t.navPlan },
    { href: "/medicines", icon: Pill, label: t.navMeds },
    { href: "/checklist", icon: CheckSquare, label: t.navChecklist },
  ];
  const btn = `grid size-11 place-items-center rounded-full transition ${dark ? "text-white/80 hover:bg-white/10" : "text-ink/70 hover:bg-ink/5"}`;
  return (
    <header className={`sticky top-0 z-30 px-3 pt-[max(env(safe-area-inset-top),10px)] pb-2 backdrop-blur-xl ${dark ? "bg-night/70" : "bg-paper/80"}`}>
      <div className="flex items-center justify-between gap-1">
        {back ? (
          <button className={btn} onClick={() => router.push(back)} aria-label={t.back}><ArrowLeft className="size-5" /></button>
        ) : (
          <Link href="/how-it-works" className={btn} aria-label={t.howItWorks}><Info className="size-5" /></Link>
        )}
        <nav className="flex items-center gap-1" aria-label="Main">
          {tabs.map(({ href, icon: Icon, label }) => {
            const on = path === href;
            return (
              <Link key={href} href={href} aria-label={label} aria-current={on ? "page" : undefined}
                className={`relative grid h-11 w-12 place-items-center ${dark ? (on ? "text-white" : "text-white/50") : on ? "text-ink" : "text-ink/45"}`}>
                <Icon className="size-5" strokeWidth={1.6} />
                {on && <motion.span layoutId="tab" className={`absolute bottom-1 h-px w-6 ${dark ? "bg-white" : "bg-ink"}`} />}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <button className={btn} onClick={() => { if (!muted) stopAudio(); setMuted(!muted); }} aria-label={muted ? t.unmute : t.mute}>
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <button className={`${btn} font-semibold`} onClick={() => setLargeText(!largeText)} aria-pressed={largeText} aria-label={t.largeText}>
            <span className="flex items-baseline"><span className="text-[0.75rem]">A</span><span className="text-[1rem]">A</span></span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function Disclaimer({ dark }: { dark?: boolean }) {
  const { t } = usePlan();
  return (
    <p className={`mx-auto mt-8 max-w-sm px-6 pb-36 text-center text-[0.78rem] leading-relaxed ${dark ? "text-white/55" : "text-ink/55"}`}>
      <AlertTriangle className="mr-1 inline size-3.5 -translate-y-px" aria-hidden />{t.disclaimer}
    </p>
  );
}

export function TickBox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`grid size-8 shrink-0 place-items-center rounded-full ring-1 transition ${checked ? "bg-sage text-white ring-sage" : "bg-white ring-ink/20"}`}>
      {checked && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
          <Check className="size-4" strokeWidth={3} />
        </motion.span>
      )}
    </button>
  );
}

export function MicFab({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(env(safe-area-inset-bottom),18px)]">
      <button onClick={onClick} aria-label={label}
        className="pointer-events-auto flex h-16 items-center gap-3 rounded-full bg-white pl-3 pr-6 text-ink shadow-[0_12px_40px_-8px_rgba(11,15,20,0.45)] ring-1 ring-ink/5 transition active:scale-95">
        <span className="grid size-11 place-items-center rounded-full bg-night text-white"><Waveform /></span>
        <span className="font-medium">{label}</span>
      </button>
    </div>
  );
}

export function Waveform({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M8 9v6M12 6v12M16 9v6" />
    </svg>
  );
}

export function Shell({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <div className={`relative mx-auto min-h-dvh w-full max-w-[440px] overflow-x-clip ${className}`}>{children}</div>;
}
