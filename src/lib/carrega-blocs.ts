/**
 * The content loader for the new pages (src/content/pagines-noves). The
 * glob loader reads the files as usual; this renders the Markdown of each
 * block (`text`) to `html` as it goes, with Astro's own Markdown pipeline,
 * the one the pages' bodies already use.
 *
 * It wraps the store's `set` instead of post-processing once, so a file edited
 * while `astro dev` runs is rendered again too. The rendered entry carries a
 * digest of its own, so the store keeps it rather than skipping it as
 * unchanged.
 */
import type { Loader, LoaderContext } from 'astro/loaders';

type Entrada = Parameters<LoaderContext['store']['set']>[0];

export function ambBlocsRenderitzats(base: Loader): Loader {
  return {
    name: 'pagines-noves',
    load: async (context) => {
      const original = context.store;
      const pendents = new Set<Promise<unknown>>();

      const renderitza = async (entrada: Entrada) => {
        const dades = entrada.data as { blocs?: unknown };
        if (!Array.isArray(dades.blocs)) return;
        const blocs = await Promise.all(
          dades.blocs.map(async (b) =>
            b && typeof b === 'object' && typeof b.text === 'string' && b.text.trim()
              ? { ...b, html: (await context.renderMarkdown(b.text)).html }
              : b
          )
        );
        original.set({ ...entrada, data: { ...entrada.data, blocs }, digest: `${entrada.digest ?? ''}:blocs` });
      };

      const store = {
        ...original,
        set: (entrada: Entrada) => {
          const desat = original.set(entrada);
          if (desat !== false) {
            const p = renderitza(entrada).catch((e) => context.logger.warn(`${entrada.id}: ${e?.message ?? e}`));
            pendents.add(p);
            p.finally(() => pendents.delete(p));
          }
          return desat;
        },
      };

      // every file present is stored again on each load (its rendered digest
      // never matches the file's), so what this load did not store is gone. The
      // glob loader clears those itself, except when the folder is left with no
      // file at all: then it returns early and a deleted last page would stay
      const vistes = new Set<string>();
      const setOriginal = store.set;
      store.set = (entrada: Entrada) => {
        vistes.add(entrada.id);
        return setOriginal(entrada);
      };

      await base.load({ ...context, store });
      await Promise.all(pendents);
      for (const id of original.keys()) if (!vistes.has(id)) original.delete(id);
    },
  };
}
