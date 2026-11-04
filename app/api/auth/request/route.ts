import { cookies } from "next/headers";
import { cookieOptions, OTP_COOKIE, OTP_MAX_AGE, validPhone } from "@/lib/auth";
import { signToken } from "@/lib/session";

/** Body: { phone } → starts a sign-in. Demo mode returns the code instead of sending an SMS. */
export async function POST(req: Request) {
  const { phone } = (await req.json().catch(() => ({}))) as { phone?: unknown };
  const p = String(phone ?? "").replace(/\D/g, "").slice(-10);
  if (!validPhone(p)) return Response.json({ error: "Please enter a 10-digit mobile number." }, { status: 400 });
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  (await cookies()).set(OTP_COOKIE, await signToken({ phone: p, code }, OTP_MAX_AGE), cookieOptions(OTP_MAX_AGE));
  return Response.json({ phone: p, demoCode: code });
}
