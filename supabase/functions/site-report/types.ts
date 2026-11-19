// Mirror of src/features/report/types.ts in the app. Keep both in sync.

export type ReportTarget = 'general' | 'coin' | 'jewelry' | 'relic' | 'gold';

export type ReportRequest = {
  cell: { lat: number; lng: number };
  date: string;
  target: ReportTarget;
  language: 'tr' | 'en';
  devices: { model: string; technology: string; frequencies: string | null; coil: string | null }[];
  history?: {
    visits: number;
    coveredM2: number;
    digs: number;
    goodFinds: number;
    topResult?: string;
    idRanges?: { from: number; to: number; total: number; goodShare: number }[];
  };
};

const TARGETS: ReportTarget[] = ['general', 'coin', 'jewelry', 'relic', 'gold'];

/** Strict validation: anything unexpected is rejected rather than forwarded to the model. */
export function parseRequest(body: unknown): ReportRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const cell = b.cell as { lat?: unknown; lng?: unknown } | undefined;
  if (!cell || typeof cell.lat !== 'number' || typeof cell.lng !== 'number') return null;
  if (Math.abs(cell.lat) > 90 || Math.abs(cell.lng) > 180) return null;
  if (typeof b.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return null;
  if (!TARGETS.includes(b.target as ReportTarget)) return null;
  if (b.language !== 'tr' && b.language !== 'en') return null;
  if (!Array.isArray(b.devices) || b.devices.length > 10) return null;
  const str = (v: unknown, max = 80) => (typeof v === 'string' ? v.slice(0, max) : null);
  const devices = b.devices.map((d) => {
    const x = (d ?? {}) as Record<string, unknown>;
    return { model: str(x.model) ?? '', technology: str(x.technology, 20) ?? 'other', frequencies: str(x.frequencies), coil: str(x.coil) };
  });
  let history: ReportRequest['history'];
  if (b.history && typeof b.history === 'object') {
    const h = b.history as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    history = {
      visits: num(h.visits),
      coveredM2: num(h.coveredM2),
      digs: num(h.digs),
      goodFinds: num(h.goodFinds),
      topResult: str(h.topResult, 20) ?? undefined,
      idRanges: Array.isArray(h.idRanges)
        ? h.idRanges.slice(0, 12).map((r) => {
            const x = (r ?? {}) as Record<string, unknown>;
            return { from: num(x.from), to: num(x.to), total: num(x.total), goodShare: num(x.goodShare) };
          })
        : undefined,
    };
  }
  // Snap to the coarse grid server-side too, in case an old client sends more precision.
  const snap = (v: number) => Math.round(v / 0.05) * 0.05;
  return {
    cell: { lat: snap(cell.lat), lng: snap(cell.lng) },
    date: b.date,
    target: b.target as ReportTarget,
    language: b.language,
    devices,
    history,
  };
}
