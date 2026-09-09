import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Static output; only /api/lead opts into the serverless runtime with
// `export const prerender = false`. Never `output: 'hybrid'` (removed in Astro 5).
// `site` matches brand.domain in src/config/site.ts (canonicals + sitemap).
// Redirects: ILD's old GHL paths keep working after the domain cutover.
export default defineConfig({
  site: 'https://lenderdscr.com',
  trailingSlash: 'never',
  output: 'static',
  adapter: vercel(),
  redirects: {
    '/dscr-loan-texas': '/',
    '/dscr-loan-texas-2': '/',
    '/dscr-loan-california': '/',
    '/home-2': '/',
    '/privacy-policy': '/privacy',
  },
  integrations: [
    react(),
    sitemap({ filter: (page) => !/\/(thank-you|not-yet|test-leads|404)$/.test(page.replace(/\/$/, '')) }),
  ],
  devToolbar: { enabled: false },
  build: {
    // Keep CSS external: inlining the whole stylesheet bloats the HTML and
    // delays first paint (proven on the roofing template, 80 -> 95 mobile).
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
