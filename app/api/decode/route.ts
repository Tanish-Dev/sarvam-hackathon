import { chatJson, errorResponse } from "@/lib/sarvam";
import { DECODE_SYSTEM } from "@/lib/prompts";
import { normalizePlan, planJsonSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text || text.trim().length < 20) {
      return Response.json({ error: "We couldn't find any text on the paper. Try a clearer photo." }, { status: 400 });
    }
    const raw = await chatJson({
      messages: [
        { role: "system", content: DECODE_SYSTEM },
        { role: "user", content: `Discharge summary text:\n\n${text.slice(0, 20000)}` },
      ],
      schemaName: "discharge_plan",
      schema: planJsonSchema,
      maxTokens: 16000,
      reasoning: "none",
      timeoutMs: 280_000,
    });
    const plan = normalizePlan(raw);
    if (!plan.medicines.length && !plan.diagnosis_simple) {
      return Response.json({ error: "This doesn't look like a discharge paper. Please try again." }, { status: 422 });
    }
    return Response.json({ plan });
  } catch (e) {
    return errorResponse(e);
  }
}
