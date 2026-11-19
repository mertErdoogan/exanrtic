import { toCell } from '../api';

jest.mock('@/db/repo', () => ({}));
jest.mock('@/lib/supabase', () => ({}));

describe('toCell', () => {
  it('rounds coordinates to a coarse grid so findspots never leave the phone', () => {
    const c = toCell(41.01234, 28.97891);
    expect(c.lat).toBeCloseTo(41.0, 5);
    expect(c.lng).toBeCloseTo(29.0, 5);
  });
});
