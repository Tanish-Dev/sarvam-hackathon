"use client";
import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, Checkmark } from "./icons";

export function SlideToConfirm({ label, doneLabel, done, onConfirm }: { label: string; doneLabel: string; done: boolean; onConfirm: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [w, setW] = useState(0);
  const fade = useTransform(x, [0, Math.max(1, w * 0.6)], [1, 0]);

  if (done) {
    return (
      <div className="flex h-16 items-center justify-center gap-2 rounded-full bg-sage text-white" role="status">
        <Checkmark className="size-5" /> {doneLabel}
      </div>
    );
  }
  return (
    <div ref={track} className="relative h-16 overflow-hidden rounded-full bg-night text-white"
      onPointerEnter={() => setW((track.current?.offsetWidth ?? 0) - 64)}>
      <motion.span style={{ opacity: fade }} className="absolute inset-0 flex items-center justify-center pl-14 pr-4 text-[0.9rem]">{label}</motion.span>
      <motion.button
        aria-label={label}
        onClick={onConfirm}
        drag="x" dragConstraints={track} dragElastic={0} dragMomentum={false} style={{ x }}
        onDragStart={() => setW((track.current?.offsetWidth ?? 0) - 64)}
        onDragEnd={() => {
          if (x.get() > w * 0.75) { animate(x, w); onConfirm(); } else animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
        }}
        className="absolute left-1 top-1 grid size-14 cursor-grab place-items-center rounded-full bg-white text-ink active:cursor-grabbing"
      >
        <ArrowRight className="size-5" />
      </motion.button>
    </div>
  );
}
