"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, LockFill } from "@/components/icons";
import { usePlan } from "@/components/PlanProvider";
import { darkBtn, Shell, Spinner, useGoBack } from "@/components/ui";
import { fill } from "@/lib/i18n";
import { load, save } from "@/lib/storage";
import type { User } from "@/lib/auth";

type Step = "phone" | "code" | "name";

async function post<T>(url: string, body: unknown): Promise<{ ok: boolean; data: T & { error?: string } }> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, data: await r.json().catch(() => ({}) as T) };
}

const field = "h-14 w-full rounded-2xl bg-white/80 px-4 text-[1.1rem] ring-1 ring-ink/10 outline-none transition focus:ring-2 focus:ring-night/60";

/** Sign-in: mobile number → 6-digit code → name (first time only). */
export default function Login() {
  const { t, user, setUser } = usePlan();
  const router = useRouter();
  const leave = useGoBack("/");
  const [step, setStep] = useState<Step>(user && !user.name ? "name" : "phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { input.current?.focus(); }, [step]);
  useEffect(() => { if (user?.name) router.replace("/home"); }, [user, router]);

  async function run(fn: () => Promise<void>) {
    setBusy(true); setErr("");
    try { await fn(); } catch { setErr(t.networkError); } finally { setBusy(false); }
  }

  const sendCode = () => run(async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) { setErr(t.phoneInvalid); return; }
    const { ok, data } = await post<{ demoCode: string }>("/api/auth/request", { phone });
    if (!ok) { setErr(t.phoneInvalid); return; }
    setDemoCode(data.demoCode); setCode(""); setStep("code");
  });

  const verify = () => run(async () => {
    const { ok, data } = await post<{ user: User }>("/api/auth/verify", { code });
    if (!ok) { setErr(data.error === "expired" ? t.codeExpired : t.codeWrong); return; }
    // A name used on this phone before is filled in again, so returning users skip that step.
    const known = data.user.name || load<string>(`name:${data.user.phone}`, "");
    if (!known) { setUser(data.user); setStep("name"); return; }
    if (!data.user.name) await saveName(known);
    else setUser(data.user);
  });

  async function saveName(n: string) {
    const { ok, data } = await post<{ user: User }>("/api/auth/profile", { name: n });
    if (!ok) { setErr(t.networkError); return; }
    save(`name:${data.user.phone}`, data.user.name);
    setUser(data.user);
  }

  const back = step === "code" ? () => { setStep("phone"); setErr(""); } : step === "phone" ? leave : null;
  const titles = { phone: t.phoneTitle, code: t.codeTitle, name: t.nameTitle };
  const hints = { phone: t.phoneHint, code: fill(t.codeSent, { phone }), name: t.nameHint };
  const submit = { phone: sendCode, code: verify, name: () => run(() => saveName(name.trim())) }[step];
  const canSubmit = { phone: phone.length === 10, code: code.length === 6, name: !!name.trim() }[step];

  return (
    <Shell className="bg-paper">
      <form className="flex min-h-(--app-h) flex-col px-5 pt-[max(var(--safe-top),10px)] pb-[max(var(--safe-bottom),20px)]"
        onSubmit={(e) => { e.preventDefault(); if (canSubmit && !busy) void submit(); }}>
        <header className="flex h-11 items-center">
          {back && (
            <button type="button" onClick={back} aria-label={t.back} className="-ml-2 grid size-11 place-items-center rounded-full hover:bg-ink/5">
              <ChevronLeft className="size-5" />
            </button>
          )}
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="flex-1 pt-4">
            <h1 className="text-[1.6rem] font-light leading-tight tracking-tight">{titles[step]}</h1>
            <p className="mt-2 text-[0.9rem] text-ink/60">{hints[step]}</p>

            <div className="mt-7">
              {step === "phone" && (
                <label className="flex items-center gap-2">
                  <span className="grid h-14 shrink-0 place-items-center rounded-2xl bg-white/80 px-4 text-[1.1rem] text-ink/60 ring-1 ring-ink/10">+91</span>
                  <span className="sr-only">{t.phoneLabel}</span>
                  <input ref={input} className={`${field} tracking-wider`} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210"
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(-10))} />
                </label>
              )}
              {step === "code" && (
                <>
                  <label className="block">
                    <span className="sr-only">{t.codeTitle}</span>
                    <input ref={input} className={`${field} text-center font-mono text-[1.5rem] tracking-[0.5em]`} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                      placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                  </label>
                  {demoCode && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/60 p-3 pl-4 text-[0.85rem] ring-1 ring-white/80">
                      <span className="text-ink/70">{fill(t.demoCode, { code: demoCode })}</span>
                      <button type="button" onClick={() => setCode(demoCode)} className="h-9 shrink-0 rounded-full bg-night px-4 text-[0.8rem] text-white">{t.useCode}</button>
                    </div>
                  )}
                  <div className="mt-4 flex justify-between text-[0.85rem]">
                    <button type="button" onClick={() => { setStep("phone"); setErr(""); }} className="h-10 text-ink/60 underline underline-offset-4">{t.changeNumber}</button>
                    <button type="button" onClick={() => void sendCode()} className="h-10 text-ink/60 underline underline-offset-4">{t.resend}</button>
                  </div>
                </>
              )}
              {step === "name" && (
                <label className="block">
                  <span className="sr-only">{t.nameLabel}</span>
                  <input ref={input} className={field} autoComplete="name" placeholder={t.nameLabel} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
                </label>
              )}
              {err && <p role="alert" className="mt-3 text-[0.9rem] text-alert">{err}</p>}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 space-y-3">
          <button type="submit" disabled={!canSubmit || busy} className={darkBtn}>
            {busy ? <Spinner className="size-5" /> : { phone: t.sendCode, code: t.verify, name: t.continue }[step]}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-center text-[0.7rem] text-ink/50">
            <LockFill className="size-3" aria-hidden /> {t.nothingStored}
          </p>
        </div>
      </form>
    </Shell>
  );
}
