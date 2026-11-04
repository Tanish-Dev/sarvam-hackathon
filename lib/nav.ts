"use client";
// Mirrors this tab's in-app history so Back buttons can pop an entry instead of stacking a new one.
// A push grows history.length; a replace or a browser back leaves it unchanged.
const stack: string[] = [];
let len = 0;

export function trackNavigation(path: string) {
  const l = window.history.length;
  if (!stack.length || l > len) stack.push(path);
  else if (stack.at(-2) === path) stack.pop();
  else stack[stack.length - 1] = path;
  len = l;
}

/** The in-app page one history entry back, or null if Back would leave the app. */
export const previousPath = () => stack.at(-2) ?? null;
