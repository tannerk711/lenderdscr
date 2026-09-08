/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Zapier catch hook. Read at RUNTIME via process.env in /api/lead (never in browser code). */
  readonly LEAD_WEBHOOK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  dataLayer: unknown[];
  gtag?: (...args: unknown[]) => void;
  __lenis?: { scrollTo: (target: Element | string | number, opts?: Record<string, unknown>) => void } & Record<string, unknown>;
}
