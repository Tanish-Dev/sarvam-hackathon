import { cookies } from "next/headers";
import { cookieOptions, readSession, SESSION_COOKIE, SESSION_MAX_AGE, sessionToken } from "@/lib/auth";

/** Body: { name } → updates the signed-in user's name. */
export async function POST(req: Request) {
  const jar = await cookies();
  const user = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!user) return Response.json({ error: "Please sign in again." }, { status: 401 });
  const { name } = (await req.json().catch(() => ({}))) as { name?: unknown };
  const n = String(name ?? "").trim().slice(0, 60);
  if (!n) return Response.json({ error: "Please enter a name." }, { status: 400 });
  const next = { phone: user.phone, name: n };
  jar.set(SESSION_COOKIE, await sessionToken(next), cookieOptions(SESSION_MAX_AGE));
  return Response.json({ user: next });
}
