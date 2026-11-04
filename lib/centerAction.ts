"use client";
// Lets the current page take over the navbar's centre button (the Ask page turns it into the mic).
export interface CenterAction {
  label: string;
  recording: boolean;
  disabled: boolean;
  /** 0..1 of the recording time left, drawn as a ring. */
  progress: number;
  onPress: () => void;
}

let action: CenterAction | null = null;
const listeners = new Set<() => void>();

export const centerAction = {
  set: (a: CenterAction | null) => { action = a; listeners.forEach((l) => l()); },
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  get: () => action,
  server: () => null,
};
