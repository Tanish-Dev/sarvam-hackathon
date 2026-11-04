"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlan } from "./PlanProvider";

const NO_TICKS: Record<string, boolean> = {};

/** The paper the app is showing. Pages that need one send the user Home when there is none. */
export function useActivePlan({ required = true } = {}) {
  const ctx = usePlan();
  const router = useRouter();
  const saved = ctx.active;
  const missing = required && ctx.ready && !saved;

  useEffect(() => { if (missing) router.replace("/home"); }, [missing, router]);
  useEffect(() => { if (saved) void ctx.ensureTranslated(saved.id, ctx.lang); }, [saved?.id, ctx.lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...ctx,
    id: saved?.id ?? "",
    base: saved?.base ?? null,
    plan: saved ? ctx.view(saved) : null,
    isSample: saved?.isSample ?? false,
    createdAt: saved?.createdAt ?? 0,
    ticks: saved?.ticks ?? NO_TICKS,
    translating: saved ? ctx.isTranslating(saved.id) : false,
    setTick: (key: string, v: boolean) => { if (saved) ctx.setTicks(saved.id, [key], v); },
    setTicks: (keys: string[], v: boolean) => { if (saved) ctx.setTicks(saved.id, keys, v); },
  };
}
