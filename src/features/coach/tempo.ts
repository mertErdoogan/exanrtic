/**
 * Swing tempo from gyroscope samples.
 *
 * With the phone fixed to the shaft, a sweep is a rotation around one axis
 * that reverses direction at each end. We pick the axis with the largest
 * variance in the window (works whatever way the phone is mounted) and
 * count direction reversals with hysteresis, so small wobbles are ignored.
 * One reversal = one sweep (left→right or right→left).
 */
export type GyroSample = { x: number; y: number; z: number; t: number };

export const TEMPO_LIMITS = {
  /** rad/s needed before a direction counts as a real sweep. */
  hysteresis: 0.35,
  /** Sweeps per minute. Most guides suggest roughly one sweep per second. */
  tooFast: 75,
  tooSlow: 25,
} as const;

export type TempoVerdict = 'idle' | 'tooFast' | 'good' | 'tooSlow';

function dominantAxis(samples: GyroSample[]): 'x' | 'y' | 'z' {
  const axes = ['x', 'y', 'z'] as const;
  let best: 'x' | 'y' | 'z' = 'z';
  let bestVar = -1;
  for (const a of axes) {
    const vals = samples.map((s) => s[a]);
    const mean = vals.reduce((p, c) => p + c, 0) / (vals.length || 1);
    const v = vals.reduce((p, c) => p + (c - mean) ** 2, 0) / (vals.length || 1);
    if (v > bestVar) {
      bestVar = v;
      best = a;
    }
  }
  return best;
}

export function sweepsPerMinute(samples: GyroSample[]): number {
  if (samples.length < 2) return 0;
  const first = samples[0]!;
  const last = samples[samples.length - 1]!;
  const spanS = (last.t - first.t) / 1000;
  if (spanS < 2) return 0;
  const axis = dominantAxis(samples);
  let state: -1 | 0 | 1 = 0;
  let reversals = 0;
  for (const s of samples) {
    const v = s[axis];
    const next: -1 | 0 | 1 = v > TEMPO_LIMITS.hysteresis ? 1 : v < -TEMPO_LIMITS.hysteresis ? -1 : 0;
    if (next !== 0 && next !== state) {
      if (state !== 0) reversals++;
      state = next;
    }
  }
  return (reversals / spanS) * 60;
}

export function verdict(spm: number): TempoVerdict {
  if (spm < 5) return 'idle';
  if (spm > TEMPO_LIMITS.tooFast) return 'tooFast';
  if (spm < TEMPO_LIMITS.tooSlow) return 'tooSlow';
  return 'good';
}
