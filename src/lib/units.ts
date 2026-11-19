export type UnitSystem = 'metric' | 'imperial';

const M_PER_FT = 0.3048;
const M_PER_MI = 1609.344;
const M2_PER_ACRE = 4046.8564224;

export function formatDistance(m: number, units: UnitSystem, locale = 'tr'): string {
  const nf = (n: number, d: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  if (units === 'imperial') {
    const ft = m / M_PER_FT;
    return ft < 1000 ? `${nf(ft, 0)} ft` : `${nf(m / M_PER_MI, 2)} mi`;
  }
  return m < 1000 ? `${nf(m, 0)} m` : `${nf(m / 1000, 1)} km`;
}

export function formatArea(m2: number, units: UnitSystem, locale = 'tr'): string {
  const nf = (n: number, d: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  if (units === 'imperial') {
    const acres = m2 / M2_PER_ACRE;
    return acres < 0.1 ? `${nf(m2 / (M_PER_FT * M_PER_FT), 0)} ft²` : `${nf(acres, 2)} acre`;
  }
  return m2 < 10_000 ? `${nf(m2, 0)} m²` : `${nf(m2 / 10_000, 2)} ha`;
}

export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Sweep width input shown in the user's units, stored in metres. */
export function sweepFromDisplay(value: number, units: UnitSystem): number {
  return units === 'imperial' ? value * M_PER_FT : value;
}
export function sweepToDisplay(m: number, units: UnitSystem): number {
  return units === 'imperial' ? Math.round((m / M_PER_FT) * 10) / 10 : Math.round(m * 10) / 10;
}
