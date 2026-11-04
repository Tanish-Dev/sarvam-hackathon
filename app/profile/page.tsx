"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Checkmark, ChevronRight, Globe, InfoCircle, Plus, Power, TextformatSize, Trash, Speaker2Fill } from "@/components/icons";
import { usePlan } from "@/components/PlanProvider";
import { Disclaimer, Label, Shell, TopBar } from "@/components/ui";
import { stopAudio } from "@/lib/audio";
import { fill } from "@/lib/i18n";
import { htmlLang, LANGS, type LangCode } from "@/lib/langs";

const group = "divide-y divide-ink/5 overflow-hidden rounded-[22px] bg-white/65 ring-1 ring-white/80 backdrop-blur-xl shadow-[0_10px_30px_-14px_rgba(11,15,20,0.18)]";
const row = "flex min-h-14 w-full items-center gap-3 px-4 text-left text-[0.92rem]";

function Toggle({ label, icon, on, onChange }: { label: string; icon: React.ReactNode; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={row}>
      {icon}
      <span className="flex-1">{label}</span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-sage" : "bg-ink/15"}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

/** Asks for a second tap before doing something that can't be undone. */
function useConfirm() {
  const [armed, setArmed] = useState<string | null>(null);
  return {
    armed: (key: string) => armed === key,
    tap: (key: string, run: () => void) => {
      if (armed === key) { setArmed(null); run(); return; }
      setArmed(key);
      setTimeout(() => setArmed((a) => (a === key ? null : a)), 4000);
    },
  };
}

export default function Profile() {
  const { t, user, plans, active, setActive, removePlan, view, lang, setLang, largeText, setLargeText, muted, setMuted, signOut, clear } = usePlan();
  const router = useRouter();
  const confirm = useConfirm();
  const icon = "size-[18px] shrink-0 text-ink/55";

  const date = (ms: number) => {
    try { return new Intl.DateTimeFormat(htmlLang(lang), { day: "numeric", month: "short" }).format(ms); } catch { return new Date(ms).toDateString(); }
  };

  return (
    <Shell className="bg-paper">
      <TopBar dark={false} title={t.navProfile} />
      <div className="space-y-6 px-4 pt-3">
        <section className={`${group} flex items-center gap-4 p-4`}>
          <span className="dusk-gradient grid size-14 shrink-0 place-items-center rounded-full text-[1.4rem] font-light text-white">
            {(user?.name || "?").trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[1.1rem]">{user?.name}</div>
            <div className="text-[0.85rem] text-ink/55">+91 {user?.phone}</div>
          </div>
        </section>

        <section>
          <Label className="px-2 text-ink/50">{t.papers}</Label>
          <ul className={`mt-2 ${group}`}>
            {plans.map((saved) => {
              const p = view(saved);
              const on = saved.id === active?.id;
              const del = `del:${saved.id}`;
              return (
                <li key={saved.id} className="flex items-center">
                  <button onClick={() => setActive(saved.id)} aria-pressed={on} className={`${row} min-w-0 flex-1 py-3`}>
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full ${on ? "bg-night text-white" : "ring-1 ring-ink/15"}`}>
                      {on && <Checkmark className="size-3" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{p.patient.name || p.diagnosis_simple}</span>
                      <span className="block truncate text-[0.75rem] text-ink/50">
                        {saved.isSample ? `${t.sampleBadge} · ` : ""}{fill(t.addedOn, { date: date(saved.createdAt) })}
                      </span>
                    </span>
                  </button>
                  <button onClick={() => confirm.tap(del, () => removePlan(saved.id))} aria-label={confirm.armed(del) ? t.deletePlanSure : t.deletePlan}
                    className={`mr-2 flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.78rem] transition ${confirm.armed(del) ? "bg-alert text-white" : "text-ink/45 hover:bg-ink/5"}`}>
                    <Trash className="size-4" aria-hidden />{confirm.armed(del) && t.deletePlan}
                  </button>
                </li>
              );
            })}
            <li>
              <Link href="/scan" className={`${row} text-ink/80`}><Plus className={icon} aria-hidden /> {t.scanAgain}</Link>
            </li>
          </ul>
        </section>

        <section>
          <Label className="px-2 text-ink/50">{t.settings}</Label>
          <div className={`mt-2 ${group}`}>
            <label className={row}>
              <Globe className={icon} aria-hidden />
              <span className="flex-1">{t.chooseLanguage}</span>
              <select value={lang} onChange={(e) => { stopAudio(); setLang(e.target.value as LangCode); }}
                className="max-w-[45%] appearance-none bg-transparent text-right text-ink/60 outline-none">
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
              </select>
              <ChevronRight className="size-3.5 text-ink/35" aria-hidden />
            </label>
            <Toggle label={t.largeText} icon={<TextformatSize className={icon} aria-hidden />} on={largeText} onChange={setLargeText} />
            <Toggle label={t.voiceAuto} icon={<Speaker2Fill className={icon} aria-hidden />} on={!muted} onChange={(v) => { if (!v) stopAudio(); setMuted(!v); }} />
            <Link href="/how-it-works" className={row}>
              <InfoCircle className={icon} aria-hidden /><span className="flex-1">{t.howItWorks}</span><ChevronRight className="size-3.5 text-ink/35" aria-hidden />
            </Link>
          </div>
        </section>

        <section className={group}>
          <button onClick={() => { void signOut().then(() => router.replace("/")); }} className={row}>
            <Power className={icon} aria-hidden /> {t.signOut}
          </button>
          <button onClick={() => confirm.tap("clear", () => { void clear().then(() => router.replace("/")); })}
            className={`${row} ${confirm.armed("clear") ? "font-medium text-alert" : "text-alert/80"}`}>
            <Trash className="size-[18px] shrink-0" aria-hidden /> {confirm.armed("clear") ? t.clearDataSure : t.clearData}
          </button>
        </section>
        <p className="px-4 text-center text-[0.72rem] leading-relaxed text-ink/45">{t.nothingStored}</p>
      </div>
      <Disclaimer />
    </Shell>
  );
}
