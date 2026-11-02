"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Phone, Send, Square } from "lucide-react";
import { useRequirePlan } from "@/components/useRequirePlan";
import { Label, ListenButton, Shell, TopBar, Waveform } from "@/components/ui";
import { speak, stopAudio, unlockAudio } from "@/lib/audio";
import { sampleAnswer } from "@/lib/sample";

const MAX_SEC = 30;

export default function Ask() {
  const { plan, base, t, lang, isSample, muted } = useRequirePlan();
  const [phase, setPhase] = useState<"idle" | "rec" | "think">("idle");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [err, setErr] = useState("");
  const [typed, setTyped] = useState("");
  const [left, setLeft] = useState(MAX_SEC);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { rec.current?.stream.getTracks().forEach((tr) => tr.stop()); if (timer.current) clearInterval(timer.current); stopAudio(); }, []);

  async function ask(payload: { text?: string; audio?: Blob }) {
    if (!plan) return;
    setPhase("think"); setErr(""); setAnswer(""); setEmergency(false);
    if (payload.text) setQuestion(payload.text);
    const fd = new FormData();
    fd.append("lang", lang);
    fd.append("plan", JSON.stringify(plan));
    if (payload.text) fd.append("text", payload.text);
    if (payload.audio) fd.append("audio", payload.audio, payload.audio.type.includes("mp4") ? "q.mp4" : "q.webm");
    let res: { question?: string; answer?: string; emergency?: boolean; error?: string } = {};
    try {
      const r = await fetch("/api/ask", { method: "POST", body: fd });
      res = await r.json();
      if (!r.ok || res.error) throw new Error(res.error);
    } catch (e) {
      const offline = isSample && payload.text ? sampleAnswer(payload.text, lang) : null;
      if (!offline) { setErr(e instanceof Error && e.message ? e.message : t.retry); setPhase("idle"); return; }
      res = { question: payload.text, ...offline };
    }
    const a = res.emergency && !String(res.answer).includes("108") ? `${t.emergency} ${res.answer}` : String(res.answer);
    setQuestion(res.question ?? question);
    setAnswer(a);
    setEmergency(!!res.emergency);
    setPhase("idle");
    if (!muted) void speak("answer", a, lang);
  }

  async function start() {
    unlockAudio(); stopAudio(); setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        if (timer.current) clearInterval(timer.current);
        const blob = new Blob(chunks, { type: r.mimeType || "audio/webm" });
        if (blob.size > 1000) void ask({ audio: blob }); else setPhase("idle");
      };
      rec.current = r;
      r.start();
      setPhase("rec"); setLeft(MAX_SEC); setQuestion(""); setAnswer("");
      timer.current = setInterval(() => setLeft((s) => { if (s <= 1) { if (r.state === "recording") r.stop(); return 0; } return s - 1; }), 1000);
    } catch {
      setErr(t.micDenied);
    }
  }

  const stop = () => { if (rec.current?.state === "recording") rec.current.stop(); };
  const doctor = base ? [base.patient.doctor, base.patient.hospital].filter(Boolean).join(" · ") : "";
  const suggestions = [t.sugg1, t.sugg2, t.sugg3];

  return (
    <Shell className="hero-gradient overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className={`absolute left-1/2 top-1/3 size-[460px] -translate-x-1/2 rounded-full blur-3xl drift ${emergency ? "bg-alert/40" : "bg-teal/40"}`} />
      </div>
      <TopBar back="/plan" />
      <div className="relative flex min-h-[calc(100dvh-64px)] flex-col px-6 pb-[max(env(safe-area-inset-bottom),18px)]">
        {emergency && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} role="alert" className="mt-2 rounded-[22px] bg-alert p-4 text-white shadow-xl">
            <p className="font-semibold leading-snug">{t.emergency}</p>
            <a href="tel:108" className="mt-3 flex h-14 items-center justify-center gap-2 rounded-full bg-white text-[1.05rem] font-bold text-alert"><Phone className="size-5" /> {t.call108}</a>
          </motion.div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center" aria-live="polite">
          {question && (
            <div className="mb-5 max-w-sm">
              <Label className="text-white/50">{t.youAsked}</Label>
              <p className="mt-1 text-[0.95rem] text-white/80">“{question}”</p>
            </div>
          )}
          {phase === "think" ? (
            <p className="flex items-center gap-2 text-[1.1rem] text-white/80"><Loader2 className="size-5 animate-spin" /> {t.thinking}</p>
          ) : answer ? (
            <>
              <motion.p key={answer} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm text-balance text-[1.3rem] font-light leading-snug">{answer}</motion.p>
              <div className="mt-5"><ListenButton id="answer" text={answer} dark /></div>
              {doctor && <Label className="mt-4 text-white/45">{doctor}</Label>}
            </>
          ) : phase === "rec" ? (
            <p className="text-[1.4rem] font-light">{t.listening}</p>
          ) : (
            <>
              <h1 className="text-[1.5rem] font-light tracking-tight">{t.askTitle}</h1>
              <p className="mt-2 text-white/65">{t.askHint}</p>
            </>
          )}
          {err && <p role="alert" className="mt-4 max-w-sm rounded-2xl bg-black/30 p-3 text-[0.9rem]">{err}</p>}
        </div>

        {phase !== "rec" && (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <button key={s} disabled={phase === "think"} onClick={() => { unlockAudio(); void ask({ text: s }); }}
                className="min-h-11 rounded-full bg-white/10 px-4 py-2 text-[0.85rem] ring-1 ring-white/15 disabled:opacity-40">{s}</button>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center">
          <div className="relative grid size-24 place-items-center">
            {phase === "rec" && <span className="breathe absolute inset-0 rounded-full bg-white" />}
            {phase === "rec" && (
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeDasharray={295} strokeDashoffset={295 * (1 - left / MAX_SEC)} strokeLinecap="round" />
              </svg>
            )}
            <button onClick={phase === "rec" ? stop : start} disabled={phase === "think"} aria-label={phase === "rec" ? t.stopRecording : t.askAnything}
              className="relative grid size-20 place-items-center rounded-full bg-white text-ink shadow-[0_16px_50px_-10px_rgba(0,0,0,0.6)] transition active:scale-95 disabled:opacity-50">
              {phase === "rec" ? <Square className="size-6 fill-current" /> : <Waveform className="size-8" />}
            </button>
          </div>
          {phase === "rec" && <Label className="mt-2 text-white/70">{left}s · {t.stopRecording}</Label>}
        </div>

        <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (typed.trim()) { unlockAudio(); void ask({ text: typed.trim() }); setTyped(""); } }}>
          <label className="sr-only" htmlFor="q">{t.typeQuestion}</label>
          <input id="q" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={t.typeQuestion} autoComplete="off"
            className="h-14 min-w-0 flex-1 rounded-full bg-white/95 px-5 text-ink placeholder:text-ink/45 outline-none" />
          <button type="submit" aria-label={t.send} disabled={!typed.trim() || phase === "think"} className="grid size-14 place-items-center rounded-full bg-white text-ink disabled:opacity-40"><Send className="size-5" /></button>
        </form>
      </div>
    </Shell>
  );
}
