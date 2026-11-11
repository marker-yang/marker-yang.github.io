import { defineConfig } from 'astro/config';

// Set SITE_URL at build time once a real address exists (e.g. the
// Cloudflare Pages URL or a custom domain). Until then the canonical and
// OG image tags fall back to the current origin.
const site = process.env.SITE_URL;

export default defineConfig({
  ...(site ? { site } : {}),
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
});
