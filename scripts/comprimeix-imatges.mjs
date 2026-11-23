/**
 * Shrinks the photos editors upload through the CMS, in place, keeping each
 * file's name and format so every path in the content stays valid.
 *
 *   node --experimental-strip-types scripts/comprimeix-imatges.mjs [folder] [--dry]
 *
 * It runs twice: in the deploy, before the build, so a photo is served small
 * from the first deploy after it is uploaded; and in the nightly job, which
 * commits the result so the repo and the CMS's media library stay light too.
 * Running it again over its own output does nothing: every file it writes is
 * marked (MARCA, in src/lib/compressio.ts) and a marked file is skipped. The
 * phone's EXIF, location included, does not survive the rewrite.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const { planifica, COSTAT_MAXIM, MARCA } = await import('../src/lib/compressio.ts');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const carpeta = args.find((a) => !a.startsWith('--')) ?? 'public/images/uploads';

const kb = (n) => `${Math.round(n / 1024)} KB`;
let abans = 0;
let despres = 0;
let fets = 0;

for (const nom of readdirSync(carpeta).sort()) {
  const cami = join(carpeta, nom);
  if (!statSync(cami).isFile() || !/\.(jpe?g|png|webp)$/i.test(nom)) continue;

  const original = readFileSync(cami);
  let meta;
  try {
    meta = await sharp(original).metadata();
  } catch {
    console.warn(`  no es pot llegir  ${nom}`);
    continue;
  }
  const marcada = meta.exif ? meta.exif.includes(Buffer.from(MARCA)) : false;
  const pla = planifica({ amplada: meta.width, alcada: meta.height, bytes: original.length, format: meta.format, marcada });
  if (!pla) continue;

  // rotate() first: it turns the pixels the way the phone's EXIF says, since the
  // metadata that says so does not survive the re-encode
  // withExif replaces the EXIF outright: the mark goes in, and the rest of what
  // a phone writes there, the GPS position among it, goes out
  let imatge = sharp(original).rotate().withExif({ IFD0: { Software: MARCA } });
  if (pla.redimensiona) {
    imatge = imatge.resize({ width: COSTAT_MAXIM, height: COSTAT_MAXIM, fit: 'inside', withoutEnlargement: true });
  }
  if (meta.format === 'jpeg') imatge = imatge.jpeg({ quality: 80, mozjpeg: true });
  else if (meta.format === 'png') imatge = imatge.png({ compressionLevel: 9, effort: 10 });
  else imatge = imatge.webp({ quality: 80 });

  const nou = await imatge.toBuffer();
  if (nou.length >= original.length) continue;

  if (!dry) writeFileSync(cami, nou);
  abans += original.length;
  despres += nou.length;
  fets++;
  console.log(`  comprimeix  ${nom}: ${kb(original.length)} → ${kb(nou.length)}`);
}

console.log(
  fets === 0
    ? 'Totes les imatges ja tenien bona mida.'
    : `${fets} imatge${fets === 1 ? '' : 's'}: ${kb(abans)} → ${kb(despres)}${dry ? ' (prova, sense escriure)' : ''}.`,
);
