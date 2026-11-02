// Discharge plan: the single data shape shared by decode, translate, UI and voice Q&A.

export type Food = "before" | "after" | "with" | "any";
export type Confidence = "high" | "low";

export interface Schedule {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  sos: boolean;
}

export interface Medicine {
  name: string;
  generic_name: string;
  purpose_simple: string;
  dose: string;
  form: string;
  schedule: Schedule;
  food: Food;
  duration_days: number | null;
  special_instructions: string;
  source_text: string;
  confidence: Confidence;
}

export interface FollowUp {
  what: string;
  date_iso: string;
  relative_text: string;
  where: string;
  source_text: string;
}

export interface DischargePlan {
  patient: {
    name: string;
    age: string;
    sex: string;
    hospital: string;
    doctor: string;
    admitted_on: string;
    discharged_on: string;
  };
  diagnosis_simple: string;
  what_happened: string;
  medicines: Medicine[];
  follow_ups: FollowUp[];
  tests_pending: { name: string; when: string; source_text: string }[];
  diet: string[];
  activity: string[];
  warning_signs: { sign_simple: string; action: string }[];
  checklist_7_days: { day: number; tasks: string[] }[];
  unclear_items: string[];
  glossary: { term: string; meaning_simple: string }[];
}

const str = { type: "string" } as const;
const strArr = { type: "array", items: str } as const;

function obj(properties: Record<string, unknown>) {
  return { type: "object", additionalProperties: false, required: Object.keys(properties), properties };
}

export const planJsonSchema = obj({
  patient: obj({
    name: str, age: str, sex: str, hospital: str, doctor: str, admitted_on: str, discharged_on: str,
  }),
  diagnosis_simple: str,
  what_happened: str,
  medicines: {
    type: "array",
    items: obj({
      name: str,
      generic_name: str,
      purpose_simple: str,
      dose: str,
      form: str,
      schedule: obj({
        morning: { type: "boolean" },
        afternoon: { type: "boolean" },
        evening: { type: "boolean" },
        night: { type: "boolean" },
        sos: { type: "boolean" },
      }),
      food: { type: "string", enum: ["before", "after", "with", "any"] },
      duration_days: { type: ["integer", "null"] },
      special_instructions: str,
      source_text: str,
      confidence: { type: "string", enum: ["high", "low"] },
    }),
  },
  follow_ups: {
    type: "array",
    items: obj({ what: str, date_iso: str, relative_text: str, where: str, source_text: str }),
  },
  tests_pending: { type: "array", items: obj({ name: str, when: str, source_text: str }) },
  diet: strArr,
  activity: strArr,
  warning_signs: { type: "array", items: obj({ sign_simple: str, action: str }) },
  checklist_7_days: {
    type: "array",
    items: obj({ day: { type: "integer" }, tasks: strArr }),
  },
  unclear_items: strArr,
  glossary: { type: "array", items: obj({ term: str, meaning_simple: str }) },
});

// The model output is untrusted: coerce it into a complete, well-typed plan.
const s = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const b = (v: unknown) => v === true || v === "true";
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const rec = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

export function normalizePlan(raw: unknown): DischargePlan {
  const r = rec(raw);
  const p = rec(r.patient);
  const foods: Food[] = ["before", "after", "with", "any"];
  const plan: DischargePlan = {
    patient: {
      name: s(p.name), age: s(p.age), sex: s(p.sex), hospital: s(p.hospital), doctor: s(p.doctor),
      admitted_on: s(p.admitted_on), discharged_on: s(p.discharged_on),
    },
    diagnosis_simple: s(r.diagnosis_simple),
    what_happened: s(r.what_happened),
    medicines: arr(r.medicines).map((m0) => {
      const m = rec(m0);
      const sc = rec(m.schedule);
      const d = typeof m.duration_days === "number" ? Math.round(m.duration_days) : Number.parseInt(s(m.duration_days), 10);
      return {
        name: s(m.name), generic_name: s(m.generic_name), purpose_simple: s(m.purpose_simple),
        dose: s(m.dose), form: s(m.form),
        schedule: { morning: b(sc.morning), afternoon: b(sc.afternoon), evening: b(sc.evening), night: b(sc.night), sos: b(sc.sos) },
        food: foods.includes(m.food as Food) ? (m.food as Food) : "any",
        duration_days: Number.isFinite(d) && d > 0 ? d : null,
        special_instructions: s(m.special_instructions),
        source_text: s(m.source_text),
        confidence: m.confidence === "low" ? "low" : "high",
      };
    }).filter((m) => m.name),
    follow_ups: arr(r.follow_ups).map((f0) => {
      const f = rec(f0);
      const iso = s(f.date_iso);
      return {
        what: s(f.what), date_iso: /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : "",
        relative_text: s(f.relative_text), where: s(f.where), source_text: s(f.source_text),
      };
    }).filter((f) => f.what),
    tests_pending: arr(r.tests_pending).map((t0) => {
      const t = rec(t0);
      return { name: s(t.name), when: s(t.when), source_text: s(t.source_text) };
    }).filter((t) => t.name),
    diet: arr(r.diet).map(s).filter(Boolean),
    activity: arr(r.activity).map(s).filter(Boolean),
    warning_signs: arr(r.warning_signs).map((w0) => {
      const w = rec(w0);
      return { sign_simple: s(w.sign_simple), action: s(w.action) };
    }).filter((w) => w.sign_simple),
    checklist_7_days: [],
    unclear_items: arr(r.unclear_items).map(s).filter(Boolean),
    glossary: arr(r.glossary).map((g0) => {
      const g = rec(g0);
      return { term: s(g.term), meaning_simple: s(g.meaning_simple) };
    }).filter((g) => g.term),
  };
  const days = arr(r.checklist_7_days).map((c0) => {
    const c = rec(c0);
    return { day: Number(c.day), tasks: arr(c.tasks).map(s).filter(Boolean) };
  });
  for (let day = 1; day <= 7; day++) {
    plan.checklist_7_days.push({ day, tasks: days.find((x) => x.day === day)?.tasks ?? [] });
  }
  return plan;
}

// Patient-facing strings, in a fixed order, so translation never touches keys, numbers or dates.
type Slot = { get: () => string; set: (v: string) => void };

export function translatableSlots(plan: DischargePlan): Slot[] {
  const slots: Slot[] = [];
  const add = <T extends object>(o: T, k: keyof T) => {
    if (typeof o[k] === "string" && (o[k] as string).trim()) {
      slots.push({ get: () => o[k] as string, set: (v) => { (o[k] as unknown) = v; } });
    }
  };
  const addArr = (a: string[]) => a.forEach((_, i) => slots.push({ get: () => a[i], set: (v) => { a[i] = v; } }));
  add(plan, "diagnosis_simple");
  add(plan, "what_happened");
  plan.medicines.forEach((m) => { add(m, "purpose_simple"); add(m, "dose"); add(m, "special_instructions"); });
  plan.follow_ups.forEach((f) => { add(f, "what"); add(f, "relative_text"); add(f, "where"); });
  plan.tests_pending.forEach((t) => { add(t, "name"); add(t, "when"); });
  addArr(plan.diet);
  addArr(plan.activity);
  plan.warning_signs.forEach((w) => { add(w, "sign_simple"); add(w, "action"); });
  plan.checklist_7_days.forEach((d) => addArr(d.tasks));
  addArr(plan.unclear_items);
  plan.glossary.forEach((g) => add(g, "meaning_simple"));
  return slots;
}
