"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, Moon, Sun, Sunrise, Sunset, Utensils } from "lucide-react";
import { useRequirePlan } from "@/components/useRequirePlan";
import { Disclaimer, Label, ListenButton, MicFab, Shell, TopBar } from "@/components/ui";
import { fill } from "@/lib/i18n";
import { foodText, medScript, SLOTS, timesText } from "@/lib/planUtils";

const ICONS = { morning: Sunrise, afternoon: Sun, evening: Sunset, night: Moon };

export default function Medicines() {
  const { plan, t } = useRequirePlan();
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  if (!plan) return <Shell className="bg-night" />;

  return (
    <Shell className="bg-night text-white">
      <TopBar />
      <div className="px-4">
        <div className="dusk-gradient mt-2 rounded-[28px] p-6">
          <Label className="text-white/75">{fill(t.medicinesCount, { n: plan.medicines.length })}</Label>
          <h1 className="mt-2 text-[1.5rem] font-light tracking-tight">{t.medicinesTitle}</h1>
          <p className="mt-2 text-[0.9rem] text-white/85">{plan.diagnosis_simple}</p>
        </div>

        <ul className="mt-4 divide-y divide-white/10">
          {plan.medicines.map((m, i) => {
            const isOpen = open === i;
            const slotLabel = timesText(m, t);
            return (
              <li key={i}>
                <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center gap-3 py-4 text-left">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[0.8rem] uppercase tracking-[0.1em]">
                      {m.name} <span className="text-white/45">· {slotLabel}</span>
                    </div>
                    <div className="mt-1 text-[0.95rem] text-white/70">{m.purpose_simple}</div>
                    {m.confidence === "low" && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#B5651D]/25 px-2.5 py-1 text-[0.75rem] text-[#F6C28B]">
                        <AlertTriangle className="size-3.5" /> {t.confirmChip}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`size-5 shrink-0 text-white/50 transition ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mb-4 space-y-4 rounded-[24px] bg-white/[0.06] p-4 ring-1 ring-white/10">
                        <div className="grid grid-cols-4 gap-2">
                          {SLOTS.map((s) => {
                            const Icon = ICONS[s];
                            const on = m.schedule[s];
                            return (
                              <div key={s} className={`flex flex-col items-center gap-1 rounded-2xl py-3 ${on ? "bg-white text-ink" : "bg-white/5 text-white/35"}`}>
                                <Icon className="size-5" aria-hidden />
                                <span className="text-[0.7rem]">{t[s]}</span>
                              </div>
                            );
                          })}
                        </div>
                        {m.schedule.sos && <p className="text-[0.9rem] text-peach">{t.whenNeeded}</p>}
                        <dl className="grid grid-cols-2 gap-3 text-[0.9rem]">
                          <div><dt><Label className="text-white/50">{t.dose}</Label></dt><dd className="mt-1">{m.dose}</dd></div>
                          <div><dt><Label className="text-white/50">{t.food}</Label></dt><dd className="mt-1 flex items-center gap-1.5"><Utensils className="size-4" />{foodText(m, t) || t.anyTime}</dd></div>
                          <div className="col-span-2"><dt><Label className="text-white/50">{t.timing}</Label></dt>
                            <dd className="mt-1">{m.duration_days ? fill(t.daysLeft, { n: m.duration_days }) : t.continueUntil}</dd></div>
                        </dl>
                        {m.special_instructions && <p className="text-[0.95rem] leading-snug"><span className="text-white/60">{t.specialInstructions}:</span> {m.special_instructions}</p>}
                        {m.source_text && (
                          <blockquote className="rounded-2xl border-l-2 border-peach bg-black/30 p-3">
                            <Label className="text-peach">{t.fromYourPaper}</Label>
                            <p className="mt-1 font-mono text-[0.85rem] text-white/90">“{m.source_text}”</p>
                          </blockquote>
                        )}
                        <ListenButton id={`med${i}`} text={medScript(m, t)} dark />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
      <Disclaimer dark />
      <MicFab onClick={() => router.push("/ask")} label={t.askAnything} />
    </Shell>
  );
}
