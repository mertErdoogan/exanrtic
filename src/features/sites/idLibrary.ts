import type { DigResult } from '@/db/schema';

export type IdLibraryRow = { targetId: number | null; result: DigResult; n: number };

export type IdBucket = {
  from: number;
  to: number;
  total: number;
  /** Share of digs in this ID range that were good finds (coin, jewellery, relic). */
  goodShare: number;
  top: DigResult;
};

const GOOD: DigResult[] = ['coin', 'jewelry', 'relic'];

/**
 * Groups the user's own dig results into Target ID ranges, e.g. "70–79:
 * 6 digs, 67% good". This is the seed of the personal ID library; with
 * device integration the IDs arrive automatically.
 */
export function bucketIdLibrary(rows: IdLibraryRow[], width = 10): IdBucket[] {
  const buckets = new Map<number, { total: number; good: number; byResult: Map<DigResult, number> }>();
  for (const r of rows) {
    if (r.targetId == null) continue;
    const key = Math.floor(r.targetId / width) * width;
    const b = buckets.get(key) ?? { total: 0, good: 0, byResult: new Map() };
    b.total += r.n;
    if (GOOD.includes(r.result)) b.good += r.n;
    b.byResult.set(r.result, (b.byResult.get(r.result) ?? 0) + r.n);
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([from, b]) => {
      let top: DigResult = 'unknown';
      let best = -1;
      for (const [res, n] of b.byResult) {
        if (n > best) {
          best = n;
          top = res;
        }
      }
      return { from, to: from + width - 1, total: b.total, goodShare: b.total ? b.good / b.total : 0, top };
    });
}
