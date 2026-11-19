import { parseRequest } from './types.ts';
import { isProtected } from './context.ts';
function assert(c: unknown, m: string) { if (!c) throw new Error(m); }
Deno.test('parseRequest snaps and validates', () => {
  const r = parseRequest({ cell: { lat: 41.0123, lng: 28.978 }, date: '2026-11-21', target: 'coin', language: 'tr', devices: [{ model: 'X', technology: 'smf' }] });
  assert(r && Math.abs(r.cell.lat - 41) < 1e-9 && Math.abs(r.cell.lng - 29) < 1e-9, 'snap');
  assert(parseRequest({ cell: { lat: 1, lng: 1 }, date: 'x', target: 'coin', language: 'tr', devices: [] }) === null, 'bad date');
  assert(parseRequest({ cell: { lat: 1, lng: 1 }, date: '2026-01-01', target: 'treasure', language: 'tr', devices: [] }) === null, 'bad target');
});
Deno.test('protected filter', () => {
  assert(isProtected('Troy archaeological site'), 'en');
  assert(isProtected('Kuşaklı Höyük'), 'tr');
  assert(!isProtected('Çatalca'), 'town ok');
});
