/**
 * Brings the colla's Google Calendar into the agenda collection.
 *
 *   node scripts/import-calendar.mjs [--dry] [--url <ics> | --fitxer <file.ics>]
 *
 * The calendar owns when and where an event happens; everything an editor
 * records afterwards — the castells, the cartell, the observació, the estat —
 * belongs to the entry and is never touched here. The category follows the
 * words set in the CMS on every run, so changing them refiles the events
 * already imported, except one whose category was picked by hand
 * (tipusSincronitzat, src/lib/categories.ts). Repeating events (the weekly
 * assaig, and any one occurrence of it changed on its own) are skipped: the
 * agenda page already shows them through the embed.
 *
 * An upcoming event that disappears from the calendar is marked cancel·lada
 * rather than left on the site as if it were still on; if it comes back, the
 * next run un-cancels it, since cancelada is one of the calendar's fields.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

const { parseIcal } = await import('../src/lib/ical.ts');
const { separaLloc } = await import('../src/lib/esdeveniment.ts');
const { alHistorial, categoriaDe, llegeixCategories, tipusSincronitzat } = await import('../src/lib/categories.ts');
const { urlFeedIcal } = await import('../src/lib/calendari.ts');
const { diaAvui } = await import('../src/lib/format.ts');

const DEST = 'src/content/agenda';
const CONFIG = 'src/content/configuracio/general.md';
const CLASSIFICACIO = 'src/content/configuracio/calendari.md';

/** Fields the calendar is the authority on. Everything else is the editor's. */
const DEL_CALENDARI = ['nom', 'data', 'hora', 'lloc', 'poblacio', 'cancelada', 'calendarUid'];

const dry = process.argv.includes('--dry');
const arg = (nom) => (process.argv.includes(nom) ? process.argv[process.argv.indexOf(nom) + 1] : undefined);
const urlArg = arg('--url');
const fitxerArg = arg('--fitxer');

/** The embed URL already names the calendar, so derive the feed from it. */
function urlDelFeed() {
  if (urlArg) return urlArg;
  const config = readFileSync(CONFIG, 'utf8');
  const linia = config.match(/^googleCalendarEmbedUrl:\s*(.+)$/m);
  if (!linia) throw new Error(`No hi ha googleCalendarEmbedUrl a ${CONFIG}`);
  const feed = urlFeedIcal(linia[1].trim().replace(/^["']|["']$/g, ''));
  if (!feed) throw new Error("L'URL d'inserció no porta cap calendari");
  return feed;
}

/**
 * The agenda's categories as the colla set them in the CMS (Configuració →
 * Calendari): the words that give a new event its category, and which past
 * entries count as owing castells. Read leniently: this runs every hour
 * unattended, so what it cannot use is reported and skipped, and with no
 * usable category the built-in ones apply.
 */
function llegeixClassificacio() {
  const text = existsSync(CLASSIFICACIO) ? readFileSync(CLASSIFICACIO, 'utf8').replace(/\r\n/g, '\n') : '';
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const resultat = llegeixCategories(yaml.load(frontmatter));
  for (const avis of resultat.avisos) console.warn(`  avís (${CLASSIFICACIO}): ${avis}`);
  return resultat;
}
const classificacio = llegeixClassificacio();

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const yamlString = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

function valorYaml(camp, valor) {
  if (camp === 'data') return valor;
  if (camp === 'cancelada') return valor ? 'true' : 'false';
  return yamlString(valor);
}

/**
 * Replaces the calendar-owned lines and leaves the rest of the file alone.
 * Only column-0 keys are touched, so nested castells entries are safe. A field
 * the file does not have yet goes in after the calendar field before it
 * (poblacio after lloc), or at the end.
 *
 * Line endings are read as LF whatever the file has: a file saved with CRLF
 * never matched the frontmatter's `---` lines, and was rewritten on every run.
 */
function aplica(contingut, camps) {
  const parts = contingut.replace(/\r\n/g, '\n').split(/^---$/m);
  if (parts.length < 3) throw new Error('frontmatter inesperat');
  const linies = parts[1].replace(/^\n|\n$/g, '').split('\n');
  const posicio = (camp) => linies.findIndex((l) => l.startsWith(`${camp}:`));

  let anterior;
  for (const [camp, valor] of Object.entries(camps)) {
    if (valor !== undefined) {
      const linia = `${camp}: ${valorYaml(camp, valor)}`;
      const i = posicio(camp);
      if (i !== -1) linies[i] = linia;
      else {
        const despresDe = anterior ? posicio(anterior) : -1;
        if (despresDe === -1) linies.push(linia);
        else linies.splice(despresDe + 1, 0, linia);
      }
    }
    anterior = camp;
  }

  const cos = parts.slice(2).join('---');
  return `---\n${linies.join('\n')}\n---${cos}`;
}

/** A plain top-level field of the frontmatter, unquoted. */
function llegeixCamp(contingut, camp) {
  const m = contingut.match(new RegExp(`^${camp}:\\s*["']?([^"'\\n]+?)["']?\\s*$`, 'm'));
  return m ? m[1].trim() : null;
}
const llegeixUid = (contingut) => llegeixCamp(contingut, 'calendarUid');

/* ---------- read what is already there ---------- */
if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });
const fitxers = readdirSync(DEST).filter((f) => f.endsWith('.md'));
const perUid = new Map();
for (const f of fitxers) {
  const uid = llegeixUid(readFileSync(join(DEST, f), 'utf8'));
  if (uid) perUid.set(uid, f);
}

/* ---------- read the calendar ---------- */
let ics;
if (fitxerArg) {
  console.log(`fitxer  ${fitxerArg}`);
  ics = readFileSync(fitxerArg, 'utf8');
} else {
  const url = urlDelFeed();
  console.log(`feed  ${url}`);
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`El calendari ha respost ${resposta.status}`);
  ics = await resposta.text();
}
// a calendar that answers with an error page, or with nothing, must not read
// as "every event was deleted" and cancel the whole agenda
if (!/^BEGIN:VCALENDAR/m.test(ics) || !/^END:VCALENDAR/m.test(ics)) {
  throw new Error('La resposta no és un calendari sencer; no es toca res.');
}
const esdeveniments = parseIcal(ics);

