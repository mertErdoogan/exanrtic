import type { Device } from '@/db/schema';

/**
 * Built-in detector catalog. Only specifications verified against the
 * manufacturer's published product pages are included; anything else is
 * entered manually by the user. Extend this list as models are verified.
 */
export type CatalogEntry = {
  id: string;
  brand: string;
  model: string;
  technology: Device['technology'];
  frequencies: string;
  coil: string;
  warrantyMonths: number;
  /** Search modes as named by the manufacturer. */
  modes: string[];
  source: string;
};

export const DEVICE_CATALOG: CatalogEntry[] = [
  {
    id: 'nokta-legend-2',
    brand: 'Nokta',
    model: 'The Legend 2',
    technology: 'smf',
    frequencies: 'Multi · 4 / 10 / 15 / 20 / 40 kHz',
    coil: 'LD28 DD 28 cm',
    warrantyMonths: 36,
    modes: ['Park', 'Field', 'Beach', 'Relic', 'Gold'],
    source: 'https://www.noktadedektor.com/dedektor/the-legend-2/',
  },
  {
    id: 'nokta-magnetar-9000',
    brand: 'Nokta',
    model: 'Magnetar 9000',
    technology: 'pi',
    frequencies: 'Pulse induction',
    coil: 'MG37 / MG29 DRC',
    warrantyMonths: 36,
    modes: ['Easy', 'Expert'],
    source: 'https://magnetar.noktadetectors.com/tr/',
  },
];

export function catalogEntry(id: string | null | undefined): CatalogEntry | undefined {
  return id ? DEVICE_CATALOG.find((c) => c.id === id) : undefined;
}

/** Months of warranty left, or null when unknown. Negative means expired. */
export function warrantyMonthsLeft(device: Pick<Device, 'purchasedAt' | 'warrantyMonths'>, at = Date.now()): number | null {
  if (!device.purchasedAt || !device.warrantyMonths) return null;
  const end = new Date(device.purchasedAt);
  end.setMonth(end.getMonth() + device.warrantyMonths);
  const months = (end.getTime() - at) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.floor(months);
}
