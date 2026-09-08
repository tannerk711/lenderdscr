import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Static output; only /api/lead opts into the serverless runtime with
// `export const prerender = false`. Never `output: 'hybrid'` (removed in Astro 5).
// REBRAND: `site` must match brand.domain in src/config/site.ts (canonicals + sitemap).
export default defineConfig({
  site: 'https://dscrlenders.example',
  trailingSlash: 'never',
  output: 'static',
  adapter: vercel(),
  integrations: [
    react(),
    sitemap({ filter: (page) => !/\/(thank-you|not-yet|404)$/.test(page.replace(/\/$/, '')) }),
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
