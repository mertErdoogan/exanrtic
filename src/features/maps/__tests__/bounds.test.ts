import { boundsAround, estimateTileCount, OFFLINE_ZOOM } from '../bounds';

describe('boundsAround', () => {
  it('builds a symmetric box of the requested radius', () => {
    const [w, s, e, n] = boundsAround(41, 29, 1000);
    expect(n - 41).toBeCloseTo(1000 / 111_320, 6);
    expect(41 - s).toBeCloseTo(1000 / 111_320, 6);
    // Longitude degrees are wider apart at 41°N, so the delta is larger.
    expect(e - 29).toBeGreaterThan(n - 41);
    expect(29 - w).toBeCloseTo(e - 29, 9);
  });
});

describe('estimateTileCount', () => {
  it('keeps a 2 km site download at a sensible size', () => {
    const tiles = estimateTileCount(boundsAround(41, 29, 2000), OFFLINE_ZOOM.min, OFFLINE_ZOOM.max);
    expect(tiles).toBeGreaterThan(500);
    expect(tiles).toBeLessThan(5000);
  });

  it('grows roughly 4x per extra zoom level', () => {
    const b = boundsAround(41, 29, 3000);
    const z17 = estimateTileCount(b, 17, 17);
    const z18 = estimateTileCount(b, 18, 18);
    expect(z18 / z17).toBeGreaterThan(3);
    expect(z18 / z17).toBeLessThan(5);
  });
});
