import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  integrations: [react()],
  // Old GHL-site paths that live Google Ads / indexed pages may still hit
  // once this funnel takes over lenderdscr.com.
  redirects: {
    '/dscr-loan-texas': '/',
    '/dscr-loan-texas-2': '/',
    '/dscr-loan-california': '/',
    '/home-2': '/',
    '/privacy-policy': '/privacy',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
