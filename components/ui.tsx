"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Camera, Check, CheckSquare, Home, Info, Languages, Loader2, Pill, Square, Type, Volume2, VolumeX } from "lucide-react";
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
      className={`inline-flex shrink-0 items-center gap-2 rounded-full ${big ? "h-12 px-5" : "h-10 px-4"} text-[0.8rem] font-normal transition active:scale-95 ${
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
      <Languages className="size-3.5" aria-hidden />
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
  const router = useRouter();
  const { t, largeText, setLargeText, muted, setMuted } = usePlan();
  const btn = `grid size-10 place-items-center rounded-full transition ${dark ? "text-white/80 hover:bg-white/10" : "text-ink/70 hover:bg-ink/5"}`;
  return (
    <header className={`sticky top-0 z-30 px-4 pt-[max(env(safe-area-inset-top),8px)] pb-2 backdrop-blur-xl ${dark ? "bg-night/60" : "bg-paper/80"}`}>
      <div className="flex h-11 items-center justify-between gap-2">
        {back ? (
          <button className={`${btn} -ml-2`} onClick={() => router.push(back)} aria-label={t.back}><ArrowLeft className="size-5" /></button>
        ) : (
          <Link href="/" className={`text-[1.15rem] font-light tracking-tight ${dark ? "text-white" : "text-ink"}`}>samjho</Link>
        )}
        <div className="flex items-center gap-1">
          <LanguagePill dark={dark} />
          <button className={btn} onClick={() => { if (!muted) stopAudio(); setMuted(!muted); }} aria-label={muted ? t.unmute : t.mute}>
            {muted ? <VolumeX className="size-[18px]" /> : <Volume2 className="size-[18px]" />}
          </button>
          <button className={`${btn} ${largeText ? (dark ? "bg-white/15" : "bg-ink/10") : ""}`} onClick={() => setLargeText(!largeText)} aria-pressed={largeText} aria-label={t.largeText}>
            <Type className="size-[18px]" />
          </button>
          <Link href="/how-it-works" className={btn} aria-label={t.howItWorks}><Info className="size-[18px]" /></Link>
        </div>
      </div>
    </header>
  );
}

export function Disclaimer({ dark }: { dark?: boolean }) {
  const { t } = usePlan();
  return (
    <p className={`mx-auto mt-8 max-w-sm px-6 pb-32 text-center text-[0.78rem] leading-relaxed ${dark ? "text-white/55" : "text-ink/55"}`}>
      <AlertTriangle className="mr-1 inline size-3.5 -translate-y-px" aria-hidden />{t.disclaimer}
    </p>
  );
}

export function TickBox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`grid size-7 shrink-0 place-items-center rounded-full ring-1 transition ${checked ? "bg-sage text-white ring-sage" : "bg-white/70 ring-ink/15"}`}>
      {checked && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
          <Check className="size-4" strokeWidth={3} />
        </motion.span>
      )}
    </button>
  );
}

/** Bottom tab bar: Plan · Medicines · [Ask] · Checklist. */
export function MicFab({ onClick, label }: { onClick: () => void; label: string }) {
  const path = usePathname();
  const { t } = usePlan();
  const tabs = [
    { href: "/plan", icon: Home, label: t.navPlan },
    { href: "/medicines", icon: Pill, label: t.navMeds },
    null,
    { href: "/checklist", icon: CheckSquare, label: t.navChecklist },
    { href: "/scan", icon: Camera, label: t.takePhoto },
  ];
  return (
    <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[440px] px-3 pb-[max(env(safe-area-inset-bottom),10px)]">
      <div className="flex h-[68px] items-center justify-around rounded-[26px] bg-white/70 px-1 shadow-[0_12px_40px_-12px_rgba(11,15,20,0.4)] ring-1 ring-white/70 backdrop-blur-2xl">
        {tabs.map((tab, i) => {
          if (!tab) {
            return (
              <button key="ask" onClick={onClick} aria-label={label} className="-mt-8 flex flex-col items-center gap-1">
                <span className="grid size-14 place-items-center rounded-full bg-night text-white shadow-lg ring-4 ring-white/70 transition active:scale-95"><Waveform className="size-6" /></span>
                <span className="text-[0.62rem] font-normal text-ink">{t.navAsk}</span>
              </button>
            );
          }
          const on = path === tab.href;
          const Icon = tab.icon;
          return (
            <Link key={i} href={tab.href} aria-current={on ? "page" : undefined}
              className={`flex min-w-14 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 transition ${on ? "text-ink" : "text-ink/45"}`}>
              <Icon className="size-5" strokeWidth={on ? 2 : 1.6} />
              <span className="max-w-16 truncate text-[0.62rem] font-normal">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
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
