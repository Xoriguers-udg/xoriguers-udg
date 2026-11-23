import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/*
 * The arbre is a plain HTML file in public/arbre/, not an Astro page. GitHub
 * Pages serves /arbre/ as public/arbre/index.html on its own, but Astro's dev
 * server and `astro preview` do not look for an index.html inside public/, so
 * /arbre/ answered 404 locally. This points them at the file; the file itself
 * is untouched.
 */
const arbreIndex = {
  name: 'arbre-index',
  configureServer(server) {
    server.middlewares.use(rewriteArbre);
  },
  configurePreviewServer(server) {
    server.middlewares.use(rewriteArbre);
  },
};
function rewriteArbre(req, _res, next) {
  const [path, query] = (req.url ?? '').split('?');
  if (/^(\/xoriguers-udg)?\/arbre\/?$/.test(path)) {
    req.url = path.replace(/\/?$/, '/index.html') + (query ? `?${query}` : '');
  }
  next();
}

// GitHub Pages serves this project at /xoriguers-udg/ (it isn't the
// special <user>.github.io repo), so the base path only applies to the
// actual deploy — local dev keeps running at the root.
export default defineConfig({
  vite: { plugins: [arbreIndex] },
  site: 'https://xoriguers-udg.github.io',
  base: process.env.GITHUB_ACTIONS ? '/xoriguers-udg/' : '/',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
});
