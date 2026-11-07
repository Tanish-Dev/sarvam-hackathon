"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Book, CalendarBadgePlus, Camera, CameraFill, ChatBubbleTextFill, Checkmark, ChevronDown, ChevronRight, ExclamationmarkBubble, LightbulbFill,
  PaperplaneFill, PhoneFill, Plus, Printer, ShieldLefthalfFill, Speaker2Fill, StaroflifeFill,
} from "@/components/icons";
import { usePlan } from "@/components/PlanProvider";
import { Sheet } from "@/components/Sheet";
import { useActivePlan } from "@/components/useActivePlan";
import { Card, darkBtn, Disclaimer, Label, ListenButton, Shell, TickBox, TopBar } from "@/components/ui";
import { speak, unlockAudio } from "@/lib/audio";
import { load, save } from "@/lib/storage";
import { fill } from "@/lib/i18n";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { daysUntil, greetingText, medScript, nextFollowUp, recoveryDay, SLOTS, shareText, timesText, validIso } from "@/lib/planUtils";

const firstWord = (s: string) => s.trim().split(/\s+/)[0] ?? "";

/** First run: what Samjho does, and the one thing to do next. */
function FirstPaper() {
  const { t, user, openSample } = usePlan();
  const steps = [
    { icon: Camera, title: t.step1Title, body: t.step1Body },
    { icon: Speaker2Fill, title: t.step2Title, body: t.step2Body },
    { icon: ChatBubbleTextFill, title: t.step3Title, body: t.step3Body },
  ];
  return (
    <Shell className="bg-paper">
      <div className="hero-gradient relative overflow-hidden rounded-b-[36px] text-white">
        <div className="pointer-events-none absolute -top-10 left-1/2 size-[380px] -translate-x-1/2 rounded-full bg-teal/40 blur-3xl drift" aria-hidden />
        <TopBar />
        <div className="relative px-6 pt-6 pb-12">
          <p className="text-[0.95rem] text-white/75">{fill(t.helloName, { name: firstWord(user?.name ?? "") })}</p>
          <h1 className="mt-1 text-balance text-[1.9rem] font-extralight leading-tight tracking-tight">{t.homeEmptyTitle}</h1>
        </div>
      </div>
      <div className="space-y-2.5 px-4 pt-5 pb-36">
        <ol className="space-y-2.5">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <motion.li key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-start gap-4 rounded-[22px] bg-white/65 p-4 ring-1 ring-white/80 backdrop-blur-xl shadow-[0_10px_30px_-14px_rgba(11,15,20,0.18)]">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-night text-white"><Icon className="size-[18px]" aria-hidden /></span>
              <div>
                <div className="text-[0.95rem]">{title}</div>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-ink/60">{body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
        <div className="space-y-2 pt-3">
          <Link href="/scan" className={darkBtn}><CameraFill className="size-5" aria-hidden /> {t.scanPaper}</Link>
          <button onClick={openSample} className="h-12 w-full rounded-full text-[0.88rem] text-ink/70 ring-1 ring-ink/10">{t.trySample}</button>
          <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[0.7rem] text-ink/50">
            <ShieldLefthalfFill className="size-3.5" aria-hidden /> {t.nothingStored}
          </p>
        </div>
      </div>
    </Shell>
  );
}

