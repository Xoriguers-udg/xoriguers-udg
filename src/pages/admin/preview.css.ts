/**
 * The stylesheet the CMS preview pane loads: the site's own tokens, base and
 * global styles, then the few page styles that live in scoped <style> blocks
 * (src/styles/preview.css). Built from the same files the site uses, so a
 * colour or a size changed there changes in the preview too.
 */
import tokens from '../../styles/tokens.css?raw';
import baseCss from '../../styles/base.css?raw';
import globalCss from '../../styles/global.css?raw';
import previewCss from '../../styles/preview.css?raw';

export const prerender = true;

// global.css pulls the other two in with @import; here they are inlined instead
const senseImports = (css: string) => css.replace(/^@import[^;]*;[ \t]*$/gm, '');

export function GET() {
  return new Response([tokens, baseCss, senseImports(globalCss), previewCss].join('\n\n'), {
    headers: { 'Content-Type': 'text/css; charset=utf-8' },
  });
}
