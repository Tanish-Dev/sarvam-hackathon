"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@/lib/auth";
import { stopAudio } from "@/lib/audio";
import { BUILTIN, en, mergeTranslated, type Dict } from "@/lib/i18n";
import { htmlLang, isLang, type LangCode } from "@/lib/langs";
import { translatableSlots, type DischargePlan } from "@/lib/schema";
import { SAMPLE_PLANS } from "@/lib/sample";
import { clearAll, load, remove, save } from "@/lib/storage";

type Ticks = Record<string, boolean>;

export interface SavedPlan {
  id: string;
  base: DischargePlan;
  translations: Partial<Record<LangCode, DischargePlan>>;
  isSample: boolean;
  createdAt: number;
  ticks: Ticks;
}

interface Ctx {
  /** Preferences and the signed-in user's papers have loaded. */
  ready: boolean;
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: Dict;
  user: User | null;
  setUser: (u: User | null) => void;
  signOut: () => Promise<void>;
  /** Newest first. */
  plans: SavedPlan[];
  /** The paper the app is showing: the one picked last, else the newest. */
  active: SavedPlan | null;
  setActive: (id: string) => void;
  addPlan: (p: DischargePlan, sample: boolean) => string;
  /** Shows the existing sample paper, or adds one. */
  openSample: () => string;
  removePlan: (id: string) => void;
  /** The plan in the current language, falling back to the original. */
  view: (p: SavedPlan) => DischargePlan;
  isTranslating: (id: string) => boolean;
  ensureTranslated: (id: string, l: LangCode, base?: DischargePlan) => Promise<void>;
  setTicks: (id: string, keys: string[], v: boolean) => void;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  muted: boolean;
  setMuted: (v: boolean) => void;
  /** Pages picked on the scan screen, waiting to be read. */
  files: File[];
  setFiles: (f: File[]) => void;
  /** Deletes everything on this device and signs out. */
  clear: () => Promise<void>;
}

const PlanCtx = createContext<Ctx | null>(null);

export function usePlan() {
  const c = useContext(PlanCtx);
  if (!c) throw new Error("usePlan outside provider");
  return c;
}

async function translateStrings(strings: string[], lang: LangCode) {
  const r = await fetch("/api/translate", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ strings, lang }),
  });
  if (!r.ok) throw new Error("translate");
  return ((await r.json()) as { strings: string[] }).strings;
}

const newId = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const plansKey = (phone: string) => `plans:${phone}`;
const activeKey = (phone: string) => `active:${phone}`;

/** Papers saved before sign-in existed belong to whoever signs in first on this device. */
function loadPlans(phone: string): SavedPlan[] {
  const own = load<SavedPlan[] | null>(plansKey(phone), null);
  if (own) return own;
  let adopted = load<SavedPlan[]>("savedPlans", []);
  const legacy = load<DischargePlan | null>("plan", null);
  if (!adopted.length && legacy) {
    adopted = [{
      id: newId(), base: legacy, translations: load("plans", {}), isSample: load("sample", false),
      createdAt: load("createdAt", Date.now()), ticks: load("ticks", {}),
    }];
  }
  ["savedPlans", "onboarded", "plan", "plans", "sample", "createdAt", "ticks"].forEach(remove);
  save(plansKey(phone), adopted);
  return adopted;
}

