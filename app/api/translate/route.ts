import { chatJson, errorResponse } from "@/lib/sarvam";
import { translateSystem } from "@/lib/prompts";
import { isLang, langInfo } from "@/lib/langs";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = {
  type: "object", additionalProperties: false, required: ["t"],
  properties: { t: { type: "array", items: { type: "string" } } },
};

async function batch(strings: string[], lang: string): Promise<string[]> {
  const out = (await chatJson({
    messages: [
      { role: "system", content: translateSystem(lang) + "\n- Keep any {placeholder} in curly braces exactly unchanged." },
      { role: "user", content: JSON.stringify({ t: strings }) },
    ],
    schemaName: "translation", schema, maxTokens: 12000, reasoning: "low", temperature: 0.1,
  })) as { t?: unknown };
  const t = Array.isArray(out.t) ? out.t : [];
  return strings.map((s, i) => (typeof t[i] === "string" && t[i] ? (t[i] as string) : s));
}

/** Body: { strings: string[], lang } → { strings } in the same order. */
export async function POST(req: Request) {
  try {
    const { strings, lang } = (await req.json()) as { strings?: unknown; lang?: unknown };
    if (!Array.isArray(strings) || !isLang(lang)) return Response.json({ error: "Bad request" }, { status: 400 });
    const list = strings.map((s) => String(s ?? "")).slice(0, 400);
    const name = langInfo(lang).english;
    const size = 40;
    const parts = [];
    for (let i = 0; i < list.length; i += size) parts.push(batch(list.slice(i, i + size), name));
    return Response.json({ strings: (await Promise.all(parts)).flat() });
  } catch (e) {
    return errorResponse(e);
  }
}
