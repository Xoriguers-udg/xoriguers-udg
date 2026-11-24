import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { teFitxa } from './src/lib/fitxa.ts';
import { paginesApagades } from './src/lib/estructura.ts';

/*
 * An agenda entry with nothing beyond its row has no page, only a redirect to
 * that row at its old address (src/lib/fitxa.ts). Those redirects stay out of
 * the sitemap: they would be 280-odd empty pages for search engines to skip.
 */
const AGENDA = 'src/content/agenda';
const senseFitxa = new Set(
  readdirSync(AGENDA)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => {
      const [, frontmatter = '', ...cos] = readFileSync(`${AGENDA}/${f}`, 'utf8').split(/^---\s*$/m);
      return !teFitxa({ body: cos.join('---'), data: yaml.load(frontmatter) ?? {} });
    })
    .map((f) => f.replace(/\.md$/, ''))
);

/*
 * A page switched off in Configuració → Estructura del web answers its address
 * with a redirect home (src/lib/carrega-estructura.ts): out of the sitemap too.
 */
const llegeixFrontmatter = (fitxer) => {
  try {
    return yaml.load(readFileSync(fitxer, 'utf8').split(/^---\s*$/m)[1] ?? '') ?? {};
  } catch {
    return {};
  }
};
const apagades = paginesApagades(llegeixFrontmatter('src/content/configuracio/estructura.md'));
const primerTram = (url) => new URL(url).pathname.replace(/^\/(xoriguers-udg\/)?/, '').split('/')[0];

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
      filter: (page) =>
        !page.includes('/admin') &&
        !apagades.has(primerTram(page)) &&
        !senseFitxa.has(page.match(/\/agenda\/([^/]+)\/?$/)?.[1]),
    }),
  ],
});
