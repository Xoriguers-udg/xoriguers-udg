import { describe, expect, it } from 'vitest';
import { instagramDe, llegeixXarxes } from './xarxes';

describe('llegeixXarxes', () => {
  it('reads the list, skipping a row with no name or address', () => {
    const xarxes = llegeixXarxes({
      xarxes: [
        { nom: 'Instagram', url: 'https://www.instagram.com/xoriguersudg' },
        { nom: 'TikTok', url: '' },
        { nom: '', url: 'https://example.org' },
        { nom: 'Bluesky', url: 'https://bsky.app/profile/xoriguers' },
      ],
    });
    expect(xarxes.map((x) => x.nom)).toEqual(['Instagram', 'Bluesky']);
    expect(instagramDe(xarxes)).toBe('https://www.instagram.com/xoriguersudg');
  });

  it('still reads the four fixed fields, in the footer’s old order', () => {
    const xarxes = llegeixXarxes({ youtubeUrl: 'https://youtube.com/@x', instagramUrl: 'https://instagram.com/x', twitterUrl: '' });
    expect(xarxes.map((x) => x.nom)).toEqual(['Instagram', 'YouTube']);
  });

  it('has no Instagram when none of the networks is', () => {
    expect(instagramDe(llegeixXarxes({ xarxes: [] }))).toBeUndefined();
  });
});
