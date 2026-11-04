"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlan } from "@/components/PlanProvider";
import { Shell } from "@/components/ui";

/** /demo shows the ready-made sample paper on Home (handy for live demos and screenshots). */
export default function Demo() {
  const { ready, openSample } = usePlan();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    openSample();
    router.replace("/home");
  }, [ready, openSample, router]);
  return <Shell className="hero-gradient" />;
}
