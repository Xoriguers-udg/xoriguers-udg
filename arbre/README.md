# The arbre de xoriguers

The interactive apadrinatge tree shown at `/arbre`. Two CSVs in, one
self-contained HTML page out.

```
arbre/xoriguers.csv    who is in the colla, and the season they joined
arbre/apadrinatge.csv  who apadrinà whom
arbre/template.html    the app: styles, layout code, exports. No data in it
arbre/build_tree.py    puts the data into the template
       ↓
public/arbre/app.html  the generated page, committed, served as a static file
src/pages/arbre.astro  the site page that frames it
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

## Why it is framed rather than built into the site

The app is a page, not a component: it styles `body`, `button` and `input`
directly, and sets `height: 100dvh`. Inlining it would restyle the site around
it, and the site's own styles would reach into the tree. An iframe is the
boundary, and it also means the app can be opened on its own — which the page
offers a button for, because scrolling over the tree pans the tree and on a
phone that is easy to get stuck in.

It is deliberately *not* an Astro page template: nothing on the site imports it,
so it can be regenerated wholesale without a rebuild of anything else.

## What it does not do yet

- **Layouts are per-visitor.** Dragging a node saves to that browser's
  `localStorage`, so everybody arrives at the same default arrangement and
  nobody can publish a tidied-up one. Changing that means building the positions
  into the file.
- **The fonts are its own** (Bricolage Grotesque and Figtree, from Google
  Fonts) rather than the site's. Matching them means editing `template.html` in
  two places: the `--font-display`/`--font-text` tokens and the
  `document.fonts.load(...)` call that node widths are measured after.
- **Names are malnoms only**, with the season they joined — the same kind of
  thing the junta pages already publish. There is nothing in the file that is
  not already public elsewhere on the site, but it is worth knowing that the
  whole list ships inside `app.html` and anyone with the URL can read it.
