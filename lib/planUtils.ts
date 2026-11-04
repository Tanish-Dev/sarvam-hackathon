import type { DischargePlan, Medicine } from "./schema";
import { fill, type Dict } from "./i18n";

export type Slot = "morning" | "afternoon" | "evening" | "night";
export const SLOTS: Slot[] = ["morning", "afternoon", "evening", "night"];

export const DAY_MS = 86_400_000;
const todayUtc = () => { const d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
const isoUtc = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
export const validIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export function daysUntil(iso: string) {
  return Math.round((isoUtc(iso) - todayUtc()) / DAY_MS);
}

/** Recovery day (1, 2, …), where day 1 is the first day after discharge. */
export function recoveryDay(plan: DischargePlan, createdAt: number) {
  const start = validIso(plan.patient.discharged_on) ? isoUtc(plan.patient.discharged_on) : createdAt - DAY_MS;
  const d = Math.round((todayUtc() - start) / DAY_MS);
  return Math.max(1, d);
}

export const regularMeds = (p: DischargePlan) => p.medicines.filter((m) => SLOTS.some((s) => m.schedule[s]));

export function nextFollowUp(p: DischargePlan) {
  return p.follow_ups
    .filter((f) => validIso(f.date_iso) && daysUntil(f.date_iso) >= 0)
    .sort((a, b) => a.date_iso.localeCompare(b.date_iso))[0] ?? p.follow_ups[0];
}

export function currentSlot(): Slot {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 16 ? "afternoon" : h < 20 ? "evening" : "night";
}

export const firstName = (p: DischargePlan, t: Dict) => {
  const n = p.patient.name.split(" ")[0];
  return n ? `${n} ji` : t.hello;
};

export function greetingText(p: DischargePlan, t: Dict) {
  const name = firstName(p, t);
  const n = regularMeds(p).length;
  const f = nextFollowUp(p);
  if (f && validIso(f.date_iso)) {
    const days = daysUntil(f.date_iso);
    if (days === 0) return fill(t.greetingToday, { name, n });
    if (days > 0) return fill(t.greeting, { name, n, days });
  }
  return fill(t.greetingNoFollow, { name, n });
}

export function timesText(m: Medicine, t: Dict) {
  if (m.schedule.sos && !SLOTS.some((s) => m.schedule[s])) return t.whenNeeded;
  return SLOTS.filter((s) => m.schedule[s]).map((s) => t[s]).join(", ");
}

export const foodText = (m: Medicine, t: Dict) =>
  ({ before: t.beforeFood, after: t.afterFood, with: t.withFood, any: "" })[m.food];

export function medScript(m: Medicine, t: Dict) {
  return [m.name.replace(/^Tab\.?\s*/i, ""), m.purpose_simple, `${m.dose}, ${timesText(m, t)}`, foodText(m, t), m.special_instructions]
    .filter(Boolean).join(". ");
}

export function shareText(p: DischargePlan, t: Dict) {
  const lines = [`${t.shareTitle} — ${p.patient.name}`, p.diagnosis_simple, "", t.medicinesTitle];
  p.medicines.forEach((m) => lines.push(`• ${m.name} — ${timesText(m, t)}${foodText(m, t) ? `, ${foodText(m, t)}` : ""} (${m.purpose_simple})`));
  if (p.follow_ups.length) {
    lines.push("", t.followUp);
    p.follow_ups.forEach((f) => lines.push(`• ${f.what} — ${f.date_iso || f.relative_text}${f.where ? `, ${f.where}` : ""}`));
  }
  if (p.warning_signs.length) {
    lines.push("", `${t.warningSigns}:`);
    p.warning_signs.forEach((w) => lines.push(`• ${w.sign_simple}`));
    lines.push(t.call108);
  }
  lines.push("", t.disclaimer, "— Samjho");
  return lines.join("\n");
}
