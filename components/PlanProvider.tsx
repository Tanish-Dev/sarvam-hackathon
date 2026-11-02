"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BUILTIN, en, mergeTranslated, type Dict } from "@/lib/i18n";
import { htmlLang, isLang, type LangCode } from "@/lib/langs";
import { translatableSlots, type DischargePlan } from "@/lib/schema";
import { SAMPLE_PLANS } from "@/lib/sample";
import { clearAll, load, save } from "@/lib/storage";

type Ticks = Record<string, boolean>;

interface Ctx {
  ready: boolean;
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: Dict;
  base: DischargePlan | null;
  plan: DischargePlan | null;
  translating: boolean;
  isSample: boolean;
  createdAt: number;
  setPlan: (p: DischargePlan, sample: boolean) => void;
  ensureTranslated: (l: LangCode) => Promise<void>;
  ticks: Ticks;
  setTick: (key: string, v: boolean) => void;
  setTicks: (keys: string[], v: boolean) => void;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  muted: boolean;
  setMuted: (v: boolean) => void;
  files: File[];
  setFiles: (f: File[]) => void;
  clear: () => void;
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

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [lang, setLangState] = useState<LangCode>("hi-IN");
  const [dicts, setDicts] = useState<Partial<Record<LangCode, Dict>>>({});
  const [base, setBase] = useState<DischargePlan | null>(null);
  const [plans, setPlans] = useState<Partial<Record<LangCode, DischargePlan>>>({});
  const [isSample, setIsSample] = useState(false);
  const [createdAt, setCreatedAt] = useState(0);
  const [ticks, setTicksState] = useState<Ticks>({});
  const [largeText, setLargeTextState] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [translating, setTranslating] = useState(false);
  const inflight = useRef(new Set<string>());

  useEffect(() => {
    const l = load<string>("lang", "hi-IN");
    setLangState(isLang(l) ? l : "hi-IN");
    setBase(load<DischargePlan | null>("plan", null));
    setPlans(load("plans", {}));
    setIsSample(load("sample", false));
    setCreatedAt(load("createdAt", Date.now()));
    setTicksState(load("ticks", {}));
    setLargeTextState(load("large", false));
    setMutedState(load("muted", false));
    setDicts(load("dicts", {}));
    setReady(true);
  }, []);

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

  const ensureTranslated = useCallback(async (l: LangCode, b: DischargePlan | null = base, sample = isSample) => {
    if (!b || l === "en-IN" || plans[l] || inflight.current.has(`p${l}`)) return;
    if (sample && SAMPLE_PLANS[l]) {
      setPlans((prev) => { const n = { ...prev, [l]: SAMPLE_PLANS[l]! }; save("plans", n); return n; });
      return;
    }
    inflight.current.add(`p${l}`);
    setTranslating(true);
    try {
      const copy: DischargePlan = structuredClone(b);
      const slots = translatableSlots(copy);
      const out = await translateStrings(slots.map((s) => s.get()), l);
      slots.forEach((s, i) => s.set(out[i] ?? s.get()));
      setPlans((prev) => { const n = { ...prev, [l]: copy }; save("plans", n); return n; });
    } catch { /* show English plan */ } finally {
      inflight.current.delete(`p${l}`);
      setTranslating(false);
    }
  }, [base, isSample, plans]);

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    save("lang", l);
    void ensureDict(l);
    void ensureTranslated(l);
  }, [ensureDict, ensureTranslated]);

  useEffect(() => { if (ready) void ensureDict(lang); }, [ready, lang, ensureDict]);

  const setPlan = useCallback((p: DischargePlan, sample: boolean) => {
    const now = Date.now();
    const initial: Partial<Record<LangCode, DischargePlan>> = sample ? { ...SAMPLE_PLANS } : {};
    setBase(p); setIsSample(sample); setCreatedAt(now); setTicksState({}); setPlans(initial);
    save("plan", p); save("sample", sample); save("createdAt", now); save("ticks", {}); save("plans", initial);
  }, []);

  const setTick = useCallback((key: string, v: boolean) => {
    setTicksState((prev) => { const n = { ...prev, [key]: v }; save("ticks", n); return n; });
  }, []);
  const setTicks = useCallback((keys: string[], v: boolean) => {
    setTicksState((prev) => { const n = { ...prev }; keys.forEach((k) => { n[k] = v; }); save("ticks", n); return n; });
  }, []);

  const value = useMemo<Ctx>(() => ({
    ready, lang, setLang,
    t: BUILTIN[lang] ?? dicts[lang] ?? en,
    base,
    plan: base ? (lang === "en-IN" ? base : plans[lang] ?? base) : null,
    translating, isSample, createdAt,
    setPlan, ensureTranslated: (l) => ensureTranslated(l),
    ticks, setTick, setTicks,
    largeText, setLargeText: (v) => { setLargeTextState(v); save("large", v); },
    muted, setMuted: (v) => { setMutedState(v); save("muted", v); },
    files, setFiles,
    clear: () => { clearAll(); setBase(null); setPlans({}); setTicksState({}); setFiles([]); },
  }), [ready, lang, setLang, dicts, base, plans, translating, isSample, createdAt, setPlan, ensureTranslated, ticks, setTick, setTicks, largeText, muted, files]);

  return <PlanCtx.Provider value={value}>{children}</PlanCtx.Provider>;
}
