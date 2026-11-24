/**
 * Every shape of content on the site. This is the closest thing the project has
 * to a database schema, and the first file to read.
 *
 * Field names are Catalan because they are what the CMS shows; the collections
 * are the folders under `src/content`. A schema error fails the build on
 * purpose: bad content should never reach the site.
 *
 * Whatever you add here, add to `public/admin/config.yml` in the same commit —
 * Decap silently drops any field its own config does not declare. See
 * `docs/cms.md`.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { COLORS, HISTORIAL } from './lib/categories.ts';

/** The CMS writes "" for a cleared field; the schemas want it to be absent. */
const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

/**
 * Whether an entry is built into the site at all. There is no review step —
 * esborrany simply keeps something off the site until it is ready.
 */
const estat = z.enum(['esborrany', 'publicat']).default('publicat');

const castellFet = z.object({
  castell: z.string(),
  estat: z.enum(['descarregat', 'carregat', 'intent']),
  ronda: z.preprocess(emptyToUndefined, z.number().optional()),
  foto: z.string().optional(),
});

const agenda = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/agenda' }),
  schema: z.object({
    nom: z.string(),
    data: z.coerce.date(),
    // optional because migrated history carries none and calendar events only
    // have them once someone fills the location in
    hora: z.preprocess(emptyToUndefined, z.string().optional()),
    lloc: z.preprocess(emptyToUndefined, z.string().optional()),
    poblacio: z.preprocess(emptyToUndefined, z.string().optional()),
    /** a category's clau, as defined in Configuració → Calendari (src/lib/categories.ts) */
    tipus: z.string(),
    /** the category the calendar sync last gave it; see tipusSincronitzat */
    tipusCalendari: z.preprocess(emptyToUndefined, z.string().optional()),
    cartell: z.string().optional(),
    collesParticipants: z.array(z.string()).default([]),
    mostrarPortada: z.boolean().default(false),
    estat,
    cancelada: z.boolean().default(false),
    castells: z.array(castellFet).default([]),
    /** Milestone notes from the registre: "Primer 5d7 de la historia". */
    observacio: z.preprocess(emptyToUndefined, z.string().optional()),
    /** The castells exactly as the registre wrote them, kept for provenance. */
    notacioOriginal: z.preprocess(emptyToUndefined, z.string().optional()),
    cccc: z.boolean().default(false),
    /** Join key for the calendar importer. Left alone by editors. */
    calendarUid: z.preprocess(emptyToUndefined, z.string().optional()),
  }),
});

const noticies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/noticies' }),
  schema: z.object({
    titol: z.string(),
    data: z.coerce.date(),
    resum: z.string(),
    imatge: z.string().optional(),
    estat,
  }),
});

const galeria = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/galeria' }),
  schema: z.object({
    nom: z.string(),
    data: z.coerce.date(),
    portada: z.string().optional(),
    fotos: z.array(z.string()).default([]),
    estat,
  }),
});

/** One block on Uneix-te: who assaja, when, and where, with its own map. */
const assaig = z.object({
  titol: z.string(),
  text: z.preprocess(emptyToUndefined, z.string().optional()),
  /** Coordinates "lat,long" or a place name — either works as a map query. */
  ubicacio: z.preprocess(emptyToUndefined, z.string().optional()),
  /** Lets another page point at one block, e.g. Xorimúsics at "musics". */
  clau: z.preprocess(emptyToUndefined, z.string().optional()),
  fotos: z.array(z.string()).default([]),
});

/** The university course, whose facts are a label/value list so they can be
 *  corrected or added to without touching the page. */
const curs = z.object({
  titol: z.preprocess(emptyToUndefined, z.string().optional()),
  text: z.preprocess(emptyToUndefined, z.string().optional()),
  dades: z
    .array(z.object({ etiqueta: z.string(), valor: z.string() }))
    .default([]),
});

const pagines = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pagines' }),
  schema: z.object({
    titol: z.string().optional(),
    curs: curs.optional(),
    imatge: z.string().optional(),
    /** The whole colla in one photo: on La colla, and beside the call to join on the homepage. */
    fotoColla: z.string().optional(),
    ctaText: z.string().optional(),
    /** Headings on the homepage's two columns, both editable. */
    presentacioTitol: z.preprocess(emptyToUndefined, z.string().optional()),
    properesTitol: z.preprocess(emptyToUndefined, z.string().optional()),
    /**
     * Inici: the homepage's sections, in order, each with a checkbox and a
     * heading. Loose here and read through llegeixSeccions
     * (src/lib/portada.ts), which also reads the first form of it, an object
     * of checkboxes.
     */
    seccions: z.unknown().optional(),
    /** Inici: where the hero's two buttons go (a page's key), and the second one's text */
    ctaPagina: z.preprocess(emptyToUndefined, z.string().optional()),
    boto2Text: z.preprocess(emptyToUndefined, z.string().optional()),
    boto2Pagina: z.preprocess(emptyToUndefined, z.string().optional()),
    assajos: z.array(assaig).default([]),
    contacteInstagram: z.string().optional(),
    /** Xorimúsics: the sheet music for the tocs, one PDF each. */
    partitures: z
      .array(
        z.object({
          titol: z.string(),
          instrument: z.preprocess(emptyToUndefined, z.enum(['Gralla', 'Tabal', 'Gralla i tabal']).optional()),
          fitxer: z.string(),
        })
      )
      .default([]),
  }),
});

