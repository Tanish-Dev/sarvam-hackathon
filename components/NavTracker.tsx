"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackNavigation } from "@/lib/nav";

export function NavTracker() {
  const path = usePathname();
  useEffect(() => trackNavigation(path), [path]);
  return null;
}
