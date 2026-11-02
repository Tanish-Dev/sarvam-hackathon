"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** On laptop-sized screens, render the app inside an iPhone mockup. Phones get the plain app. */
export function DeviceFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [scale, setScale] = useState(1);
  // The phone is 437×879 at full size (393×852 screen); shrink it to fit the window.
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 48) / 879, (window.innerWidth - 48) / 437));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  // The printable sample paper is meant to be shown full-size, not inside the phone.
  if (path === "/sample-paper") return <>{children}</>;
  return (
    <div className="device-stage" style={{ "--device-scale": scale } as React.CSSProperties}>
      <div className="device-fit">
        <div className="device">
          <div className="device-screen">
            <div className="device-scroll">{children}</div>
            <div className="device-status" aria-hidden>
              <span>9:41</span>
              <span className="flex items-center gap-1.5">
                <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.8" /><rect x="4.5" y="5" width="3" height="6" rx="0.8" /><rect x="9" y="2.5" width="3" height="8.5" rx="0.8" /><rect x="13.5" y="0" width="3" height="11" rx="0.8" /></svg>
                <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor" /><path d="M23 4v4c.8-.3 1.3-1.1 1.3-2S23.8 4.3 23 4z" fill="currentColor" opacity="0.4" /></svg>
              </span>
            </div>
            <div className="device-home" aria-hidden />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- static overlay, no optimisation needed */}
          <img className="device-bezel" src="/iphone-frame.png" alt="" aria-hidden draggable={false} />
        </div>
      </div>
    </div>
  );
}
