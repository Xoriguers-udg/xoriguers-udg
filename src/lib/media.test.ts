import { describe, it, expect } from 'vitest';
import { mediaUrl, isUploadedPath, fotosAlbum } from './media';

describe('mediaUrl', () => {
  it('returns undefined when there is no path', () => {
    expect(mediaUrl('/xoriguers-udg/', undefined)).toBeUndefined();
    expect(mediaUrl('/xoriguers-udg/', '')).toBeUndefined();
  });

  it('joins the base and an uploaded path without doubling the slash', () => {
    expect(mediaUrl('/xoriguers-udg/', '/images/uploads/foo.jpg')).toBe(
      '/xoriguers-udg/images/uploads/foo.jpg'
    );
  });

  it('respects a root base', () => {
    expect(mediaUrl('/', '/images/uploads/foo.jpg')).toBe('/images/uploads/foo.jpg');
  });
});

describe('isUploadedPath', () => {
  it('treats a leading-slash path as uploaded', () => {
    expect(isUploadedPath('/images/uploads/foo.jpg')).toBe(true);
  });

  it('treats a bracket placeholder as not uploaded', () => {
    expect(isUploadedPath('[Nom del patrocinador]')).toBe(false);
  });
});

describe('isUploadedPath, with nothing', () => {
  it('is false rather than throwing', () => {
    expect(isUploadedPath(undefined)).toBe(false);
    expect(isUploadedPath(null)).toBe(false);
  });
});

describe('fotosAlbum', () => {
  it('reads plain paths, as albums were saved before captions', () => {
    expect(fotosAlbum(['/images/uploads/a.jpg'])).toEqual([{ foto: '/images/uploads/a.jpg' }]);
  });

  it('reads photos with a caption, trimmed, and drops an empty one', () => {
    expect(fotosAlbum([{ foto: '/a.jpg', peu: ' El 3d8 ' }, { foto: '/b.jpg', peu: '' }])).toEqual([
      { foto: '/a.jpg', peu: 'El 3d8' },
      { foto: '/b.jpg' },
    ]);
  });

  it('mixes both shapes and leaves out what has no photo', () => {
    expect(fotosAlbum(['/a.jpg', { foto: '/b.jpg' }, { peu: 'sola' }, { foto: '' }, '', null])).toEqual([
      { foto: '/a.jpg' },
      { foto: '/b.jpg' },
    ]);
  });

  it('is empty for anything but a list', () => {
    expect(fotosAlbum(undefined)).toEqual([]);
    expect(fotosAlbum('a.jpg')).toEqual([]);
  });
});