const recurrents = esdeveniments.filter((e) => e.recurrent);
const puntuals = esdeveniments.filter((e) => !e.recurrent);
console.log(`llegits  ${esdeveniments.length} (${recurrents.length} repetits, s'ometen)`);

let creats = 0;
let actualitzats = 0;
let adoptats = 0;
let igual = 0;

for (const e of puntuals) {
  const { lloc, poblacio } = separaLloc(e.lloc);
  const camps = {
    nom: e.resum,
    data: e.data,
    hora: e.hora,
    lloc,
    poblacio,
    cancelada: e.cancellat,
    calendarUid: e.uid,
  };

  let fitxer = perUid.get(e.uid);
  let adoptat = false;

  // an event already in the registre has no UID yet: adopt it instead of
  // writing a second entry for the same day
  if (!fitxer) {
    const candidat = `${e.data}-${slugify(e.resum) || 'actuacio'}.md`;
    if (fitxers.includes(candidat)) {
      fitxer = candidat;
      adoptat = true;
    }
  }

  if (fitxer) {
    const cami = join(DEST, fitxer);
    const abans = readFileSync(cami, 'utf8');
    // the category follows the words, unless someone chose it in the CMS
    // (tipusSincronitzat, src/lib/categories.ts)
    const tipus = tipusSincronitzat(
      e.resum,
      { tipus: llegeixCamp(abans, 'tipus'), tipusCalendari: llegeixCamp(abans, 'tipusCalendari') },
      classificacio
    );
    const despres = aplica(abans, { ...camps, ...tipus });
    if (abans === despres) {
      igual++;
      continue;
    }
    if (!dry) writeFileSync(cami, despres, 'utf8');
    if (adoptat) {
      adoptats++;
      console.log(`  adopta      ${fitxer}`);
    } else {
      actualitzats++;
      console.log(`  actualitza  ${fitxer}`);
    }
    continue;
  }

  const nom = `${e.data}-${slugify(e.resum) || 'actuacio'}.md`;
  const { tipus: tipusNou } = tipusSincronitzat(e.resum, {}, classificacio);
  const linies = [
    '---',
    `nom: ${yamlString(e.resum)}`,
    `data: ${e.data}`,
    ...(e.hora ? [`hora: ${yamlString(e.hora)}`] : []),
    ...(lloc ? [`lloc: ${yamlString(lloc)}`] : []),
    ...(poblacio ? [`poblacio: ${yamlString(poblacio)}`] : []),
    `tipus: ${yamlString(tipusNou)}`,
    `tipusCalendari: ${yamlString(tipusNou)}`,
    'estat: publicat',
    `cancelada: ${e.cancellat ? 'true' : 'false'}`,
    `calendarUid: ${yamlString(e.uid)}`,
    '---',
    '',
  ];
  if (!dry) writeFileSync(join(DEST, nom), linies.join('\n'), 'utf8');
  fitxers.push(nom);
  creats++;
  console.log(`  crea        ${nom}`);
}

/* ---------- events that left the calendar ---------- */
// only upcoming ones: a past actuació keeps its record even if someone tidies
// the calendar up afterwards
// today in Girona: the job runs on UTC, which is still yesterday there before 1 or 2am
const avui = diaAvui();
const alCalendari = new Set(esdeveniments.map((e) => e.uid));
let cancellats = 0;
for (const [uid, fitxer] of perUid) {
  if (alCalendari.has(uid)) continue;
  const cami = join(DEST, fitxer);
  const abans = readFileSync(cami, 'utf8');
  const data = abans.match(/^data:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
  if (!data || data < avui) continue;
  const despres = aplica(abans, { cancelada: true });
  if (abans === despres) continue;
  if (!dry) writeFileSync(cami, despres, 'utf8');
  cancellats++;
  console.log(`  cancel·la   ${fitxer} (ja no és al calendari)`);
}

console.log(
  `\n${dry ? '[dry] ' : ''}creats ${creats} · actualitzats ${actualitzats} · adoptats ${adoptats} · cancel·lats ${cancellats} · sense canvis ${igual}`
);

/* ---------- what still needs recording ---------- */
const pendents = [];
for (const f of readdirSync(DEST).filter((x) => x.endsWith('.md'))) {
  const contingut = readFileSync(join(DEST, f), 'utf8');
  const data = contingut.match(/^data:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
  const tipus = llegeixCamp(contingut, 'tipus') ?? '';
  if (!data || data > avui) continue;
  if (/^castells:/m.test(contingut)) continue;
  // only what the historial always shows owes castells: an assaig with none is
  // just an assaig
  if (!alHistorial(categoriaDe(tipus, classificacio.categories), 0)) continue;
  pendents.push(`${data}  ${f}`);
}
if (pendents.length) {
  console.log(`\nactuacions passades sense castells registrats (${pendents.length}):`);
  for (const p of pendents.sort().slice(-10)) console.log(`  ${p}`);
  if (pendents.length > 10) console.log(`  … i ${pendents.length - 10} més`);
}
