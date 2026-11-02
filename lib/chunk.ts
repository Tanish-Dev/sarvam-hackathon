/** Split text into ≤ max-char chunks on sentence boundaries (Bulbul accepts 2500 chars per call). */
export function chunkText(text: string, max = 2400): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= max) return [clean];
  const sentences = clean.match(/[^.!?।॥]+[.!?।॥]*\s*/g) ?? [clean];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      chunks.push(cur.trim());
      cur = "";
    }
    if (s.length > max) {
      for (let i = 0; i < s.length; i += max) chunks.push(s.slice(i, i + max).trim());
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

/** Write numbers longer than 4 digits with Indian-style commas so TTS reads them naturally. */
export function speakableNumbers(text: string) {
  return text.replace(/\b\d{5,}\b/g, (n) => Number(n).toLocaleString("en-IN"));
}
