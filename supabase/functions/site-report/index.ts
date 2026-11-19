// Site report: regional history + soil + weather + device advice, personalised
// with the user's own (aggregated, location-free) history.
//
// Secrets (supabase secrets set ...):
//   ANTHROPIC_API_KEY   required
//   REPORT_MODEL        optional, default "claude-haiku-5-5"
//   REPORT_DAILY_LIMIT  optional, default 10 reports per user per day
import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';

import { fetchRegion, fetchSoil, fetchWeather, type WikiPlace } from './context.ts';
import { generateReport } from './model.ts';
import { parseRequest } from './types.ts';

const CONTEXT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'method' }, { status: 405 });

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) return Response.json({ error: 'not-configured' }, { status: 503 });
    const model = Deno.env.get('REPORT_MODEL') ?? 'claude-haiku-5-5';
    const limit = Number(Deno.env.get('REPORT_DAILY_LIMIT') ?? '10');

    const request = parseRequest(await req.json().catch(() => null));
    if (!request) return Response.json({ error: 'bad-request' }, { status: 400 });

    const userId = ctx.userClaims?.id;
    if (!userId) return Response.json({ error: 'unauthorized' }, { status: 401 });

    // Quota first, so abuse never reaches the paid model.
    const { data: allowed, error: quotaError } = await ctx.supabaseAdmin.rpc('consume_report_quota', {
      p_user: userId,
      p_limit: limit,
    });
    if (quotaError) return Response.json({ error: 'quota-check-failed' }, { status: 500 });
    if (!allowed) return Response.json({ error: 'quota-exceeded' }, { status: 429 });

    const { lat, lng } = request.cell;

    // Public regional context is shared between users and cached per cell.
    let region: WikiPlace[] | null = null;
    let soil = null;
    const { data: cached } = await ctx.supabaseAdmin
      .from('region_context')
      .select('payload, created_at')
      .eq('cell_lat', lat.toFixed(2))
      .eq('cell_lng', lng.toFixed(2))
      .eq('language', request.language)
      .maybeSingle();
    if (cached && Date.now() - new Date(cached.created_at).getTime() < CONTEXT_TTL_MS) {
      region = cached.payload.region;
      soil = cached.payload.soil;
    }
    const weatherPromise = fetchWeather(lat, lng, request.date);
    if (!region || !soil) {
      [region, soil] = await Promise.all([fetchRegion(lat, lng, request.language), fetchSoil(lat, lng)]);
      await ctx.supabaseAdmin.from('region_context').upsert({
        cell_lat: lat.toFixed(2),
        cell_lng: lng.toFixed(2),
        language: request.language,
        payload: { region, soil },
        created_at: new Date().toISOString(),
      });
    }
    const weather = await weatherPromise;

    try {
      const report = await generateReport({ apiKey, model, request, weather, soil, region });
      return Response.json({
        ...report,
        sources: [
          ...region.map((r) => ({ title: r.title, url: r.url })),
          { title: 'Open-Meteo', url: 'https://open-meteo.com' },
          { title: 'ISRIC SoilGrids', url: 'https://soilgrids.org' },
        ],
        generatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('site-report model error', e);
      return Response.json({ error: 'model-failed' }, { status: 502 });
    }
  }),
};
