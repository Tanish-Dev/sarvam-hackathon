import { errorResponse, tts } from "@/lib/sarvam";
import { isLang } from "@/lib/langs";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, lang } = (await req.json()) as { text?: string; lang?: unknown };
    if (!text?.trim() || !isLang(lang)) return Response.json({ error: "Nothing to read." }, { status: 400 });
    const audio = await tts(text.slice(0, 2500), lang);
    return new Response(new Uint8Array(audio), { headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=3600" } });
  } catch (e) {
    return errorResponse(e);
  }
}
