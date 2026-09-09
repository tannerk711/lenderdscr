import type { APIRoute } from 'astro';
import { leadDelivery } from '../../config/site';

// The only serverless route. Every gate runs in BOTH modes (honeypot, sub-620,
// TCPA, complete lead, server-stamped consent record). Then:
//   TEST MODE (leadDelivery === 'test', BRIEF section 3): never reads or calls a
//     webhook; logs the payload and returns { ok, forwarded: false, testMode: true }.
//   LIVE MODE: forwards server-side to the Zapier catch hook in LEAD_WEBHOOK_URL
//     (read at RUNTIME via process.env). The webhook never reaches the browser,
//     and a same-origin JSON POST avoids every CORS / preflight failure mode
//     (Astro's security.checkOrigin does not inspect JSON bodies; never switch
//     the form to FormData without `security: { checkOrigin: false }`).
export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const POST: APIRoute = async ({ request }) => {
  // 1. body must be JSON
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'bad json' }, 400);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return json({ ok: false, error: 'bad json' }, 400);
  }

  // 2. honeypot filled => bot. Silent success so it learns nothing and never
  //    burns a Zap task.
  if (typeof data.website === 'string' && data.website.trim() !== '') {
    return json({ ok: true }, 200);
  }

  // 3. sub-620 never reaches the CRM (the form kicks out before contact info
  //    exists; this backstops a hand-built POST the same silent way).
  if (data.credit === '<620') {
    return json({ ok: true }, 200);
  }

  // 4. TCPA gate, server side. A client-only gate is bypassable and this is a
  //    legal consent record. Never soften into a warning.
  if (data.tcpaConsent !== true) {
    return json({ ok: false, error: 'consent required' }, 400);
  }

  // 5. one webhook per lead means a COMPLETE lead: name + email + phone.
  const firstName = typeof data.firstName === 'string' ? data.firstName.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const phone = typeof data.phone === 'string' ? data.phone : String(data.phone ?? '');
  if (firstName.length < 2 || !EMAIL_RE.test(email) || !/^\d{10}$/.test(phone)) {
    return json({ ok: false, error: 'incomplete lead' }, 400);
  }

  // 6. stamp what only the server can vouch for (the browser can claim any
  //    timestamp or IP; these are captured at the edge).
  const headers = request.headers;
  data.tcpaConsentIp =
    headers.get('x-vercel-forwarded-for') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null;
  data.tcpaConsentUserAgent = headers.get('user-agent') ?? null;
  data.tcpaConsentReceivedAt = new Date().toISOString();

  // 7. TEST MODE: nothing leaves this process. No webhook is read or called.
  if (leadDelivery === 'test') {
    console.log('[lead][TEST MODE] would forward:', JSON.stringify(data));
    return json({ ok: true, forwarded: false, testMode: true }, 200);
  }

  // 8. LIVE: runtime secret, process.env FIRST. import.meta.env non-PUBLIC_
  //    vars are inlined at build time (and dead-code-eliminated when absent).
  const webhook = process.env.LEAD_WEBHOOK_URL ?? import.meta.env.LEAD_WEBHOOK_URL;

  // 9. missing webhook: fail loudly in production, log in dev.
  if (!webhook) {
    if (import.meta.env.PROD) {
      return json({ ok: false, error: 'not configured' }, 500);
    }
    console.warn('[lead] LEAD_WEBHOOK_URL not set; payload:', JSON.stringify(data));
    return json({ ok: true }, 200);
  }

  // 10. forward
  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return json({ ok: false, error: `webhook ${res.status}` }, 502);
  } catch {
    return json({ ok: false, error: 'webhook unreachable' }, 502);
  }

  return json({ ok: true, forwarded: true }, 200);
};
