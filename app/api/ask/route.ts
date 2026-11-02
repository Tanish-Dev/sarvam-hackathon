import { chatJson, errorResponse, stt } from "@/lib/sarvam";
import { askSystem } from "@/lib/prompts";
import { isLang, langInfo, type LangCode } from "@/lib/langs";
import { normalizePlan } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

// Deterministic safety net — runs even if the model misses it.
const RED_FLAGS = [
  "chest pain", "can't breathe", "cannot breathe", "breathless", "unconscious", "fainted", "bleeding", "stroke", "black stool",
  "seene mein dard", "seene me dard", "saans", "behosh", "सीने", "छाती", "साँस", "सांस", "बेहोश", "बेशुद्ध", "खून बह", "श्वास",
];

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const lang: LangCode = isLang(form.get("lang")) ? (form.get("lang") as LangCode) : "en-IN";
    const plan = normalizePlan(JSON.parse(String(form.get("plan") ?? "{}")));
    let question = String(form.get("text") ?? "").trim();
    const audio = form.get("audio");
    if (!question && audio instanceof File && audio.size > 0) {
      question = (await stt(audio, lang)).transcript;
    }
    if (!question) return Response.json({ error: "We didn't catch that. Please try again." }, { status: 400 });

    const doctor = [plan.patient.doctor, plan.patient.hospital].filter(Boolean).join(", ");
    const out = (await chatJson({
      messages: [
        { role: "system", content: askSystem(langInfo(lang).english, JSON.stringify(plan), doctor ? ` (${doctor})` : "") },
        { role: "user", content: question },
      ],
      schemaName: "answer",
      schema: {
        type: "object", additionalProperties: false, required: ["answer", "emergency"],
        properties: { answer: { type: "string" }, emergency: { type: "boolean" } },
      },
      maxTokens: 6000, reasoning: "low", temperature: 0.2,
    })) as { answer?: string; emergency?: boolean };

    const q = question.toLowerCase();
    const emergency = out.emergency === true || RED_FLAGS.some((w) => q.includes(w));
    return Response.json({ question, answer: String(out.answer ?? ""), emergency });
  } catch (e) {
    return errorResponse(e);
  }
}
