export function mediaUrl(base: string, path?: string): string | undefined {
  if (!path) return undefined;
  return `${base}${path.replace(/^\/+/, '')}`;
}

export function isUploadedPath(path: string | undefined | null): boolean {
  return typeof path === 'string' && path.startsWith('/');
}

export interface FotoAlbum {
  foto: string;
  peu?: string;
}

/**
 * An album's photos as { foto, peu }, whatever shape they were saved in: a
 * plain path (albums saved before captions existed, or a content cache that
 * still holds them that way) or { foto, peu } from the CMS. Anything without a
 * photo is left out.
 */
export function fotosAlbum(fotos: unknown): FotoAlbum[] {
  if (!Array.isArray(fotos)) return [];
  return fotos.flatMap((f): FotoAlbum[] => {
    if (typeof f === 'string') return f ? [{ foto: f }] : [];
    if (f && typeof f === 'object' && typeof (f as FotoAlbum).foto === 'string' && (f as FotoAlbum).foto) {
      const peu = typeof (f as FotoAlbum).peu === 'string' ? (f as FotoAlbum).peu!.trim() : '';
      return [{ foto: (f as FotoAlbum).foto, ...(peu ? { peu } : {}) }];
    }
    return [];
  });
}
