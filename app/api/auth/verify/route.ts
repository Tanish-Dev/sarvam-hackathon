import { cookies } from "next/headers";
import { cookieOptions, OTP_COOKIE, readSession, SESSION_COOKIE, SESSION_MAX_AGE, sessionToken, type User } from "@/lib/auth";
import { verifyToken } from "@/lib/session";

/** Body: { code } → signs in the phone number from the pending code. */
export async function POST(req: Request) {
  const { code } = (await req.json().catch(() => ({}))) as { code?: unknown };
  const jar = await cookies();
  const otp = await verifyToken<{ phone: string; code: string }>(jar.get(OTP_COOKIE)?.value);
  if (!otp) return Response.json({ error: "expired" }, { status: 400 });
  if (String(code ?? "").trim() !== otp.code) return Response.json({ error: "wrong" }, { status: 400 });
  jar.delete(OTP_COOKIE);
  // Keep the name when the same number signs in again.
  const prev = await readSession(jar.get(SESSION_COOKIE)?.value);
  const user: User = { phone: otp.phone, name: prev?.phone === otp.phone ? prev.name : "" };
  jar.set(SESSION_COOKIE, await sessionToken(user), cookieOptions(SESSION_MAX_AGE));
  return Response.json({ user });
}
