/**
 * Claude call with a forced tool so the answer is always structured JSON.
 * The model is swappable through the REPORT_MODEL secret.
 */
import type { SoilContext, WeatherContext, WikiPlace } from './context.ts';
import type { ReportRequest } from './types.ts';

const SYSTEM = `You prepare a short pre-hunt "site report" for a hobby metal detectorist.

Hard rules:
- Never name, locate or point towards any archaeological, protected, scheduled or heritage site, cemetery, park or monument. Give only regional, general historical context (periods, types of settlement typical of the area).
- Never say or imply that something is buried at a specific place. This is preparation, not prediction.
- Always remind that detecting requires the landowner's permission and must follow local law, in one short note.
- Base regional history only on the provided encyclopedia extracts. If they are empty or thin, say the information is limited instead of inventing.
- Base soil and weather only on the provided numbers. Mineralisation is an estimate from texture and pH; say so when relevant.
- Device advice must fit the user's listed detectors (technology, frequencies, coil). If none are listed, give general advice and set deviceModel to null.
- Use the user's own history only as given (visits, coverage, results, ID ranges). Do not invent history.
- No numeric success probabilities.
- Write in the requested language, concise, plain, field-friendly.`;

const TOOL = {
  name: 'site_report',
  description: 'Return the structured site report.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['region', 'soil', 'weather', 'recommendation', 'history'],
    properties: {
      region: {
        type: 'object',
        additionalProperties: false,
        required: ['summary', 'periods'],
        properties: {
          summary: { type: 'string', description: '2–3 sentences of regional historical context.' },
          periods: { type: 'array', items: { type: 'string' }, maxItems: 5 },
        },
      },
      soil: {
        type: 'object',
        additionalProperties: false,
        required: ['summary', 'mineralization'],
        properties: {
          summary: { type: 'string' },
          mineralization: { type: 'string', enum: ['low', 'medium', 'high', 'unknown'] },
        },
      },
      weather: {
        type: 'object',
        additionalProperties: false,
        required: ['summary', 'groundCondition'],
        properties: {
          summary: { type: 'string' },
          groundCondition: { type: 'string', description: 'What recent rain/temperature means for detecting.' },
        },
      },
      recommendation: {
        type: 'object',
        additionalProperties: false,
        required: ['deviceModel', 'mode', 'groundBalance', 'coil', 'difficulty', 'notes'],
        properties: {
          deviceModel: { type: ['string', 'null'] },
          mode: { type: 'string' },
          groundBalance: { type: 'string' },
          coil: { type: 'string' },
          difficulty: { type: 'string', enum: ['favourable', 'moderate', 'challenging'] },
          notes: { type: 'array', items: { type: 'string' }, maxItems: 4 },
        },
      },
      history: { type: ['string', 'null'], description: 'One or two sentences on the user’s own history here, or null.' },
    },
  },
} as const;

export type ModelReport = {
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
};

export async function generateReport(input: {
  apiKey: string;
  model: string;
  request: ReportRequest;
  weather: WeatherContext;
  soil: SoilContext;
  region: WikiPlace[];
}): Promise<ModelReport> {
  const { request, weather, soil, region } = input;
  const userContent = JSON.stringify({
    language: request.language,
    target: request.target,
    date: request.date,
    devices: request.devices,
    history: request.history ?? null,
    weather,
    soil,
    encyclopedia: region.map((r) => ({ title: r.title, extract: r.extract })),
  });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': input.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: 1200,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      tools: [TOOL],
      tool_choice: { type: 'tool', name: TOOL.name },
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  if (!res.ok) throw new Error(`model ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { content: { type: string; name?: string; input?: unknown }[] };
  const block = body.content.find((c) => c.type === 'tool_use' && c.name === TOOL.name);
  if (!block?.input) throw new Error('model returned no report');
  return block.input as ModelReport;
}
