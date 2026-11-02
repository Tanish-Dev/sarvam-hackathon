"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlan } from "./PlanProvider";

export function useRequirePlan() {
  const ctx = usePlan();
  const router = useRouter();
  useEffect(() => { if (ctx.ready && !ctx.base) router.replace("/"); }, [ctx.ready, ctx.base, router]);
  useEffect(() => { if (ctx.ready && ctx.base) void ctx.ensureTranslated(ctx.lang); }, [ctx.ready, ctx.base, ctx.lang]); // eslint-disable-line react-hooks/exhaustive-deps
  return ctx;
}
