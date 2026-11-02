import { errorResponse, parseMarkdown, parseStatus, TERMINAL } from "@/lib/sarvam";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const status = await parseStatus(jobId);
    if (!TERMINAL.includes(status)) return Response.json({ status });
    if (status === "failed" || status === "rejected") {
      return Response.json({ status, error: "We couldn't read this photo. Try a clearer photo with good light." });
    }
    const markdown = await parseMarkdown(jobId);
    return Response.json({ status: "completed", markdown });
  } catch (e) {
    return errorResponse(e);
  }
}