/** Lists the user's papers; picking one makes it the paper the whole app shows. */
function PaperSwitcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, plans, active, setActive, view } = usePlan();
  return (
    <Sheet open={open} onClose={onClose} title={t.papers}>
      <ul className="space-y-2">
        {plans.map((saved) => {
          const p = view(saved);
          const on = saved.id === active?.id;
          return (
            <li key={saved.id}>
              <button onClick={() => { setActive(saved.id); onClose(); }} aria-pressed={on}
                className={`flex w-full items-center gap-3 rounded-[20px] p-3.5 text-left transition ${on ? "bg-night text-white" : "bg-white/70 ring-1 ring-ink/5"}`}>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.95rem]">{p.patient.name || p.diagnosis_simple}</div>
                  <div className={`truncate text-[0.78rem] ${on ? "text-white/60" : "text-ink/55"}`}>{p.diagnosis_simple}</div>
                </div>
                {saved.isSample && <Label className={on ? "text-white/60" : "text-ink/45"}>{t.sampleBadge}</Label>}
                {on && <Checkmark className="size-4 shrink-0" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
      <Link href="/scan" onClick={onClose} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[0.88rem] ring-1 ring-ink/10">
        <Plus className="size-4" aria-hidden /> {t.scanAgain}
      </Link>
    </Sheet>
  );
}

export default function Home() {
  const { ready, id, plan } = useActivePlan({ required: false });
  if (!ready) return <Shell className="bg-paper" />;
  if (!plan) return <FirstPaper />;
  return <Today key={id} />;
}

function Today() {
  const { plan, t, lang, muted, ticks, setTick, isSample, createdAt, translating } = useActivePlan({ required: false });
  const router = useRouter();
  const spoken = useRef("");
  const [needTap, setNeedTap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [papers, setPapers] = useState(false);
  const [tip, setTip] = useState(false);
  useEffect(() => { if (!load("tipSeen", false)) setTip(true); }, []);

  const greeting = plan ? greetingText(plan, t) : "";

  // Auto-play the greeting once per language, on the first tap if the browser blocks autoplay.
  useEffect(() => {
    if (!plan || muted || translating || spoken.current === lang + greeting) return;
    spoken.current = lang + greeting;
    const go = () => { setNeedTap(false); unlockAudio(); void speak("greeting", greeting, lang); };
    if (navigator.userActivation?.hasBeenActive) go();
    else {
      setNeedTap(true);
      window.addEventListener("pointerdown", go, { once: true });
      return () => window.removeEventListener("pointerdown", go);
    }
  }, [plan, muted, lang, greeting, translating]);

  if (!plan) return <Shell className="bg-paper" />;

  const day = recoveryDay(plan, createdAt);
  const follow = nextFollowUp(plan);
  const fDays = follow && validIso(follow.date_iso) ? daysUntil(follow.date_iso) : null;
  const confirm = [...plan.unclear_items, ...plan.medicines.filter((m) => m.confidence === "low").map((m) => `${m.name}: ${t.confirmChip}`)];
  const warnText = `${t.warningSigns}: ${plan.warning_signs.map((w) => `${w.sign_simple}. ${w.action}`).join(" ")}`;
  const allText = [greeting, plan.diagnosis_simple, plan.what_happened, ...plan.medicines.map((m) => medScript(m, t)),
    follow ? `${t.followUp}: ${follow.what} ${follow.relative_text}` : "", warnText].filter(Boolean).join(". ");

  async function share() {
    const text = shareText(plan!, t);
    try {
      if (navigator.share) await navigator.share({ title: t.shareTitle, text });
      else throw new Error("no share");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      await navigator.clipboard?.writeText(text).catch(() => {});
      setCopied(true); setTimeout(() => setCopied(false), 3000);
    }
  }

  return (
    <Shell className="bg-paper">
      <div className="no-print">
        <div className="hero-gradient relative overflow-hidden rounded-b-[36px] text-white">
          <div className="pointer-events-none absolute -top-10 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-teal/40 blur-3xl drift" aria-hidden />
          <TopBar left={
            <button onClick={() => setPapers(true)} aria-haspopup="dialog"
              className="-ml-1 flex h-10 min-w-0 items-center gap-1.5 rounded-full bg-white/10 pl-4 pr-3 text-[0.85rem] ring-1 ring-white/15">
              <span className="truncate">{plan.patient.name || t.papers}</span><ChevronDown className="size-3.5 shrink-0" aria-hidden />
            </button>
          } />
          <PaperSwitcher open={papers} onClose={() => setPapers(false)} />
          <div className="relative flex min-h-[calc(var(--app-h)*0.42)] pt-4 flex-col items-center justify-center px-7 pb-14 text-center">
            {isSample && <Label className="mb-4 rounded-full bg-white/10 px-3 py-1 text-white/70 ring-1 ring-white/15">{t.sampleBadge}</Label>}
            <motion.p key={greeting} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className="text-balance text-[1.6rem] font-light leading-snug tracking-tight">
              {greeting}
            </motion.p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <ListenButton id="greeting" text={greeting} dark />
              <ListenButton id="all" text={allText} label={t.listenAll} dark />
            </div>
            {needTap && !muted && <p className="mt-4 text-[0.8rem] text-white/60">{t.tapToHear}</p>}
          </div>
          
        </div>

        <div className="space-y-4 px-4 pt-5">
          {tip && (
            <div className="flex items-start gap-3 rounded-[24px] bg-white/60 p-4 ring-1 ring-white/80 backdrop-blur-xl">
              <LightbulbFill className="mt-0.5 size-4 shrink-0 text-[#B5651D]" aria-hidden />
              <div className="flex-1">
                <p className="text-[0.88rem]">{t.tipTitle}</p>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-ink/60">{t.tipBody}</p>
              </div>
              <button onClick={() => { setTip(false); save("tipSeen", true); }} className="h-9 shrink-0 rounded-full px-3 text-[0.75rem] text-ink/70 ring-1 ring-ink/10">{t.gotIt}</button>
            </div>
          )}
          {/* Today */}
          <Card>
            <div className="flex items-center justify-between">
              <Label className="text-ink/55">{t.today} · {fill(t.day, { n: day })}</Label>
              <button onClick={() => router.replace("/medicines")} className="flex h-10 items-center gap-1 text-[0.85rem] text-ink/60">{t.navMeds}<ChevronRight className="size-3.5" /></button>
            </div>
            <div className="mt-3 divide-y divide-ink/5">
              {SLOTS.map((slot) => {
                const meds = plan.medicines.map((m, i) => ({ m, i })).filter(({ m }) => m.schedule[slot]);
                if (!meds.length) return null;
                return (
                  <div key={slot} className="py-3">
                    <div className="text-[0.95rem] font-normal">{t[slot]}</div>
                    <ul className="mt-2 space-y-2">
                      {meds.map(({ m, i }) => {
                        const key = `d${day}:${slot}:${i}`;
                        return (
                          <li key={key} className="flex items-center gap-3">
                            <TickBox checked={!!ticks[key]} onChange={(v) => setTick(key, v)} label={`${m.name} ${t[slot]}`} />
                            <div className="min-w-0">
                              <div className={`font-mono text-[0.78rem] uppercase tracking-wide ${ticks[key] ? "text-ink/40 line-through" : ""}`}>{m.name}</div>
                              <div className="text-[0.82rem] text-ink/60">{m.purpose_simple}</div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Follow-up */}
          {follow && (
            <Card className="dusk-gradient !text-white">
              <Label className="text-white/75">{t.followUp}</Label>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div>
                  {fDays !== null && fDays >= 0 ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-[3rem] font-extralight leading-none">{fDays}</span>
                      <span className="text-[0.95rem] text-white/85">{fDays === 0 ? t.isToday : fill(t.inDays, { n: fDays }).replace(String(fDays), "").trim()}</span>
                    </div>
                  ) : <div className="text-[1.2rem]">{follow.relative_text}</div>}
                  <p className="mt-2 text-[0.95rem] leading-snug">{follow.what}</p>
                  <p className="mt-1 text-[0.8rem] text-white/75">{[follow.date_iso, follow.where].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <ListenButton id="follow" text={`${t.followUp}: ${follow.what}. ${follow.relative_text}. ${follow.where}`} dark />
                {validIso(follow.date_iso) && (
                  <button onClick={() => downloadIcs("samjho-checkup.ics", buildIcs({ title: follow.what || t.followUp, dateIso: follow.date_iso, location: follow.where, description: follow.source_text }))}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[0.85rem] font-normal text-ink">
                    <CalendarBadgePlus className="size-4" /> {t.addToCalendar}
                  </button>
                )}
              </div>
              {plan.follow_ups.length > 1 && (
                <ul className="mt-4 space-y-1 border-t border-white/20 pt-3 text-[0.85rem] text-white/85">
                  {plan.follow_ups.filter((f) => f !== follow).map((f, i) => <li key={i}>• {f.what} — {f.date_iso || f.relative_text}</li>)}
                </ul>
              )}
            </Card>
          )}

          {/* Warning signs */}
          {plan.warning_signs.length > 0 && (
            <Card className="ring-2 ring-alert/70">
              <div className="flex items-center gap-2 text-alert">
                <StaroflifeFill className="size-5" aria-hidden />
                <h2 className="text-[0.95rem] font-normal">{t.warningSigns}</h2>
              </div>
              <ul className="mt-3 space-y-3">
                {plan.warning_signs.map((w, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-alert" aria-hidden />
                    <div><div className="text-[0.9rem]">{w.sign_simple}</div><div className="text-[0.85rem] text-ink/65">{w.action}</div></div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="tel:108" className="inline-flex h-12 items-center gap-2 rounded-full bg-alert px-5 font-medium text-white"><PhoneFill className="size-4" /> {t.call108}</a>
                <ListenButton id="warn" text={warnText} big />
              </div>
            </Card>
          )}

          {/* About */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[0.95rem] font-normal">{t.aboutIllness}</h2>
              <ListenButton id="about" text={`${plan.diagnosis_simple} ${plan.what_happened}`} />
            </div>
            <p className="mt-3 text-[1rem] leading-relaxed">{plan.diagnosis_simple}</p>
            <p className="mt-2 text-[0.85rem] leading-relaxed text-ink/65">{plan.what_happened}</p>
          </Card>

          {/* Diet & activity */}
          {(plan.diet.length > 0 || plan.activity.length > 0) && (
            <Card>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[0.95rem] font-normal">{t.dietActivity}</h2>
                <ListenButton id="diet" text={[...plan.diet, ...plan.activity].join(" ")} />
              </div>
              {[{ label: t.diet, items: plan.diet }, { label: t.activity, items: plan.activity }].map(({ label, items }) => items.length > 0 && (
                <div key={label} className="mt-4">
                  <Label className="text-ink/55">{label}</Label>
                  <ul className="mt-2 space-y-1.5 text-[0.88rem]">{items.map((x, i) => <li key={i}>• {x}</li>)}</ul>
                </div>
              ))}
              {plan.tests_pending.length > 0 && (
                <div className="mt-4">
                  <Label className="text-ink/55">{t.testsPending}</Label>
                  <ul className="mt-2 space-y-1.5 text-[0.88rem]">{plan.tests_pending.map((x, i) => <li key={i}>• {x.name} <span className="text-ink/55">— {x.when}</span></li>)}</ul>
                </div>
              )}
            </Card>
          )}

          {/* Confirm with doctor */}
          {confirm.length > 0 && (
            <Card className="bg-[#FFF7EE]">
              <div className="flex items-start justify-between gap-3">
                <h2 className="flex items-center gap-2 text-[0.95rem] font-normal"><ExclamationmarkBubble className="size-5 text-[#B5651D]" /> {t.confirmWithDoctor}</h2>
                <ListenButton id="confirm" text={confirm.join(" ")} />
              </div>
              <ul className="mt-3 space-y-2 text-[0.88rem]">{confirm.map((c, i) => <li key={i}>• {c}</li>)}</ul>
            </Card>
          )}

          {/* Glossary */}
          {plan.glossary.length > 0 && (
            <Card>
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between text-[1.05rem] font-normal">
                  <span className="flex items-center gap-2"><Book className="size-5" /> {t.glossary}</span>
                  <ChevronRight className="size-4 text-ink/40" />
                </summary>
                <dl className="mt-3 divide-y divide-ink/5">
                  {plan.glossary.map((g, i) => (
                    <div key={i} className="flex gap-4 py-2.5">
                      <dt className="w-24 shrink-0 font-mono text-[0.78rem] uppercase tracking-wide text-ink/70">{g.term}</dt>
                      <dd className="text-[0.92rem]">{g.meaning_simple}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </Card>
          )}

          {/* Share / print / clear */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={share} className="flex h-16 items-center justify-center gap-2 rounded-[22px] bg-[#25D366] font-normal text-white"><PaperplaneFill className="size-5" /> {t.share}</button>
            <button onClick={() => window.print()} className="flex h-16 items-center justify-center gap-2 rounded-[22px] bg-white text-[0.85rem] font-normal ring-1 ring-ink/10"><Printer className="size-5" /> {t.print}</button>
          </div>
          {copied && <p role="status" className="text-center text-[0.9rem] text-sage">{t.copied}</p>}
        </div>
        <Disclaimer />
      </div>

      {/* Printable fridge sheet */}
      <div className="print-only p-6 text-black">
        <h1 className="text-2xl font-medium">{plan.patient.name} — {t.medicinesTitle}</h1>
        <p className="mt-1 text-sm">{plan.patient.hospital} · {plan.patient.doctor}</p>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead><tr>{["", t.morning, t.afternoon, t.evening, t.night].map((h, i) => <th key={i} className="border border-black p-2 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {plan.medicines.map((m, i) => (
              <tr key={i}>
                <td className="border border-black p-2"><b>{m.name}</b><br />{m.purpose_simple} · {timesText(m, t)}</td>
                {SLOTS.map((s) => <td key={s} className="border border-black p-2 text-center text-xl">{m.schedule[s] ? "☐" : ""}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {follow && <p className="mt-4"><b>{t.followUp}:</b> {follow.what} — {follow.date_iso || follow.relative_text}</p>}
        <p className="mt-3"><b>{t.warningSigns}:</b> {plan.warning_signs.map((w) => w.sign_simple).join("; ")}. <b>{t.call108}</b></p>
        <p className="mt-4 text-xs">{t.disclaimer}</p>
      </div>
    </Shell>
  );
}
