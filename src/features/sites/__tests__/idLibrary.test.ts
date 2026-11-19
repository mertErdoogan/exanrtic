import { bucketIdLibrary } from '../idLibrary';

describe('bucketIdLibrary', () => {
  it('groups by ID range and computes good-find share', () => {
    const buckets = bucketIdLibrary([
      { targetId: 72, result: 'coin', n: 2 },
      { targetId: 78, result: 'trash', n: 1 },
      { targetId: 15, result: 'trash', n: 4 },
      { targetId: null, result: 'coin', n: 9 },
    ]);
    expect(buckets).toHaveLength(2);
    expect(buckets[0]).toMatchObject({ from: 10, to: 19, total: 4, goodShare: 0, top: 'trash' });
    expect(buckets[1]).toMatchObject({ from: 70, to: 79, total: 3, top: 'coin' });
    expect(buckets[1]!.goodShare).toBeCloseTo(2 / 3);
  });
});
