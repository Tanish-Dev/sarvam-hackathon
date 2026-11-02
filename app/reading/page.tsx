"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { usePlan } from "@/components/PlanProvider";
import { Label, Shell } from "@/components/ui";
import type { DischargePlan } from "@/lib/schema";
import { SAMPLE_PLANS } from "@/lib/sample";

type Step = 0 | 1 | 2 | 3;

async function json<T>(r: Response): Promise<T> {
  const d = (await r.json().catch(() => ({ error: "Something went wrong. Please try again." }))) as T & { error?: string };
  if (!r.ok || d.error) throw new Error(d.error ?? "Something went wrong. Please try again.");
  return d;
}

export default function Reading() {
  const { t, files, setPlan, lang, ensureTranslated } = usePlan();
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);

  useEffect(() => {
    if (started.current === attempt) return;
    started.current = attempt;
    if (!files.length) { router.replace("/scan"); return; }
    let cancelled = false;
    (async () => {
      try {
        setError(""); setStep(0); setText("");
        const fd = new FormData();
        files.forEach((f) => fd.append("file", f));
        const { jobId } = await json<{ jobId: string }>(await fetch("/api/scan", { method: "POST", body: fd }));
        let markdown = "";
        for (let i = 0; i < 60 && !cancelled; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const s = await json<{ status: string; markdown?: string }>(await fetch(`/api/scan/${jobId}`));
          if (s.status === "completed") { markdown = s.markdown ?? ""; break; }
        }
        if (cancelled) return;
        if (!markdown.trim()) throw new Error(t.failedTitle);
        setText(markdown);
        setStep(1);
        const { plan } = await json<{ plan: DischargePlan }>(await fetch("/api/decode", {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: markdown }),
        }));
        if (cancelled) return;
        setStep(2);
        setPlan(plan, false);
        await ensureTranslated(lang);
        setStep(3);
        setTimeout(() => router.replace("/plan"), 500);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [attempt, files, lang, router, setPlan, ensureTranslated, t.failedTitle]);

  const steps = [t.stepRead, t.stepUnderstand, t.stepVoice];
  const models = ["Sarvam Vision", "Sarvam-105B", "Bulbul"];

  return (
    <Shell className="hero-gradient overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-20 top-10 size-96 rounded-full bg-teal/50 blur-3xl drift" />
        <div className="absolute -right-24 top-1/3 size-80 rounded-full bg-rose/40 blur-3xl drift [animation-delay:-6s]" />
        {text && <pre className="absolute inset-x-6 top-24 whitespace-pre-wrap font-mono text-[0.6rem] leading-relaxed text-white/[0.13]">{text.slice(0, 1800)}</pre>}
      </div>
      <div className="relative flex min-h-(--app-h) flex-col justify-center px-6">
        {!error ? (
          <>
            <h1 className="text-center text-[1.5rem] font-light tracking-tight">{t.readingTitle}</h1>
            <ol className="mx-auto mt-10 w-full max-w-sm space-y-4" aria-live="polite">
              {steps.map((s, i) => {
                const done = step > i;
                const active = step === i;
                return (
                  <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: done || active ? 1 : 0.45, x: 0 }} transition={{ delay: i * 0.15 }}
                    className="flex items-center gap-4 rounded-[22px] bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full ${done ? "bg-sage" : "bg-white/15"}`}>
                      {done ? <Check className="size-5" /> : active ? <Loader2 className="size-5 animate-spin" /> : <span className="font-mono text-sm">{i + 1}</span>}
                    </span>
                    <div>
                      <div className="text-[1rem]">{s}</div>
                      <Label className="mt-0.5 text-white/55">{models[i]}</Label>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
            <p className="mt-8 text-center text-[0.85rem] text-white/70">{t.readingNote}</p>
          </>
        ) : (
          <div role="alert" className="mx-auto max-w-sm rounded-[28px] bg-white p-6 text-center text-ink">
            <h1 className="text-[1.3rem] font-medium">{t.failedTitle}</h1>
            <p className="mt-2 text-[0.95rem] text-ink/70">{error}</p>
            <button onClick={() => setAttempt((a) => a + 1)} className="mt-6 h-14 w-full rounded-full bg-night text-white">{t.retry}</button>
            <button onClick={() => { setPlan(SAMPLE_PLANS["en-IN"]!, true); router.replace("/plan"); }} className="mt-2 h-14 w-full rounded-full ring-1 ring-ink/15">{t.useSample}</button>
            <button onClick={() => router.replace("/scan")} className="mt-2 h-12 w-full text-[0.9rem] text-ink/60">{t.back}</button>
          </div>
        )}
      </div>
    </Shell>
  );
}
