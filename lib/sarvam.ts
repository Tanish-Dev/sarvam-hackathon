import "server-only";
import { SarvamAIClient } from "sarvamai";

const BASE = "https://api.sarvam.ai";

export class SarvamError extends Error {
  constructor(public status: number, message: string, public friendly: string) {
    super(message);
  }
}

function key() {
  const k = process.env.SARVAM_API_KEY;
  if (!k) throw new SarvamError(500, "SARVAM_API_KEY is not set", "The app is not connected to Sarvam yet. Try the sample instead.");
  return k;
}

function friendlyFor(status: number) {
  if (status === 401 || status === 403) return "The app couldn't sign in to Sarvam. Try the sample for now.";
  if (status === 429) return "Lots of people are using this right now. Please wait a few seconds and try again.";
  if (status >= 500) return "Sarvam is busy right now. Please try again in a moment.";
  return "Something went wrong. Please try again.";
}

async function call(path: string, init: RequestInit, timeoutMs = 55_000): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "api-subscription-key": key(), ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(timeoutMs),
  }).catch((e: unknown) => {
    const timeout = e instanceof Error && e.name === "TimeoutError";
    throw new SarvamError(504, String(e), timeout ? "This is taking too long. Please try again." : "We couldn't reach Sarvam. Check your internet and try again.");
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new SarvamError(res.status, `${path} ${res.status}: ${body.slice(0, 500)}`, friendlyFor(res.status));
  }
  return res;
}

// ---------- Sarvam Vision (Document AI) ----------

let _client: SarvamAIClient | null = null;
const client = () => (_client ??= new SarvamAIClient({ apiSubscriptionKey: key() }));

async function sdk<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: unknown) {
    if (e instanceof SarvamError) throw e;
    const status = (e as { statusCode?: number }).statusCode ?? 500;
    throw new SarvamError(status, `docAi: ${String(e).slice(0, 500)}`, friendlyFor(status));
  }
}

export async function startParse(files: File[]) {
  const job = await sdk(() =>
    client().docAi.parse({ file: files, language: "en-IN", content_type: "mixed" }, { timeoutInSeconds: 50 }),
  );
  return job.job_id;
}

export const TERMINAL = ["completed", "partially_completed", "failed", "rejected"];

export async function parseStatus(jobId: string) {
  const st = await sdk(() => client().docAi.getStatus(jobId, { timeoutInSeconds: 20 }));
  return st.status;
}

export async function parseMarkdown(jobId: string) {
  // Jobs may produce HTML only ("job produced html, cannot serve md"), so ask for HTML and flatten it.
  const res = await sdk(() => client().docAi.getResults(jobId, { format: "html" }, { timeoutInSeconds: 40 }));
  const docs = ((res as { documents?: { pages?: { page_number?: number; content?: string }[] }[] }).documents) ?? [];
  return docs
    .flatMap((d) => d.pages ?? [])
    .sort((a, b) => (a.page_number ?? 0) - (b.page_number ?? 0))
    .map((p) => htmlToText(p.content ?? ""))
    .join("\n\n")
    .trim();
}

function htmlToText(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/(td|th)>/gi, " | ")
    .replace(/<(br|\/p|\/div|\/tr|\/li|\/h\d)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

// ---------- Sarvam-105B ----------

type Msg = { role: "system" | "user" | "assistant"; content: string };

function extractJson(text: string): unknown {
  const t = text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```(?:json)?/g, "").trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(t.slice(start, end + 1));
    throw new SarvamError(502, `Model did not return JSON: ${t.slice(0, 200)}`, "We couldn't understand the paper clearly. Please try again.");
  }
}

/**
 * Chat completion that returns parsed JSON. Tries strict json_schema first and
 * falls back to json_object (schema in the prompt) if the API rejects the format.
 */
export async function chatJson(opts: {
  messages: Msg[];
  schemaName: string;
  schema: object;
  maxTokens: number;
  reasoning?: "none" | "low" | "high";
  temperature?: number;
  timeoutMs?: number;
}): Promise<unknown> {
  const base = {
    model: "sarvam-105b",
    messages: opts.messages,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature ?? 0.2,
    ...(opts.reasoning ? { reasoning_effort: opts.reasoning } : {}),
  };
  const send = (body: object) =>
    call("/v2/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }, opts.timeoutMs).then((r) => r.json() as Promise<{ choices?: { message?: { content?: string } }[] }>);

  let data;
  try {
    data = await send({
      ...base,
      response_format: { type: "json_schema", json_schema: { name: opts.schemaName, strict: true, schema: opts.schema } },
    });
  } catch (e) {
    if (!(e instanceof SarvamError) || e.status !== 400 && e.status !== 422) throw e;
    const [sys, ...rest] = opts.messages;
    data = await send({
      ...base,
      messages: [{ role: "system", content: `${sys.content}\n\nReturn ONLY a JSON object matching this JSON schema:\n${JSON.stringify(opts.schema)}` }, ...rest],
      response_format: { type: "json_object" },
    });
  }
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content) throw new SarvamError(502, "Empty model response", "We couldn't get an answer. Please try again.");
  return extractJson(content);
}

// ---------- Bulbul (TTS) ----------

export async function tts(text: string, languageCode: string): Promise<Buffer> {
  const res = await call("/text-to-speech", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, language_code: languageCode, model: "bulbul:v3", pace: 0.9, output_audio_codec: "mp3" }),
  }, 40_000);
  const data = (await res.json()) as { audios?: string[] };
  const parts = (data.audios ?? []).map((a) => Buffer.from(a, "base64"));
  if (!parts.length) throw new SarvamError(502, "No audio returned", "We couldn't make the voice right now.");
  return Buffer.concat(parts);
}

// ---------- Saaras (STT) ----------

export async function stt(audio: File, languageCode: string): Promise<{ transcript: string; language: string }> {
  const fd = new FormData();
  fd.append("file", audio, audio.name || "question.webm");
  fd.append("model", "saaras:v3");
  fd.append("mode", "transcribe");
  fd.append("language_code", languageCode || "unknown");
  const res = await call("/speech-to-text", { method: "POST", body: fd }, 40_000);
  const data = (await res.json()) as { transcript?: string; language_code?: string };
  return { transcript: (data.transcript ?? "").trim(), language: data.language_code ?? languageCode };
}

export function errorResponse(e: unknown) {
  if (e instanceof SarvamError) {
    console.error("[sarvam]", e.status, e.message);
    return Response.json({ error: e.friendly }, { status: e.status >= 400 && e.status < 600 ? e.status : 500 });
  }
  console.error("[sarvam] unexpected", e);
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
