# Architecture

How the pieces fit together, and why. Start with the
[README](../README.md) for setup; this document is for when you need to change
something structural.

## The one idea

The colla's events used to exist in three unconnected places: the Google
Calendar they actually schedule in, a handful of agenda entries on the site, and
a spreadsheet of historical diades. The same actuació got typed up to three
times, and "what we are doing" lived apart from "what we did".

Now there is **one entry per event, for its whole life**:

```
Google Calendar          an event is created: "ACTUACIÓ Barraques"
      │
      │  hourly workflow, scripts/import-calendar.mjs
      ▼
src/content/agenda/2026-10-29-actuacio-barraques.md
      │
      ├── while the date is in the future  →  /agenda,  and the homepage
      │
      ├── someone records the castells in /admin after it happens
      │
      └── once the date has passed        →  /castells (the archive)
```

An entry has a page of its own, `/agenda/<id>`, only when it holds something its
row cannot show: a photo of a castell, a poster, a text or the colles that took
part (`src/lib/fitxa.ts`, `teFitxa`). Its rows are then links. Every other entry
is a plain row, and its address keeps answering with a tiny redirect to that row
(`/castells#d-<id>` or `/agenda#e-<id>`; the historial opens the season), so
links shared before and the CMS's «Veure a la web» still land. The redirects are
`noindex` and `astro.config.mjs` keeps them out of the sitemap. Today that is 2
pages out of 285; adding a photo in the CMS makes a diada's row clickable on the
next publish.

`/agenda` and `/castells` are two queries over the same collection, split by
date. Nothing is copied between them, so nothing can disagree.

A consequence worth remembering: **the archive changes without anybody editing
anything**, simply because a date passes. That is why the calendar sync also starts
a deploy once a day even when nothing changed — otherwise a diada could sit in
"upcoming" after it happened.

## Content collections

All of them are defined in [`src/content.config.ts`](../src/content.config.ts),
loaded from markdown with Astro's `glob` loader, and validated by Zod at build
time. A schema error fails the build, which is deliberate: bad content should
never reach the site.

| Collection | Files | What it is |
|---|---:|---|
| `agenda` | 284 | Every event, past and future: 154 diades, 127 actuacions, a trobada or two. The archive and the agenda both read it. |
| `pagines` | 15 | One file per page, for the editable parts of pages that are not lists. Also the page headers (`agenda.md`, `galeria.md`, …). |
| `noticies` | 2 | News items. The two most recent appear on the homepage. |
| `galeria` | 2 | Photo albums. |
| `activitats` | 4 | The colla's social life — Oktoberfest, Barraques, Calçotada, Aniverfest — shown on the homepage. |
| `junta-directiva`, `junta-tecnica` | 3 + 3 | One file per season, each with its members. |
| `productes` | 4 | Merchandising, with sizes and stock. |
| `patrocinadors` | 2 | Sponsor logos. |
| `documents` | 4 | PDFs: statutes, internal rules, protocols. |
| `configuracio` | 1 | Site-wide settings: social URLs, the calendar URL, the default header image, the SEO description. |

### The agenda entry

The fields that matter, and who owns them:

| Field | Owner | Notes |
|---|---|---|
| `nom`, `data`, `hora`, `lloc`, `poblacio`, `cancelada`, `calendarUid` | **the importer** | Overwritten on every sync run (hourly) when the calendar has a value for them. Editing them by hand is pointless; change the Google Calendar instead. |
| `castells[]`, `cartell`, `observacio`, `mostrarPortada`, `estat`, `collesParticipants`, body | **the editor** | The importer never touches these. |
| `tipus` | importer at creation, editor afterwards | Guessed from the name by `classificaEsdeveniment`. |
| `notacioOriginal`, `cccc` | the migration | Provenance from the old spreadsheet. |

