"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { centerAction } from "@/lib/centerAction";
import { unlockAudio } from "@/lib/audio";
import {
  CameraFill, Capsule, CapsuleFill, CheckmarkSquare, CheckmarkSquareFill, House, HouseFill, MicFill, PersonCropCircle, PersonCropCircleFill, StopFill,
} from "./icons";
import { usePlan } from "./PlanProvider";

const PAGES = ["/home", "/medicines", "/ask", "/checklist", "/profile"];
type Icon = (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;

/**
 * The app's one navbar. With a paper: Home · Medicines · [Ask] · Checklist · Profile.
 * Before the first paper: Home · [Scan] · Profile. On the Ask page the centre button is the mic.
 */
export function AppNav() {
  const path = usePathname();
  const { t, user, active, ready } = usePlan();
  const center = useSyncExternalStore(centerAction.subscribe, centerAction.get, centerAction.server);
  if (!ready || !user || !PAGES.includes(path)) return null;

  const dark = path === "/medicines" || path === "/ask";
  const tab = (href: string, label: string, icon: Icon, iconOn: Icon) => ({ href, label, icon, iconOn });
  const left = active ? [tab("/home", t.navHome, House, HouseFill), tab("/medicines", t.navMeds, Capsule, CapsuleFill)] : [tab("/home", t.navHome, House, HouseFill)];
  const right = active ? [tab("/checklist", t.navChecklist, CheckmarkSquare, CheckmarkSquareFill), tab("/profile", t.navProfile, PersonCropCircle, PersonCropCircleFill)]
    : [tab("/profile", t.navProfile, PersonCropCircle, PersonCropCircleFill)];

  const renderTab = ({ href, label, icon: Off, iconOn: On }: ReturnType<typeof tab>) => {
    const on = path === href;
    const Icon = on ? On : Off;
    // Tabs replace each other, so the phone's Back button never walks back through tabs.
    return (
      <Link key={href} href={href} replace aria-current={on ? "page" : undefined}
        className={`flex min-w-16 flex-col items-center gap-1 rounded-[22px] px-2 py-1.5 transition ${
          on ? (dark ? "glass-pill-dark text-white" : "glass-pill-light text-ink") : dark ? "text-white/55 hover:text-white/80" : "text-ink/50 hover:text-ink/75"}`}>
        <Icon className="size-[22px]" aria-hidden />
        <span className="max-w-16 truncate text-[0.62rem]">{label}</span>
      </Link>
    );
  };

  const orb = (icon: React.ReactNode, ring?: React.ReactNode) => (
    <span className={`relative grid size-[60px] place-items-center rounded-full p-[5px] ${dark ? "glass-dark" : "glass-light"}`}>
      {ring}
      <span className="glass-orb relative grid size-full place-items-center rounded-full text-white transition active:scale-95">{icon}</span>
    </span>
  );
  const centerLabel = (text: string) => <span className={`text-[0.62rem] ${dark ? "text-white" : "text-ink"}`}>{text}</span>;

  let centerButton: React.ReactNode;
  if (!active) {
    centerButton = (
      <Link href="/scan" onClick={unlockAudio} className="-mt-9 flex flex-col items-center gap-1">
        {orb(<CameraFill className="size-6" aria-hidden />)}{centerLabel(t.navScan)}
      </Link>
    );
  } else if (path === "/ask" && center) {
    centerButton = (
      <button onClick={center.onPress} disabled={center.disabled} aria-label={center.label} className="-mt-9 flex flex-col items-center gap-1 disabled:opacity-50">
        {orb(center.recording ? <StopFill className="size-5" aria-hidden /> : <MicFill className="size-6" aria-hidden />, center.recording && (
          <>
            <span className="breathe absolute inset-0 rounded-full bg-white" aria-hidden />
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeDasharray={295} strokeDashoffset={295 * (1 - center.progress)} strokeLinecap="round" />
            </svg>
          </>
        ))}
        {centerLabel(center.recording ? t.stopRecording : t.navAsk)}
      </button>
    );
  } else {
    centerButton = (
      <Link href="/ask" replace onClick={unlockAudio} aria-current={path === "/ask" ? "page" : undefined} className="-mt-9 flex flex-col items-center gap-1">
        {orb(<MicFill className="size-6" aria-hidden />)}{centerLabel(t.navAsk)}
      </Link>
    );
  }

  return (
    <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[440px] px-3 pb-[max(var(--safe-bottom),10px)]">
      <div className={`flex h-[68px] items-center justify-around rounded-[30px] px-1.5 ${dark ? "glass-dark" : "glass-light"}`}>
        {left.map(renderTab)}
        {centerButton}
        {right.map(renderTab)}
      </div>
    </nav>
  );
}