export function PlanProvider({ initialUser, children }: { initialUser: User | null; children: React.ReactNode }) {
  const [prefsReady, setPrefsReady] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [lang, setLangState] = useState<LangCode>("en-IN");
  const [dicts, setDicts] = useState<Partial<Record<LangCode, Dict>>>({});
  const [user, setUser] = useState<User | null>(initialUser);
  const [plans, setPlansState] = useState<SavedPlan[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [largeText, setLargeTextState] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const plansRef = useRef<SavedPlan[]>([]);
  const phoneRef = useRef<string | null>(initialUser?.phone ?? null);
  const inflight = useRef(new Set<string>());

  // Every plan change goes through here so the ref is current before React re-renders.
  const commit = useCallback((next: SavedPlan[]) => {
    plansRef.current = next;
    setPlansState(next);
    if (phoneRef.current) save(plansKey(phoneRef.current), next);
  }, []);
  const update = useCallback((id: string, fn: (p: SavedPlan) => SavedPlan) => {
    commit(plansRef.current.map((p) => (p.id === id ? fn(p) : p)));
  }, [commit]);

  useEffect(() => {
    const l = load<string>("lang", "en-IN");
    setLangState(isLang(l) ? l : "en-IN");
    setLargeTextState(load("large", false));
    setMutedState(load("muted", false));
    setDicts(load("dicts", {}));
    setPrefsReady(true);
  }, []);

  // Each person signed in on this device has their own papers.
  const phone = user?.phone ?? null;
  useEffect(() => {
    phoneRef.current = phone;
    const saved = phone ? loadPlans(phone) : [];
    plansRef.current = saved;
    setPlansState(saved);
    setActiveId(phone ? load<string | null>(activeKey(phone), null) : null);
    setLoadedFor(phone ?? "");
  }, [phone]);

  useEffect(() => {
    document.documentElement.lang = htmlLang(lang);
    document.documentElement.dataset.large = largeText ? "1" : "0";
  }, [lang, largeText]);

  const ensureDict = useCallback(async (l: LangCode) => {
    if (BUILTIN[l] || dicts[l] || inflight.current.has(`d${l}`)) return;
    inflight.current.add(`d${l}`);
    try {
      const d = mergeTranslated(await translateStrings(Object.values(en), l));
      setDicts((prev) => { const n = { ...prev, [l]: d }; save("dicts", n); return n; });
    } catch { /* stay in English UI */ } finally { inflight.current.delete(`d${l}`); }
  }, [dicts]);

  useEffect(() => { if (prefsReady) void ensureDict(lang); }, [prefsReady, lang, ensureDict]);

  const ensureTranslated = useCallback(async (id: string, l: LangCode, base?: DischargePlan) => {
    const p = plansRef.current.find((x) => x.id === id);
    const b = base ?? p?.base;
    const key = `${id}:${l}`;
    if (!b || l === "en-IN" || p?.translations[l] || inflight.current.has(key)) return;
    if (p?.isSample && SAMPLE_PLANS[l]) {
      update(id, (x) => ({ ...x, translations: { ...x.translations, [l]: SAMPLE_PLANS[l]! } }));
      return;
    }
    inflight.current.add(key);
    setBusy((prev) => ({ ...prev, [key]: true }));
    try {
      const copy: DischargePlan = structuredClone(b);
      const slots = translatableSlots(copy);
      const out = await translateStrings(slots.map((s) => s.get()), l);
      slots.forEach((s, i) => s.set(out[i] ?? s.get()));
      update(id, (x) => ({ ...x, translations: { ...x.translations, [l]: copy } }));
    } catch { /* show the original plan */ } finally {
      inflight.current.delete(key);
      setBusy((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  }, [update]);

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    save("lang", l);
    void ensureDict(l);
  }, [ensureDict]);

  const setActive = useCallback((id: string) => {
    setActiveId(id);
    if (phoneRef.current) save(activeKey(phoneRef.current), id);
  }, []);

  const addPlan = useCallback((p: DischargePlan, sample: boolean) => {
    const id = newId();
    const translations = sample ? { ...SAMPLE_PLANS } : {};
    commit([{ id, base: p, translations, isSample: sample, createdAt: Date.now(), ticks: {} }, ...plansRef.current]);
    setActive(id);
    return id;
  }, [commit, setActive]);

  const openSample = useCallback(() => {
    const existing = plansRef.current.find((p) => p.isSample)?.id;
    if (!existing) return addPlan(SAMPLE_PLANS["en-IN"]!, true);
    setActive(existing);
    return existing;
  }, [addPlan, setActive]);

  const removePlan = useCallback((id: string) => commit(plansRef.current.filter((p) => p.id !== id)), [commit]);

  const setTicks = useCallback((id: string, keys: string[], v: boolean) => {
    update(id, (p) => { const ticks = { ...p.ticks }; keys.forEach((k) => { ticks[k] = v; }); return { ...p, ticks }; });
  }, [update]);

  const signOut = useCallback(async () => {
    stopAudio();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setFiles([]);
    setUser(null);
  }, []);

  const active = plans.find((p) => p.id === activeId) ?? plans[0] ?? null;

  const value = useMemo<Ctx>(() => ({
    ready: prefsReady && loadedFor === (phone ?? ""),
    lang, setLang,
    // Cached machine translations may predate newer keys; English fills the gaps.
    t: BUILTIN[lang] ?? (dicts[lang] ? { ...en, ...dicts[lang] } : en),
    user, setUser, signOut,
    plans, active, setActive, addPlan, openSample, removePlan,
    view: (p) => (lang === "en-IN" ? p.base : p.translations[lang] ?? p.base),
    isTranslating: (id) => !!busy[`${id}:${lang}`],
    ensureTranslated, setTicks,
    largeText, setLargeText: (v) => { setLargeTextState(v); save("large", v); },
    muted, setMuted: (v) => { setMutedState(v); save("muted", v); },
    files, setFiles,
    clear: async () => { clearAll(); commit([]); await signOut(); },
  }), [prefsReady, loadedFor, phone, lang, setLang, dicts, user, signOut, plans, active, setActive, addPlan, openSample, removePlan, busy, ensureTranslated, setTicks, largeText, muted, files, commit]);

  return <PlanCtx.Provider value={value}>{children}</PlanCtx.Provider>;
}
