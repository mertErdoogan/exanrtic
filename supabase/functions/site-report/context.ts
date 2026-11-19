/**
 * Public context sources for the site report. All calls use a coarse grid
 * cell (~5 km), never the user's exact position.
 */

export type WeatherContext = {
  date: string;
  tempMaxC: number | null;
  tempMinC: number | null;
  precipitationMm: number | null;
  precipitationLast3DaysMm: number | null;
};

export type SoilContext = {
  clayPct: number | null;
  sandPct: number | null;
  siltPct: number | null;
  ph: number | null;
  organicCarbon: number | null;
};

export type WikiPlace = { title: string; extract: string; url: string };

const TIMEOUT_MS = 6000;

async function getJson<T>(url: string): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'DedektorAsistani/0.1 (site-report)' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Open-Meteo daily forecast plus the previous three days of rain. */
export async function fetchWeather(lat: number, lng: number, date: string): Promise<WeatherContext> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&past_days=3&forecast_days=10&timezone=auto`;
  type R = { daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[] } };
  const data = await getJson<R>(url);
  const empty: WeatherContext = { date, tempMaxC: null, tempMinC: null, precipitationMm: null, precipitationLast3DaysMm: null };
  const d = data?.daily;
  if (!d) return empty;
  const i = d.time.indexOf(date);
  if (i < 0) return empty;
  const prev = d.precipitation_sum.slice(Math.max(0, i - 3), i);
  return {
    date,
    tempMaxC: d.temperature_2m_max[i] ?? null,
    tempMinC: d.temperature_2m_min[i] ?? null,
    precipitationMm: d.precipitation_sum[i] ?? null,
    precipitationLast3DaysMm: prev.length ? prev.reduce((a, b) => a + (b ?? 0), 0) : null,
  };
}

/** ISRIC SoilGrids topsoil (0–5 cm) texture, pH and organic carbon. */
export async function fetchSoil(lat: number, lng: number): Promise<SoilContext> {
  const props = ['clay', 'sand', 'silt', 'phh2o', 'soc'];
  const url =
    `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lng}&lat=${lat}` +
    props.map((p) => `&property=${p}`).join('') +
    `&depth=0-5cm&value=mean`;
  type Layer = { name: string; unit_measure?: { d_factor?: number }; depths: { values: { mean: number | null } }[] };
  type R = { properties?: { layers?: Layer[] } };
  const data = await getJson<R>(url);
  const get = (name: string): number | null => {
    const layer = data?.properties?.layers?.find((l) => l.name === name);
    const raw = layer?.depths?.[0]?.values?.mean;
    if (raw == null) return null;
    return raw / (layer?.unit_measure?.d_factor ?? 1);
  };
  // Dividing by d_factor yields SoilGrids' conventional units:
  // texture in %, pH as pH, organic carbon in g/kg.
  return {
    clayPct: get('clay'),
    sandPct: get('sand'),
    siltPct: get('silt'),
    ph: get('phh2o'),
    organicCarbon: get('soc'),
  };
}

/**
 * Words that mark protected heritage places. Articles about them are
 * dropped before anything reaches the model, so the report can never
 * point a user towards a protected site.
 */
const PROTECTED_PATTERNS = [
  /archaeolog/i,
  /arkeolo/i,
  /ancient city/i,
  /antik kent/i,
  /ören yeri/i,
  /höyük/i,
  /tümülüs/i,
  /tumulus/i,
  /necropol/i,
  /nekropol/i,
  /scheduled monument/i,
  /hillfort/i,
  /barrow/i,
  /ruins/i,
  /harabe/i,
  /castle/i,
  /kalesi/i,
  /cemetery/i,
  /mezarlı/i,
  /national park/i,
  /milli park/i,
  /sit alanı/i,
];

export function isProtected(text: string): boolean {
  return PROTECTED_PATTERNS.some((re) => re.test(text));
}

/** Nearby encyclopedia articles about settlements and the wider area. */
export async function fetchRegion(lat: number, lng: number, language: 'tr' | 'en'): Promise<WikiPlace[]> {
  const base = `https://${language}.wikipedia.org/w/api.php`;
  type Geo = { query?: { geosearch?: { pageid: number; title: string }[] } };
  const geo = await getJson<Geo>(
    `${base}?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=10000&gslimit=25&format=json&origin=*`,
  );
  const pages = (geo?.query?.geosearch ?? []).filter((p) => !isProtected(p.title)).slice(0, 8);
  if (!pages.length) return [];
  type Ex = { query?: { pages?: Record<string, { pageid: number; title: string; extract?: string }> } };
  const ex = await getJson<Ex>(
    `${base}?action=query&prop=extracts&exintro=1&explaintext=1&exchars=700&pageids=${pages
      .map((p) => p.pageid)
      .join('|')}&format=json&origin=*`,
  );
  return Object.values(ex?.query?.pages ?? {})
    .filter((p) => p.extract && !isProtected(`${p.title} ${p.extract}`))
    .map((p) => ({
      title: p.title,
      extract: p.extract!,
      url: `https://${language}.wikipedia.org/?curid=${p.pageid}`,
    }));
}
