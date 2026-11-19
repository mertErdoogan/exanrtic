import { devicesRepo, digsRepo, sessionsRepo } from '@/db/repo';
import { bucketIdLibrary } from '@/features/sites/idLibrary';
import { ensureAnonymousSession } from '@/lib/supabase';

import type { ReportRequest, ReportResponse, ReportTarget } from './types';

/** ~5.5 km grid: enough for weather and soil, never a findspot. */
export function toCell(lat: number, lng: number) {
  const step = 0.05;
  return {
    lat: Math.round(lat / step) * step,
    lng: Math.round(lng / step) * step,
  };
}

export async function buildReportRequest(input: {
  lat: number;
  lng: number;
  date: Date;
  target: ReportTarget;
  language: 'tr' | 'en';
  siteId?: string;
}): Promise<ReportRequest> {
  const devices = await devicesRepo.list();
  const req: ReportRequest = {
    cell: toCell(input.lat, input.lng),
    date: input.date.toISOString().slice(0, 10),
    target: input.target,
    language: input.language,
    devices: devices.map((d) => ({
      model: `${d.brand} ${d.model}`,
      technology: d.technology,
      frequencies: d.frequencies,
      coil: d.coil,
    })),
  };

  if (input.siteId) {
    const [sessions, digs, library] = await Promise.all([
      sessionsRepo.bySite(input.siteId),
      digsRepo.forSite(input.siteId),
      digsRepo.idLibrary(input.siteId),
    ]);
    const counts = new Map<string, number>();
    for (const d of digs) counts.set(d.result, (counts.get(d.result) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    req.history = {
      visits: sessions.length,
      coveredM2: Math.round(sessions.reduce((s, x) => s + x.coveredM2, 0)),
      digs: digs.length,
      goodFinds: digs.filter((d) => d.result === 'coin' || d.result === 'jewelry' || d.result === 'relic').length,
      topResult: top,
      idRanges: bucketIdLibrary(library).map(({ from, to, total, goodShare }) => ({ from, to, total, goodShare })),
    };
  }
  return req;
}

export async function fetchSiteReport(req: ReportRequest): Promise<ReportResponse> {
  const sb = await ensureAnonymousSession();
  if (!sb) throw new Error('backend-not-configured');
  const { data, error } = await sb.functions.invoke<ReportResponse>('site-report', { body: req });
  if (error) throw error;
  if (!data) throw new Error('empty-report');
  return data;
}