`hora`, `lloc` and `poblacio` are **optional**, because the 282 migrated
historical entries have none and an all-day calendar event has no time. Guard
them in any page you write; `detallsEsdeveniment()` already does.

`temporada` is deliberately **not stored**. It is derived from `data` by
`temporadaDe()`, because a stored season is a second copy of the same fact and
the spreadsheet proved it drifts — two of its rows contradicted their own season
column.

## The libraries

Everything in [`src/lib`](../src/lib) is a plain module with a `.test.ts` beside
it. No framework, no mocks, 150-odd tests, under a second to run. Pages do the
reading and the rendering; the libraries hold anything worth testing.

| Module | Purpose |
|---|---|
| `historial.ts` | The castells domain: parse a castell, score it, group by gamma. See [castells.md](castells.md). |
| `registre-csv.ts` | Reads the old spreadsheet. **Migration only** — nothing in `src/pages` imports it. |
| `ical.ts` | A small RFC 5545 reader: enough for this one feed, not a general parser. Unfolds lines, handles the three `DTSTART` forms, flags recurring events. |
| `calendari.ts` | Everything derived from the single calendar URL in Configuració: the ICS feed, and the month embed with Google's chrome stripped off. |
| `esdeveniment.ts` | `classificaEsdeveniment` (name → type), `temporadaDe` (date → season), and the one-line "12:00 · Plaça del Vi, Girona". |
| `format.ts` | Catalan date formats. `formatDateNumeric` is pinned to UTC so a date cannot slip a day depending on where the site is built. |
| `media.ts`, `config.ts` | Turn a stored path into a URL under the right base; tell a real URL from a `[PLACEHOLDER]`. |
| `mailto.ts`, `roman-ordinal.ts` | A merchandising reservation link; `29` → `XXIXè`. |
| `estructura.ts` | The site's structure from Configuració → Estructura del web: which pages are on, and the one menu list the bar, its dropdown, the phone menu and the footer are drawn from. See *Structure* below. |
| `portada.ts` | The homepage's sections from Pàgines → Inici: order, checkbox and heading per section, and which ones share a row. |
| `xarxes.ts` | The social networks, a list of name and URL; finds Instagram among them. |

## The calendar importer

