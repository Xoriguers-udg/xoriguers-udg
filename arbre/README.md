# The arbre de xoriguers

The interactive apadrinatge tree shown at `/arbre`. Two CSVs in, one
self-contained HTML page out.

```
arbre/xoriguers.csv    who is in the colla, and the season they joined
arbre/apadrinatge.csv  who apadrinà whom
arbre/template.html    the app: styles, layout code, exports. No data in it
arbre/build_tree.py    puts the data into the template
       ↓
public/arbre/index.html  the generated page, committed, served as /arbre/
```

## Updating the data

Edit the CSVs, then:

```bash
npm run build:arbre
```

That rewrites `public/arbre/app.html`. Commit both the CSVs and the generated
file — the build does not run the generator, so what is committed is what is
served. The script needs Python 3 and nothing else.

It prints the counts, and a warning for anything it could not use: a year that
is not a number, a person listed twice with different years, an apadrinatge
naming somebody who is not in `xoriguers.csv`, or a padrí who joined in the
same season as their fillol or later. Those rows are left out of the tree
rather than guessed at, and the app shows the same warnings under "Dades".

## It is served as itself, not framed

`/arbre/` is this file, full screen. The site links to it with `target="_blank"`
from the La colla menu, the footer and a card on *Qui som*, because the app has
no navigation of its own: opening it beside the site leaves a way back. If you
want it in the same tab instead, add a link home to `template.html` first.

It is deliberately *not* an Astro page: nothing on the site imports it, so it
can be regenerated wholesale without rebuilding anything else.

## It is also the site's design system

`src/styles/global.css` takes its palette and both its typefaces from the
`:root` block of `template.html`, and each token there names its counterpart
here. So a colour or a font changed in this file should be mirrored into
`global.css` — otherwise the tree and the rest of the site drift apart.

The site keeps two things the app has no use for: small uppercase labels with a
little tracking, for the metadata rows a twenty-page site needs and a
single-screen app does not, and `font-variant-numeric: tabular-nums` on the
dense columns of the historial.

## What it does not do yet

- **Layouts are per-visitor.** Dragging a node saves to that browser's
  `localStorage`, so everybody arrives at the same default arrangement and
  nobody can publish a tidied-up one. Changing that means building the positions
  into the file.
- **The fonts are now the site's too**, so changing them here means changing
  `global.css` and the font `<link>` in `src/layouts/Base.astro` as well — and
  within this file, both the `--font-display`/`--font-text` tokens and the
  `document.fonts.load(...)` call that node widths are measured after.
- **`any_estimat` in `xoriguers.csv` is not used.** Neither `build_tree.py` nor
  `template.html` reads that third column, so an estimated year is recorded but
  looks exactly like a known one in the tree.
- **Names are malnoms only**, with the season they joined — the same kind of
  thing the junta pages already publish. There is nothing in the file that is
  not already public elsewhere on the site, but it is worth knowing that the
  whole list ships inside `app.html` and anyone with the URL can read it.