const membreJunta = z.object({
  carrec: z.string(),
  nom: z.string(),
  cognom: z.string(),
  malnom: z.string().optional(),
  foto: z.string().optional(),
});

const juntaTemporadaSchema = z.object({
  numeroTemporada: z.preprocess(emptyToUndefined, z.number()),
  membres: z.array(membreJunta).default([]),
});

const juntaDirectiva = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/junta-directiva' }),
  schema: juntaTemporadaSchema,
});

const juntaTecnica = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/junta-tecnica' }),
  schema: juntaTemporadaSchema,
});

const tallaEstoc = z.object({
  talla: z.string(),
  estoc: z.preprocess(emptyToUndefined, z.number().default(0)),
});

const productes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/productes' }),
  schema: z.object({
    nom: z.string(),
    preu: z.preprocess(emptyToUndefined, z.number()),
    categoria: z.enum(['Roba', 'Dessuadora', 'Complements']),
    estat: z.enum(['Disponible', 'Fora de termini']).default('Disponible'),
    fotos: z.array(z.string()).default([]),
    talles: z.array(tallaEstoc).default([]),
    ordre: z.preprocess(emptyToUndefined, z.number().default(0)),
  }),
});

const patrocinadors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/patrocinadors' }),
  schema: z.object({
    nom: z.string(),
    logo: z.string().optional(),
    url: z.string().optional(),
    ordre: z.preprocess(emptyToUndefined, z.number().default(0)),
  }),
});

/** The colla's social life: Oktoberfest, Barraques, Calçotada, Aniverfest. */
const activitats = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/activitats' }),
  schema: z.object({
    nom: z.string(),
    quan: z.preprocess(emptyToUndefined, z.string().optional()),
    imatge: z.string().optional(),
    ordre: z.preprocess(emptyToUndefined, z.number().default(0)),
  }),
});

const documents = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/documents' }),
  schema: z.object({
    titol: z.string(),
    categoria: z.enum(['Estatuts', 'Reglament', 'Protocol', 'Altres']),
    fitxer: z.string(),
    data: z.coerce.date().optional(),
  }),
});

const configuracio = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/configuracio' }),
  schema: z.object({
    /** general.md: the social networks, in the footer's order (src/lib/xarxes.ts) */
    xarxes: z
      .array(z.object({ nom: z.string().nullish(), url: z.string().nullish() }))
      .optional(),
    // the four fixed fields the networks were before the list; still read
    instagramUrl: z.string().optional(),
    youtubeUrl: z.string().optional(),
    facebookUrl: z.string().optional(),
    twitterUrl: z.string().optional(),
    googleCalendarEmbedUrl: z.string().optional(),
    contacteComercialEmail: z.string().optional(),
    capceleraImatge: z.string().optional(),
    descripcioGeneral: z.string().optional(),
    /**
     * calendari.md: the agenda's categories, in order, with how each behaves
     * on the site and the words that classify calendar events into it. Kept
     * loose here on purpose and read through llegeixCategories
     * (src/lib/categories.ts), which fills in what a half-edited category
     * lacks instead of failing the build.
     */
    categories: z
      .array(
        z.object({
          nom: z.preprocess(emptyToUndefined, z.string().optional()),
          clau: z.preprocess(emptyToUndefined, z.string().optional()),
          // one line separated by commas, as the CMS writes it; see llegeixParaules
          paraules: z.union([z.string(), z.array(z.string())]).nullish(),
          color: z.preprocess(emptyToUndefined, z.enum(COLORS).optional()),
          agenda: z.boolean().optional(),
          historial: z.preprocess(emptyToUndefined, z.enum(HISTORIAL).optional()),
        }),
      )
      .optional(),
    tipusPerDefecte: z.preprocess(emptyToUndefined, z.string().optional()),
    /**
     * estructura.md: which pages are on, the menu entries and the group
     * names. Loose here and read through resolEstructura
     * (src/lib/estructura.ts), which fills in what is missing.
     */
    apagades: z.record(z.string(), z.boolean().nullish()).optional(),
    menu: z.array(z.record(z.string(), z.unknown())).optional(),
    noms: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const collections = {
  agenda,
  noticies,
  galeria,
  pagines,
  juntaDirectiva,
  juntaTecnica,
  productes,
  patrocinadors,
  activitats,
  documents,
  configuracio,
};
