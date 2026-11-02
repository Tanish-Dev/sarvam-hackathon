"use client";
import { chunkText, speakableNumbers } from "./chunk";
import { htmlLang, type LangCode } from "./langs";

// One global player: tapping any ▶ stops whatever was playing.
type State = { id: string | null; loading: boolean; fallback: boolean };
let state: State = { id: null, loading: false, fallback: false };
const listeners = new Set<() => void>();
const set = (s: Partial<State>) => { state = { ...state, ...s }; listeners.forEach((l) => l()); };
export const audioStore = {
  subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  get: () => state,
  server: () => state,
};

const cache = new Map<string, Promise<string>>();
let el: HTMLAudioElement | null = null;
let token = 0;

function player() {
  el ??= new Audio();
  return el;
}

/** Call inside a user gesture so later async playback is allowed (iOS Safari). */
export function unlockAudio() {
  const a = player();
  a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  a.play().catch(() => {});
}

function fetchChunk(text: string, lang: LangCode) {
  const key = `${lang}|${text}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch("/api/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, lang }) })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("tts"))))
      .then((b) => URL.createObjectURL(b));
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

function playUrl(url: string, my: number) {
  return new Promise<void>((resolve, reject) => {
    const a = player();
    a.onended = () => resolve();
    a.onerror = () => reject(new Error("audio"));
    a.src = url;
    a.play().catch(reject);
    const check = setInterval(() => { if (my !== token) { clearInterval(check); a.pause(); resolve(); } }, 150);
    a.addEventListener("ended", () => clearInterval(check), { once: true });
  });
}

function speakBrowser(text: string, lang: LangCode, my: number) {
  return new Promise<void>((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = htmlLang(lang);
    u.rate = 0.9;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
    const check = setInterval(() => { if (my !== token) { clearInterval(check); window.speechSynthesis.cancel(); resolve(); } }, 150);
  });
}

export async function speak(id: string, text: string, lang: LangCode) {
  stopAudio();
  const my = ++token;
  const chunks = chunkText(speakableNumbers(text));
  if (!chunks.length) return;
  set({ id, loading: true });
  try {
    for (let i = 0; i < chunks.length; i++) {
      let url: string;
      try {
        url = await fetchChunk(chunks[i], lang);
      } catch {
        set({ loading: false, fallback: true });
        await speakBrowser(chunks.slice(i).join(" "), lang, my);
        break;
      }
      if (my !== token) return;
      if (chunks[i + 1]) fetchChunk(chunks[i + 1], lang).catch(() => {});
      set({ loading: false });
      await playUrl(url, my).catch(() => {});
      if (my !== token) return;
    }
  } finally {
    if (my === token) set({ id: null, loading: false });
  }
}

export function prefetchSpeech(text: string, lang: LangCode) {
  const first = chunkText(speakableNumbers(text))[0];
  if (first) fetchChunk(first, lang).catch(() => {});
}

export function stopAudio() {
  token++;
  el?.pause();
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  set({ id: null, loading: false });
}
