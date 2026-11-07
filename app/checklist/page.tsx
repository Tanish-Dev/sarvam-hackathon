"use client";
import { useState } from "react";
import { useActivePlan } from "@/components/useActivePlan";
import { Card, Disclaimer, Label, ListenButton, Shell, TickBox, TopBar } from "@/components/ui";
import { SlideToConfirm } from "@/components/SlideToConfirm";
import { fill } from "@/lib/i18n";
import { currentSlot, recoveryDay, SLOTS } from "@/lib/planUtils";
import type { DischargePlan } from "@/lib/schema";

function dayKeys(plan: DischargePlan, d: number) {
  const doses = SLOTS.flatMap((s) => plan.medicines.map((m, i) => (m.schedule[s] ? `d${d}:${s}:${i}` : "")).filter(Boolean));
  const tasks = (plan.checklist_7_days.find((x) => x.day === d)?.tasks ?? []).map((_, i) => `t${d}:${i}`);
  return [...doses, ...tasks];
}

export default function Checklist() {
  const { plan, t, ticks, setTick, setTicks, createdAt } = useActivePlan();
  const today = plan ? recoveryDay(plan, createdAt) : 1;
  const [day, setDay] = useState<number | null>(null);
  if (!plan) return <Shell className="bg-paper" />;

  // The checklist covers the first week; after that it opens on day 7.
  const sel = day ?? Math.min(7, today);
  const tasks = plan.checklist_7_days.find((x) => x.day === sel)?.tasks ?? [];
  const keys = dayKeys(plan, sel);
  const done = keys.filter((k) => ticks[k]).length;
  const pct = keys.length ? done / keys.length : 0;

  const slot = currentSlot();
  const slotKeys = plan.medicines.map((m, i) => (m.schedule[slot] ? `d${today}:${slot}:${i}` : "")).filter(Boolean);
  const slotDone = slotKeys.length > 0 && slotKeys.every((k) => ticks[k]);

  return (
    <Shell className="bg-paper">
      <div className="rounded-b-[36px] bg-night pb-6 text-white">
        <TopBar />
        <div className="px-5">
          <Label className="text-white/55">{t.adherence}</Label>
          <h1 className="mt-1 text-[1.5rem] font-light tracking-tight">{t.checklistTitle}</h1>
          {/* Thin bar chart */}
          <div className="mt-6 flex h-36 items-end justify-between gap-2" role="img" aria-label={t.adherence}>
            {Array.from({ length: 7 }, (_, i) => {
              const d = i + 1;
              const ks = dayKeys(plan, d);
              const p = ks.length ? ks.filter((k) => ticks[k]).length / ks.length : 0;
              return (
                <button key={d} onClick={() => setDay(d)} className="flex h-full flex-1 flex-col items-center justify-end gap-2" aria-label={fill(t.day, { n: d })}>
                  <div className="relative w-full flex-1">
                    <div className="absolute inset-x-[38%] bottom-0 top-0 rounded-full bg-white/10" />
                    <div className="absolute inset-x-[38%] bottom-0 rounded-full bg-gradient-to-t from-teal to-mist transition-all duration-500" style={{ height: `${Math.max(4, p * 100)}%` }} />
                  </div>
                  <span className={`font-mono text-[0.65rem] ${d === sel ? "text-white" : "text-white/45"}`}>{d === today ? "●" : d}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist">
            {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => (
              <button key={d} role="tab" aria-selected={d === sel} onClick={() => setDay(d)}
                className={`grid size-12 shrink-0 place-items-center rounded-full font-mono text-[0.85rem] ring-1 transition ${d === sel ? "bg-white text-ink ring-white" : "text-white/80 ring-white/25"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 pt-5">
        {sel === today && slotKeys.length > 0 && (
          <SlideToConfirm label={fill(t.slideToConfirm, { slot: t[slot] })} doneLabel={fill(t.slotDone, { slot: t[slot] })}
            done={slotDone} onConfirm={() => setTicks(slotKeys, true)} />
        )}
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="text-ink/55">{fill(t.day, { n: sel })}{sel === today ? ` · ${t.today}` : ""}</Label>
              <div className="mt-1 text-[0.95rem]">{fill(t.tasksDone, { done, total: keys.length })}</div>
            </div>
            <ListenButton id={`day${sel}`} text={`${fill(t.day, { n: sel })}. ${tasks.join(". ")}`} />
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-sage transition-all duration-500" style={{ width: `${pct * 100}%` }} />
          </div>
          <ul className="mt-4 space-y-3">
            {tasks.map((task, i) => {
              const k = `t${sel}:${i}`;
              return (
                <li key={k} className="flex items-center gap-3">
                  <TickBox checked={!!ticks[k]} onChange={(v) => setTick(k, v)} label={task} />
                  <span className={`text-[0.9rem] ${ticks[k] ? "text-ink/40 line-through" : ""}`}>{task}</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <Label className="text-ink/55">{t.dosesToday}</Label>
          {SLOTS.map((s) => {
            const meds = plan.medicines.map((m, i) => ({ m, i })).filter(({ m }) => m.schedule[s]);
            if (!meds.length) return null;
            return (
              <div key={s} className="mt-3">
                <div className="text-[0.9rem] font-normal">{t[s]}</div>
                <ul className="mt-2 space-y-2">
                  {meds.map(({ m, i }) => {
                    const k = `d${sel}:${s}:${i}`;
                    return (
                      <li key={k} className="flex items-center gap-3">
                        <TickBox checked={!!ticks[k]} onChange={(v) => setTick(k, v)} label={`${m.name} ${t[s]}`} />
                        <span className={`font-mono text-[0.78rem] uppercase ${ticks[k] ? "text-ink/40 line-through" : ""}`}>{m.name}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </Card>
      </div>
      <Disclaimer />
    </Shell>
  );
}
