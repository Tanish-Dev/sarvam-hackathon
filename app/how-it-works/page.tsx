"use client";
import { Camera, HeartFill, Keyboard, Mic, ShieldLefthalfFill, Sparkles, Speaker2Fill } from "@/components/icons";
import { usePlan } from "@/components/PlanProvider";
import { Card, Label, Shell, TopBar } from "@/components/ui";

const STEPS = [
  { icon: Camera, model: "Sarvam Vision", what: "Reads the photo of your discharge paper — print and handwriting" },
  { icon: Sparkles, model: "Sarvam-105B", what: "Understands it, expands abbreviations, builds your plan, translates it" },
  { icon: Speaker2Fill, model: "Bulbul v3", what: "Reads everything aloud in 11 Indian languages" },
  { icon: Mic, model: "Saaras v3", what: "Understands your spoken questions" },
  { icon: Keyboard, model: "Kivi", what: "Caregivers can dictate into any text box on a laptop" },
];

export default function How() {
  const { t, user } = usePlan();
  return (
    <Shell className="bg-paper">
      <TopBar dark={false} back={user ? "/profile" : "/"} />
      <div className="space-y-4 px-4 pb-16">
        <h1 className="px-1 pt-2 text-[1.5rem] font-light tracking-tight">{t.howTitle}</h1>
        <Card dark>
          <ol className="relative space-y-5">
            <span className="absolute bottom-4 left-[21px] top-4 w-px bg-white/15" aria-hidden />
            {STEPS.map(({ icon: Icon, model, what }, i) => (
              <li key={model} className="relative flex gap-4">
                <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-white text-ink"><Icon className="size-5" /></span>
                <div>
                  <Label className="text-peach">{String(i + 1).padStart(2, "0")} · {model}</Label>
                  <p className="mt-1 text-[0.95rem] text-white/85">{what}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <Card><h2 className="flex items-center gap-2 font-medium"><ShieldLefthalfFill className="size-5 text-sage" /> Privacy</h2><p className="mt-2 text-[0.95rem] text-ink/75">{t.howPrivacy}</p></Card>
        <Card><h2 className="flex items-center gap-2 font-medium"><HeartFill className="size-5 text-alert" /> Safety</h2><p className="mt-2 text-[0.95rem] text-ink/75">{t.howSafety}</p></Card>
        <p className="px-2 text-center text-[0.8rem] text-ink/55">{t.disclaimer}</p>
      </div>
    </Shell>
  );
}