[`scripts/import-calendar.mjs`](../scripts/import-calendar.mjs), run every hour
at `:23` by [`import-calendar.yml`](../.github/workflows/import-calendar.yml),
or by hand with `npm run import:calendar` (`--dry` to see what it would do,
`--fitxer <file.ics>` to read a saved feed instead of Google's).

It reads the public ICS feed — derived from the embed URL already in
Configuració, so there is only ever one calendar address to keep right, and no
credentials anywhere — and then, for each event:

1. **Recurring events are skipped.** The weekly assaig is an `RRULE`; expanding
   it would create an entry every Tuesday and Thursday forever. The agenda page
   shows them through the embedded calendar instead. One occurrence changed on
   its own (one Thursday moved or cancelled) arrives as a separate event with
   the series' UID and a `RECURRENCE-ID`; it is skipped with the series, or it
   would become an agenda entry that every other exception then overwrote.
2. It finds the existing entry by `calendarUid`, or adopts a file whose name
   already matches the date and slug (this is how historical entries get joined
   to their calendar event rather than duplicated).
3. It rewrites **only** the calendar-owned lines, by key, at column 0. Nested
   `castells:` entries are untouched by construction. A Google Maps address
   («Carrer de les Hortes, 17001 Girona, Espanya») is split into `lloc` and
   `poblacio` by its postcode (`separaLloc`); a place typed by hand stays whole.
4. An **upcoming** entry whose event is no longer in the feed is marked
   `cancelada: true`; if the event comes back, the next run sets it false again.
   Past entries are never touched this way: tidying up the calendar must not
   rewrite the record. A response that is not a whole `VCALENDAR` stops the run
   before anything is written, so an outage cannot read as "everything was
   deleted".
5. Every calendar entry takes its `tipus` from the event's name, by the words
   of the colla's categories (see *Categories* below): first category with a
   word in the name wins, case and accents ignored, a word matching where a
   word of the name starts (`classificaEsdeveniment`). This is redone on every
   run, so editing the words refiles the events already imported. The sync
   notes what it gave in `tipusCalendari` (a hidden CMS field); an entry whose
   `tipus` no longer equals that note was set by hand in the CMS and is left
   alone (`tipusSincronitzat`). Entries without a `calendarUid`, the whole
   migrated registre, are never classified.
6. It prints past actuacions with no castells recorded — the "needs writing up"
   queue.

The ownership rule in step 3 is the whole safety of the thing. An hourly job
with write access to the colla's permanent record has to be unable to erase it.
If you extend the importer, extend `DEL_CALENDARI` consciously.

Operational notes, all learned the hard way:

- **It runs hourly, not nightly.** It ran once a day at 04:23 UTC, but GitHub
  starts scheduled jobs late when it is busy — that run actually started
  between 11:00 and 13:40 — and sometimes not at all: on the day the repo moved
  to the colla's account it never ran, and an actuació added on a Saturday
  evening was still missing on Monday afternoon. Hourly, a late or dropped run
  is covered by the next.
- The cron is at `:23`, not on the hour. GitHub queues every cron that lands on
  `:00` and silently drops what it cannot get to.
- A push made with the default `GITHUB_TOKEN` does not trigger other workflows,
  but a `workflow_dispatch` does. So the sync starts `deploy.yml` itself
  (`gh workflow run`, which is why it has `actions: write`): when it committed
  something, and otherwise on its first run of the day in Girona time, so the
  agenda/historial split follows the date. That last step runs even when the
  import fails.
- It `git pull --rebase`s before pushing: an editor may have saved from the
  CMS since the checkout, and with hourly runs that will happen.
- GitHub switches scheduled workflows off after 60 days without a commit. The
  bot only commits when something changes, so after 50 quiet days it makes an
  empty commit to keep the schedule on through the summer.

## Categories

An agenda entry's `tipus` is the `clau` of one of the colla's categories,
defined in the CMS (Configuració → «Calendari: categories», stored in
`src/content/configuracio/calendari.md`) and read through
[`src/lib/categories.ts`](../src/lib/categories.ts). Each category has a
name, a key, the words that classify calendar events into it, a pill colour,
whether it is listed as upcoming (`agenda`), and whether past entries belong to
the historial (`historial`: `sempre`, `ambCastells`, `mai`). The historial rule
also decides whose castells count for «Últims castells» and «Els nostres
millors castells», and which past entries the importer lists as owing castells.

Entries store the key, not the name, so a category can be renamed freely; the
CMS's Tipus field is a relation to the list, showing names and storing keys.
`llegeixCategories` is deliberately lenient (a half-filled category gets
defaults, a repeated key is skipped, an empty list falls back to
`CATEGORIES_PER_DEFECTE`, which is what the site did before), and
`categoriaDe` shows an entry whose category was deleted under its own key
rather than dropping it. `categories.ts` imports with `.ts` extensions because
the importer runs it directly in Node; pages load it through
`carrega-categories.ts`, which is the only part that needs `astro:content`.

## Structure

What a future editor is most likely to want to change without a developer:
the menus, which pages exist, and the homepage's arrangement. All of it is
data, read leniently, with defaults equal to the site as it was built, so a
missing or half-filled form never breaks the build.

- **Pages on and off** (`estructura.md`, `apagades`). The form ticks the pages
  to switch *off*: Decap shows a checkbox it has no value for as unticked, so
  a page added later, or the form opened before its file exists, must read as
  on, or one save would switch the site off. A page switched off is
  dropped from every menu and from every link that points at it
  (`carregaEstructura().enllac(clau)` is `undefined`, and each link asks);
  its address answers with a `noindex` redirect home (`siApagada`), routes
  with many pages (an album, a product, a notícia) build none, and
  `astro.config.mjs` leaves it out of the sitemap. Its content is untouched.
  Notícies with nothing published counts as *empty*: built, but unlinked.
- **Menus** (`estructura.md`, `menu`). One ordered list. Each entry has a
  destination (a page, the homepage, a path on the site or an outside URL,
  which opens in a new tab), a place in the header (bar, dropdown group one or
  two, the yellow button, or none) and a footer column. The dropdown sits in
  the bar where its first entry is; it opens towards the page when it is
  last. An entry pointing at a page that is off shows nowhere.
- **Homepage** (`pagines/inici.md`, `seccions`). A list of rows (section,
  «Amaga-la», heading) in page order; hide-not-show for the same reason. Qui som and Pròximes actuacions share a row
  when adjacent. The two hero buttons have their text and page. Sections that
  depend on a page (Notícies, the album strip) go when it is off.
- **Social networks** (`general.md`, `xarxes`). A list; the footer shows them
  in order. The four fixed URL fields they replaced are still read.

The only fixed points are the page templates themselves: new kinds of page
still need code.

## The arbre de xoriguers

`/arbre/` is the one page the site does not render. The interactive apadrinatge
tree is a self-contained HTML app, generated from two CSVs by a Python script
and committed to `public/arbre/index.html`, which Astro copies to `dist`
verbatim. There is no Astro page for it and nothing frames it: the URL serves
the app itself, full screen.

Nothing links to it: it is an easter egg. Three taps in a row on the escut in
the footer open it in a new tab (the inline script at the end of
`src/layouts/Base.astro`), because the app has no navigation of its own — it
opens beside the site rather than replacing it.

**The site's design system comes from this app.** Its two faces and its palette
are the source for `src/styles/global.css`, so the tree and the site read as one
thing. Changing a colour or a face should start in `arbre/template.html` and
then be mirrored into `global.css`, where each token names its counterpart.

Updating the data is `npm run build:arbre`, which needs Python 3. The generated
file is committed, so the site build never runs the generator. See
[`arbre/README.md`](../arbre/README.md).

## Build and deploy

`astro.config.mjs` sets `base` to `/xoriguers-udg/` when `GITHUB_ACTIONS` is
set, and `/` otherwise, because the site is not served from the root of
`xoriguers-udg.github.io`. **Every internal link must be built from
`import.meta.env.BASE_URL`.** A bare `href="/agenda"` works locally and 404s in
production, which is the single easiest mistake to make here.

Output is fully static — 307 pages, no server, no client framework. The only
JavaScript shipped to the browser is the archive's tab/sort/filter behaviour and
the merchandising size picker, both written as progressive enhancement: the
archive renders every row server-side and a `<noscript>` block unhides the
panels, so it works with scripts off.

`deploy.yml` runs on every push to `main`, after the calendar sync, or by hand.
It installs, **runs the tests**, builds, and publishes to GitHub Pages. An
editor pressing Save in the CMS commits to `main`, so their Save is a deploy
that takes a couple of minutes.

## The migration, for the record

The 282 historical diades came from `src/data/historial_castells.csv`, the
colla's own registre. [`scripts/migrate-historial.mjs`](../scripts/migrate-historial.mjs)
converted it in commit `8b4f2cd` (24 September 2026) and the CSV was removed in
the same commit. To get it back:

```bash
git show 2c57ebc:src/data/historial_castells.csv > historial_castells.csv
```

The migration refused to invent anything. Rows whose date was unusable or
impossible — including an `Actuació RESA` with five castells recorded — were
**not** migrated rather than being given a guessed date; four rows remain in the
CSV and not on the site. See [open-questions.md](open-questions.md).

The parser is lossy on a few prose tokens, so each migrated entry keeps
`notacioOriginal`: the castells exactly as the registre wrote them, shown at the
bottom of the diada's page.
