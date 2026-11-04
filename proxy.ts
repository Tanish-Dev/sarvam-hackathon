import { NextResponse, type NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/auth";

// These call paid Sarvam APIs, so they need a signed-in user. /api/translate stays open because
// onboarding translates the UI before sign-in.
const PROTECTED_API = ["/api/scan", "/api/decode", "/api/tts", "/api/ask"];

/** Signed-in users skip the welcome and sign-in screens; everyone else is kept out of the app. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (pathname.startsWith("/api/")) {
    if (!user && PROTECTED_API.some((p) => pathname.startsWith(p))) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    return;
  }
  if (pathname === "/" || pathname === "/login") {
    if (user?.name) return NextResponse.redirect(new URL("/home", request.url));
    return;
  }
  // Signed in but no name yet: finish the last sign-in step first.
  if (!user?.name) return NextResponse.redirect(new URL(user ? "/login" : "/", request.url));
}

export const config = {
  matcher: ["/", "/login", "/home", "/medicines", "/checklist", "/ask", "/profile", "/scan/:path*", "/demo", "/api/:path*"],
};
