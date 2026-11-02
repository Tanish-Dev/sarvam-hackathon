"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlan } from "./PlanProvider";
import { SAMPLE_PLANS } from "@/lib/sample";

export function useRequirePlan() {
  const ctx = usePlan();
  const router = useRouter();
  useEffect(() => {
    if (!ctx.ready || ctx.base) return;
    // ?demo=1 opens the sample plan directly (handy for judges and screenshots).
    if (new URLSearchParams(window.location.search).has("demo")) ctx.setPlan(SAMPLE_PLANS["en-IN"]!, true);
    else router.replace("/");
  }, [ctx.ready, ctx.base, router]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ctx.ready && ctx.base) void ctx.ensureTranslated(ctx.lang); }, [ctx.ready, ctx.base, ctx.lang]); // eslint-disable-line react-hooks/exhaustive-deps
  return ctx;
}
