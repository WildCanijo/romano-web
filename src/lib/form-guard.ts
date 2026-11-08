import "server-only";

/**
 * Invisible spam checks for the contact form. Visitors never see a challenge.
 *
 * 1. Honeypot. A hidden "website" field that people never fill in.
 * 2. JavaScript proof. The form's script adds a "human" field with how long the
 *    form was open and how many times the visitor typed or clicked in it.
 *    Bots that post without running the page, fill it in instantly, or never
 *    interact with it fail this check.
 * 3. Rate limit. At most 5 submissions per visitor (IP) every 10 minutes.
 *
 * Failed checks 1 and 2 get a fake success, so bots learn nothing.
 * Next.js also rejects server action requests whose Origin doesn't match the
 * site's host, so other websites can't post to this form.
 */

// Keep in sync with MIN_FILL_MS in src/components/contact/contact-form.tsx.
const MIN_FILL_MS = 3_000;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export function looksHuman(formData: FormData) {
  const trap = formData.get("website");
  if (typeof trap === "string" && trap.length > 0) return false;

  const proof = formData.get("human");
  if (typeof proof !== "string") return false;
  const match = /^(\d+)\.(\d+)$/.exec(proof);
  if (!match) return false;
  const [, elapsed, interactions] = match;
  return Number(elapsed) >= MIN_FILL_MS && Number(interactions) > 0;
}

// In-memory rate limit. On serverless hosting each instance keeps its own
// count, so treat it as a speed bump.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep the map from growing without bound.
  if (hits.size > 5_000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return true;
}

/** Best-effort visitor IP from proxy headers. */
export function clientIp(h: Headers) {
  return (
    h.get("x-nf-client-connection-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
