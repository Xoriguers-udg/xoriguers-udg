# The CMS

Who edits this site, what they see, and how to change what they see.
[`public/admin/config.yml`](../public/admin/config.yml) is the whole of it:
twelve collections' worth of form definitions, no build step, no plugins.
The people who use it run the colla's comunicació; the guide written for them
is [`src/pages/admin/guia.astro`](../src/pages/admin/guia.astro), served at
`/admin/guia/` and linked from a yellow «Guia» button on every CMS screen.

## How it is wired

[Decap CMS](https://decapcms.org) is a single-page app loaded from a CDN by
[`src/pages/admin/index.astro`](../src/pages/admin/index.astro), pinned to an
exact version. It reads `config.yml`, renders a form per collection, and commits
the result straight to `main` as markdown. Authentication goes through
**DecapBridge** (`git-gateway`), so an editor signs in with an email and
password and never needs a GitHub account.

**There is no editorial workflow.** `publish_mode: editorial_workflow` was
removed on purpose: one or two people run this site and there is nobody to
review for. Save commits, and the commit deploys. The only visibility control is
the `estat` field — `publicat` (the default) or `esborrany`, which keeps an
entry out of the build entirely.

## What the editor sees

- **Catalan.** `locale: "ca"`. Decap's Catalan misses some strings ("Add
  castell", "Expand"), so [`admin/index.astro`](../src/pages/admin/index.astro)
  starts Decap by hand (`CMS_MANUAL_INIT`) and merges the missing ones into
  its locale first. Both Decap scripts must stay `is:inline`: without it Astro
  turns the CDN script into a deferred module and the merge runs before `CMS`
  exists.
- **A styled preview pane** on Agenda, Galeria, Notícies, Pàgines and the
  banners. [`public/admin/preview.js`](../public/admin/preview.js) registers a
  template per form, written with Decap's `h` so it needs no build, and
  [`src/pages/admin/preview.css.ts`](../src/pages/admin/preview.css.ts) serves
  the pane one stylesheet: the site's tokens, base and global CSS plus
  [`src/styles/preview.css`](../src/styles/preview.css), the few page styles
  that live in scoped `<style>` blocks. When a page's scoped styles change,
  change their copy in `preview.css` too. Decap matches a template by the
  collection's name for a folder and by the file's name for a file, which is
  why the banners' files are called `capcalera_*`: plain `agenda` would take
  the diada template. The other forms keep `editor: { preview: false }`;
  «Veure publicació» opens the real page through `site_url` plus each
  collection's `preview_path`.
- **Dates are `datetime` with `time_format: false` and `format: YYYY-MM-DD`.**
  Decap 3 removed the old `date` widget: a field still declared as `date` shows
  "No existeix un control per al widget 'date'" and cannot be edited at all.
  The `format` keeps files exactly as they were (`data: 2026-05-14`).
- **Newest first.** Agenda, Galeria and Notícies sort by `data` descending by
  default (`default_sort: "desc"`).
- **Safety.** `delete: false` on the agenda and both juntes; slugs are
  ASCII with accents cleaned, so a title never becomes a file name with a `ç`.
- **Every collection has a one-line `description`** at the top of its list,
  saying what it is for and where it shows. Treat these like the hints.

Galeria's photos stay a list of single images. The image widget's
`multiple: true` was tried: the default media library still uploads one file
at a time, and «Escull una imatge diferent» replaces the whole selection, so
adding one photo meant re-picking the album.

## Uploaded images

Editors upload photos straight from their phones.
[`scripts/comprimeix-imatges.mjs`](../scripts/comprimeix-imatges.mjs) shrinks
everything in `public/images/uploads` to 2000px on the longest side and
re-encodes it (JPEG at 80), keeping the name and format so no path changes. It
runs in two places:

- **the deploy**, before the build, so a new photo is served small from its
  first deploy;
- **the nightly calendar job**, which commits the result, so the repo and the
  CMS's media library stay light.

The rule is in [`src/lib/compressio.ts`](../src/lib/compressio.ts): an image is
left alone if it is already within 2000px and 500 KB, or if it carries the
script's mark in its EXIF «Software» tag. The mark is what keeps the nightly
run from re-encoding the same photo every night. Writing it replaces the
phone's EXIF, so the GPS position a phone stores goes with it. PDFs, GIFs and
SVGs are not touched.

Locally, `local_backend: true` makes Decap talk to `decap-server` instead of
DecapBridge, so `npm run dev:all` gives you the real CMS writing to your own
checkout. Decap only honours that when the page is opened from localhost, so it
is safe to leave on.

## The hazard: add every field in two places

**Decap drops fields its config does not declare.** When an editor saves a page,
Decap writes back the fields it knows about and nothing else — so a field that
exists in `content.config.ts` and in the page but not in `config.yml` is
silently deleted from the markdown the next time anybody saves that page. It has
happened twice in this repo, once taking out a whole block of content.

So, to add something editable:

1. add it to the Zod schema in [`src/content.config.ts`](../src/content.config.ts)
2. add it to the matching collection or file in `public/admin/config.yml`
3. use it in the page
4. commit all three together
5. **after deploying, reload `/admin` before saving anything** — a browser
   holding the old config will drop the new field on the first save

Prefer `required: false` plus a sensible default in the schema. An editor
hitting a validation error they do not understand will edit the file some other
way, or give up.

## What the collections are for

| In the CMS | Files | Notes |
|---|---|---|
| **Agenda** | `src/content/agenda/` | Every event, past and future. The one collection editors spend real time in. |
| **Notícies** | `src/content/noticies/` | The two most recent show on the homepage. With none published, Notícies is unlinked everywhere (nav, footer, homepage). |
| **Galeria** | `src/content/galeria/` | Albums. An album is listed once it has one uploaded photo; the newest with three or more goes on the homepage. |
| **Pàgines** | `src/content/pagines/` | A *file* collection, not a folder: one fixed form per page, so editors cannot create or delete pages. |
| **Capçaleres de les llistes** | `src/content/pagines/` too | The banner photo and intro of the list pages (Agenda, Historial, Galeria…). Same folder as Pàgines; a second file collection only so the sidebar separates real pages from banners. |
| **Junta Directiva / Tècnica** | `src/content/junta-*/` | One entry per season, numbered; the number is rendered as a Roman ordinal. |
| **Botiga: productes** | `src/content/productes/` | Sizes and stock per product. Reservations go to Configuració's contact email. |
| **Patrocinadors**, **Activitats**, **Documents** | | Sponsor logos, the social calendar shown on the homepage, and PDFs. |
| **Configuració** | `src/content/configuracio/general.md` | The one contact email (Contacta'ns and botiga reservations), social URLs, the Google Calendar URL, the default header image, the SEO description. |

Uploads go to `public/images/uploads` and are referenced as
`/images/uploads/…`; `mediaUrl()` prefixes the base path at render time, so a
stored path never contains it.

## The agenda list

With 284 entries and Catalan field names, the default Decap list was unusable —
it only infers sorting for fields called `title`, `date`, `author` or
`description`. So the agenda collection declares its own:

- `summary: "{{data}} · {{nom}}"` so each row reads as a date and a name
- `sortable_fields: [data, nom, tipus]`
- `view_groups`: by **Any** (a `\d{4}` pattern over `data`) and by **Tipus**
- `view_filters`: Actuacions, Diades, Assajos, and entries with an observació

If an editor says they cannot find a diada, that list is where to look.

## Fields the editor should leave alone

Three agenda fields belong to the machine, and their hints say so (they start
with «No cal tocar-ho», which is also how the guide tells editors to spot them):

- **`calendarUid`** — the join key the nightly import matches on. Changing it
  duplicates the event.
- **`notacioOriginal`** — the castells as the old registre wrote them.
- `nom`, `data`, `hora`, `lloc`, `poblacio`, `cancelada` — editable, but the
  nightly import overwrites them from Google Calendar, and their hints now say
  so. The calendar is where to change them.

Everything else on an agenda entry is the editor's and is never touched by the
importer. See [architecture.md](architecture.md#the-calendar-importer).

## Writing hints

The hints are the documentation for people who will never read this file, so
they are worth as much care as the code:

- say what the field *does on the page*, not what type it is
- give the default when there is one ("Per defecte: 'Vine a assajar'")
- say when a field is read somewhere else — the assaig blocks on Uneix-te are
  also shown on La colla and on Xorimúsics, and an editor cannot guess that
- keep them in Catalan, like everything else an editor sees

When you change how a field is used, change its hint in the same commit. Three
hints in this file were describing an arrangement the site had grown out of.
