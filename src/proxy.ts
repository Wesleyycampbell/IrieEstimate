import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "ie_ws_session";

function getSecret(): string {
  const s = process.env.WORKSPACE_SECRET;
  if (!s) throw new Error("WORKSPACE_SECRET environment variable is required");
  return s;
}

const encoder = new TextEncoder();

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacSign(data: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyToken(token: string): Promise<string | null> {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = token.substring(0, lastDot);
  const sig = token.substring(lastDot + 1);
  const expected = await hmacSign(payload);
  if (!constantTimeEqual(sig, expected)) return null;
  return payload;
}

// In-memory rate limiter for Edge Runtime
const apiHits = new Map<string, { count: number; resetAt: number }>();
const API_RATE_LIMIT = 60;
const API_WINDOW_MS = 60_000;

function checkApiRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = apiHits.get(ip);
  if (!entry || now > entry.resetAt) {
    apiHits.set(ip, { count: 1, resetAt: now + API_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= API_RATE_LIMIT;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Rate limit all API routes
  if (pathname.startsWith("/api/")) {
    if (!checkApiRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // Block non-GET API requests without a valid origin/referer (CSRF protection)
    if (request.method !== "GET") {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      const host = request.headers.get("host");

      if (origin) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else if (referer) {
        try {
          const refererHost = new URL(referer).host;
          if (refererHost !== host) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }
  }

  // Auth check for workspace routes
  if (pathname.startsWith("/hq-workspace") && !pathname.startsWith("/hq-workspace/login")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    if (!token || !(await verifyToken(token))) {
      const loginUrl = new URL("/hq-workspace/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hq-workspace/:path*", "/api/:path*"],
};
