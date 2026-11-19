export function formatDate(ts: number, locale: string): string {
  return new Date(ts).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatShortDate(ts: number, locale: string): string {
  return new Date(ts).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function formatTime(ts: number, locale: string): string {
  return new Date(ts).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/** Parses DD.MM.YYYY (or DD/MM/YYYY) into epoch ms; returns null when invalid. */
export function parseDayMonthYear(input: string): number | null {
  const m = input.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (date.getDate() !== Number(d) || date.getMonth() !== Number(mo) - 1) return null;
  return date.getTime();
}

export function toDayMonthYear(ts: number | null | undefined): string {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export function parseOptionalInt(input: string): number | null {
  const n = parseInt(input.replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}
