import { cleanTrack, computeCoverage, haversineM, nearestWithin, pathLengthM, splitSegments } from '../geo';

// ~1 m of latitude in degrees.
const M = 1 / 111_320;

function walk(n: number, stepM: number, secondsPerStep = 2, segment = 0, start = 0) {
  return Array.from({ length: n }, (_, i) => ({
    lat: 41 + (start + i) * stepM * M,
    lng: 29,
    ts: (start + i) * secondsPerStep * 1000,
    accuracy: 3, // a good open-sky fix
    segment,
  }));
}

describe('haversineM', () => {
  it('measures one degree of latitude as ~111 km', () => {
    expect(haversineM({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111_195, -2);
  });
});

describe('cleanTrack', () => {
  it('drops inaccurate fixes, spikes and stationary jitter', () => {
    const pts = walk(5, 2);
    const noisy = [
      ...pts.slice(0, 2),
      { ...pts[1]!, ts: pts[1]!.ts + 500, lat: pts[1]!.lat + 0.3 * M }, // jitter
      { ...pts[2]!, accuracy: 80 }, // bad accuracy
      { ...pts[2]!, lat: pts[2]!.lat + 500 * M }, // spike
      ...pts.slice(2),
    ];
    const cleaned = cleanTrack(noisy);
    expect(cleaned).toHaveLength(5);
  });

  it('keeps the first point of a new segment', () => {
    const a = walk(3, 2, 2, 0);
    const b = walk(3, 2, 2, 1, 3).map((p) => ({ ...p, lat: p.lat + 1000 * M }));
    expect(cleanTrack([...a, ...b])).toHaveLength(6);
  });
});

describe('pathLengthM', () => {
  it('sums distance within segments only', () => {
    const a = walk(11, 2, 2, 0); // 20 m
    const b = walk(6, 2, 2, 1, 11).map((p) => ({ ...p, lat: p.lat + 1000 * M })); // 10 m
    expect(splitSegments([...a, ...b])).toHaveLength(2);
    expect(pathLengthM([...a, ...b])).toBeCloseTo(30, 0);
  });
});

describe('computeCoverage', () => {
  it('approximates a 1 m wide strip along a 50 m walk', () => {
    const pts = walk(26, 2); // 50 m
    const { areaM2, polygon } = computeCoverage(pts, 1);
    expect(polygon).not.toBeNull();
    // 50 m × 1 m plus rounded caps (~0.8 m²); generous bounds for buffer approximation.
    expect(areaM2).toBeGreaterThan(45);
    expect(areaM2).toBeLessThan(60);
  });

  it('returns zero for no points', () => {
    expect(computeCoverage([], 1)).toEqual({ polygon: null, areaM2: 0 });
  });
});

describe('nearestWithin', () => {
  it('finds the closest candidate inside the radius', () => {
    const origin = { lat: 41, lng: 29 };
    const near = { id: 'near', lat: 41 + 100 * M, lng: 29 };
    const far = { id: 'far', lat: 41 + 900 * M, lng: 29 };
    expect(nearestWithin(origin, [far, near], 400)?.item.id).toBe('near');
    expect(nearestWithin(origin, [far], 400)).toBeNull();
  });
});

describe('cleanTrack with poor accuracy', () => {
  it('drops wandering indoor fixes but keeps clean outdoor steps', () => {
    const base = { lat: 41.0, lng: 29.0 };
    const north = (m: number) => ({ lat: base.lat + m / 111_320, lng: base.lng });
    const indoor = [0, 4, 2, 6, 3].map((m, i) => ({ ...north(m), ts: i * 3000, accuracy: 15 }));
    expect(cleanTrack(indoor)).toHaveLength(1);
    const outdoor = [0, 3, 6, 9].map((m, i) => ({ ...north(m), ts: i * 3000, accuracy: 4 }));
    expect(cleanTrack(outdoor)).toHaveLength(4);
  });
});
