/**
 * The stylesheet the CMS preview pane loads, built from the very files the site
 * uses: tokens, base and global styles, the banner, each previewed page's own
 * stylesheet, the new pages' blocks, and last the few rules that belong to
 * the preview alone (src/styles/preview.css). A colour, a size or a layout
 * changed on the site changes in the preview too; there is no copy to update.
 */
import tokens from '../../styles/tokens.css?raw';
import baseCss from '../../styles/base.css?raw';
import globalCss from '../../styles/global.css?raw';
import capcaleraCss from '../../styles/capcalera.css?raw';
import blocsCss from '../../styles/blocs.css?raw';
import previewCss from '../../styles/preview.css?raw';

// each page with a preview of its own keeps its styles in src/styles/pagines,
// loaded by the page and here alike
const pagines = Object.values(
  import.meta.glob('../../styles/pagines/*.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
);

export const prerender = true;

// global.css pulls the other two in with @import; here they are inlined instead
const senseImports = (css: string) => css.replace(/^@import[^;]*;[ \t]*$/gm, '');

export function GET() {
  return new Response([tokens, baseCss, senseImports(globalCss), capcaleraCss, ...pagines, blocsCss, previewCss].join('\n\n'), {
    headers: { 'Content-Type': 'text/css; charset=utf-8' },
  });
}
