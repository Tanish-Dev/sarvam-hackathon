"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { usePlan } from "./PlanProvider";

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

/** Bottom sheet. Portalled into the phone screen (#overlay-root) so no parent clips it. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const mounted = useMounted();
  const { t } = usePlan();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    // On laptops the page scrolls inside the phone mockup, on phones it scrolls the body; lock both.
    const scrollers = [document.body, document.querySelector<HTMLElement>(".device-scroll")].filter((el): el is HTMLElement => !!el);
    const prev = scrollers.map((el) => el.style.overflow);
    scrollers.forEach((el) => { el.style.overflow = "hidden"; });
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => {
      scrollers.forEach((el, i) => { el.style.overflow = prev[i]; });
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] text-ink">
          <motion.div className="absolute inset-0 bg-night/50 backdrop-blur-sm" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div ref={panel} role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabIndex={-1}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[88dvh] max-w-[440px] overflow-y-auto rounded-t-[32px] bg-paper px-4 pt-3 pb-[max(var(--safe-bottom),20px)] outline-none">
            <div className="mx-auto h-1 w-10 rounded-full bg-ink/15" aria-hidden />
            <div className="mt-3 flex items-center justify-between px-1">
              <h2 id="sheet-title" className="text-[1.25rem] font-light tracking-tight">{title}</h2>
              <button onClick={onClose} className="h-10 rounded-full bg-night px-5 text-[0.85rem] text-white">{t.done}</button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.getElementById("overlay-root") ?? document.body,
  );
}
