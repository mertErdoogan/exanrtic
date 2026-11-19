import { eq } from 'drizzle-orm';
import { create } from 'zustand';

import { db } from '@/db/client';
import { settings } from '@/db/schema';
import i18n, { deviceLanguage, type Language } from '@/i18n';
import type { UnitSystem } from '@/lib/units';

export type AppSettings = {
  language: Language;
  units: UnitSystem;
  sweepWidthM: number;
  onboarded: boolean;
};

const DEFAULTS: AppSettings = {
  language: deviceLanguage(),
  units: 'metric',
  sweepWidthM: 1,
  onboarded: false,
};

type SettingsState = AppSettings & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
};

function parse(raw: Record<string, string>): AppSettings {
  return {
    language: raw.language === 'tr' || raw.language === 'en' ? raw.language : DEFAULTS.language,
    units: raw.units === 'imperial' ? 'imperial' : 'metric',
    sweepWidthM: raw.sweepWidthM ? Math.min(3, Math.max(0.3, Number(raw.sweepWidthM))) : DEFAULTS.sweepWidthM,
    onboarded: raw.onboarded === 'true',
  };
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    const rows = await db.select().from(settings);
    const raw = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const parsed = parse(raw);
    await i18n.changeLanguage(parsed.language);
    set({ ...parsed, hydrated: true });
  },

  update: async (patch) => {
    const next = { ...get(), ...patch };
    const now = Date.now();
    for (const [key, value] of Object.entries(patch)) {
      const v = String(value);
      const existing = await db.select().from(settings).where(eq(settings.key, key));
      if (existing.length) {
        await db.update(settings).set({ value: v, updatedAt: now }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value: v, updatedAt: now });
      }
    }
    if (patch.language) await i18n.changeLanguage(patch.language);
    set({
      language: next.language,
      units: next.units,
      sweepWidthM: next.sweepWidthM,
      onboarded: next.onboarded,
    });
  },
}));
