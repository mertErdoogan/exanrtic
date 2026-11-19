/**
 * Contract between the app and the `site-report` edge function.
 * Kept in one place so both sides stay in sync.
 */
export type ReportTarget = 'general' | 'coin' | 'jewelry' | 'relic' | 'gold';

export type ReportRequest = {
  /** Rounded to a ~5 km grid on the device; the exact location never leaves the phone. */
  cell: { lat: number; lng: number };
  date: string; // YYYY-MM-DD
  target: ReportTarget;
  language: 'tr' | 'en';
  devices: { model: string; technology: string; frequencies: string | null; coil: string | null }[];
  /** Aggregated personal history for the chosen site, if any. No coordinates. */
  history?: {
    visits: number;
    coveredM2: number;
    digs: number;
    goodFinds: number;
    topResult?: string;
    idRanges?: { from: number; to: number; total: number; goodShare: number }[];
  };
};

export type ReportResponse = {
  region: { summary: string; periods: string[] };
  soil: { summary: string; mineralization: 'low' | 'medium' | 'high' | 'unknown' };
  weather: { summary: string; groundCondition: string };
  recommendation: {
    deviceModel: string | null;
    mode: string;
    groundBalance: string;
    coil: string;
    difficulty: 'favourable' | 'moderate' | 'challenging';
    notes: string[];
  };
  history: string | null;
  sources: { title: string; url: string }[];
  generatedAt: string;
};
