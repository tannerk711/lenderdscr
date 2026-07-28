import type { APIRoute } from 'astro';

export const prerender = false;

// Forwards form submissions server-side to the CRM webhook.
// Set LEAD_WEBHOOK_URL in the environment (Vercel project settings / .env).
// Keeping the webhook out of the browser: Vite strips non-PUBLIC_ vars from
// client code, and same-origin POST avoids every CORS/preflight failure mode.

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'bad json' }, 400);
  }

  // honeypot filled → bot. Return success so it learns nothing.
  if (typeof data.website === 'string' && data.website.trim() !== '') {
    return json({ ok: true }, 200);
  }

  // TCPA gate, server side. The checkbox in the form is the real UX, but a
  // client-only gate is bypassable and this is a legal consent record, so a
  // lead without affirmative consent never reaches the CRM.
  if (data.tcpaConsent !== true) {
    return json({ ok: false, error: 'consent required' }, 400);
  }

  // Stamp the consent record with data only the server can vouch for. The
  // browser can claim any timestamp/IP; these are captured at the edge.
  const headers = request.headers;
  data.tcpaConsentIp =
    headers.get('x-vercel-forwarded-for') ??
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    null;
  data.tcpaConsentUserAgent = headers.get('user-agent') ?? null;
  data.tcpaConsentReceivedAt = new Date().toISOString();

  const webhook = import.meta.env.LEAD_WEBHOOK_URL;
  if (webhook) {
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
  } else {
    console.log('[lead] LEAD_WEBHOOK_URL not set; payload:', JSON.stringify(data));
  }

  return json({ ok: true }, 200);
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
