import { sweepsPerMinute, verdict, type GyroSample } from '../tempo';

/** Simulated sweeping: sine on one axis, `sweepsPerSecond` direction changes per second. */
function simulate(sweepsPerSecond: number, seconds: number, axis: 'x' | 'y' | 'z' = 'y'): GyroSample[] {
  const hz = 50;
  const out: GyroSample[] = [];
  for (let i = 0; i <= seconds * hz; i++) {
    const t = i / hz;
    const v = 1.5 * Math.sin(Math.PI * sweepsPerSecond * t);
    out.push({ x: axis === 'x' ? v : 0.05, y: axis === 'y' ? v : -0.05, z: axis === 'z' ? v : 0.02, t: t * 1000 });
  }
  return out;
}

describe('sweepsPerMinute', () => {
  it('measures ~60 sweeps/min for one sweep per second on any axis', () => {
    expect(sweepsPerMinute(simulate(1, 10, 'y'))).toBeGreaterThan(50);
    expect(sweepsPerMinute(simulate(1, 10, 'y'))).toBeLessThan(66);
    expect(sweepsPerMinute(simulate(1, 10, 'x'))).toBeGreaterThan(50);
  });

  it('returns 0 for a still phone', () => {
    expect(sweepsPerMinute(simulate(0, 10))).toBe(0);
  });
});

describe('verdict', () => {
  it('classifies tempo', () => {
    expect(verdict(0)).toBe('idle');
    expect(verdict(100)).toBe('tooFast');
    expect(verdict(50)).toBe('good');
    expect(verdict(15)).toBe('tooSlow');
  });
});
