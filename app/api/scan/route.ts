import { errorResponse, startParse } from "@/lib/sarvam";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("file").filter((f): f is File => f instanceof File).slice(0, 4);
    if (!files.length) return Response.json({ error: "Please add a photo of your paper." }, { status: 400 });
    const jobId = await startParse(files);
    return Response.json({ jobId });
  } catch (e) {
    return errorResponse(e);
  }
}
