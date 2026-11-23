/**
 * The agenda's categories for a page to use, read from the CMS file. Separate
 * from categories.ts because astro:content only exists inside the build, and
 * the calendar importer reads categories.ts directly in Node.
 */
import { getEntry } from 'astro:content';
import { llegeixCategories } from './categories';

export async function carregaCategories() {
  return llegeixCategories((await getEntry('configuracio', 'calendari'))?.data);
}
