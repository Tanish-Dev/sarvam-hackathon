// Signed (not encrypted) tokens: base64url(JSON) "." base64url(HMAC-SHA256). Web Crypto, so it also runs in proxy.ts.
const enc = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") console.warn("SESSION_SECRET is not set; sessions use an insecure demo secret.");
  return s || "samjho-demo-secret-change-me";
}

const key = () => (keyPromise ??= crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]));
const b64 = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export async function signToken(payload: object, maxAgeSec: number) {
  const body = b64(enc.encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + maxAgeSec })));
  const sig = b64(await crypto.subtle.sign("HMAC", await key(), enc.encode(body)));
  return `${body}.${sig}`;
}

export async function verifyToken<T>(token: string | undefined): Promise<T | null> {
  const [body, sig] = token?.split(".") ?? [];
  if (!body || !sig) return null;
  try {
    if (!(await crypto.subtle.verify("HMAC", await key(), unb64(sig), enc.encode(body)))) return null;
    const data = JSON.parse(new TextDecoder().decode(unb64(body))) as T & { exp: number };
    return data.exp > Date.now() / 1000 ? data : null;
  } catch {
    return null;
  }
}
