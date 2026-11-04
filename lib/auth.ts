// Demo login: a phone number plus a 6-digit code shown on screen (no SMS provider yet).
// The session is a signed cookie holding the phone number and name; plans stay on the device.
import { signToken, verifyToken } from "./session";

export interface User { phone: string; name: string }

export const SESSION_COOKIE = "samjho_session";
export const OTP_COOKIE = "samjho_otp";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const OTP_MAX_AGE = 10 * 60;

export const validPhone = (p: string) => /^[6-9]\d{9}$/.test(p);
export const readSession = (token: string | undefined) => verifyToken<User>(token);
export const sessionToken = (u: User) => signToken({ phone: u.phone, name: u.name }, SESSION_MAX_AGE);

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge,
});
