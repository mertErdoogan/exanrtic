import { and, asc, count, desc, eq, gt, inArray, isNull, max, ne, sql } from 'drizzle-orm';

import { newId, now } from '@/lib/id';

import { db } from './client';
import {
  devices,
  digPhotos,
  digs,
  sessions,
  sites,
  trackPoints,
  type Device,
  type Dig,
  type DigResult,
  type Session,
  type Site,
} from './schema';

/* ================================================================ Sites */

export type SiteWithStats = Site & { visits: number; lastVisit: number | null; digCount: number };

export const sitesRepo = {
  async list(): Promise<SiteWithStats[]> {
    const rows = await db
      .select({
        site: sites,
        visits: count(sessions.id),
        lastVisit: max(sessions.startedAt),
      })
      .from(sites)
      .leftJoin(sessions, eq(sessions.siteId, sites.id))
      .groupBy(sites.id)
      .orderBy(desc(max(sessions.startedAt)));
    const digCounts = await db
      .select({ siteId: digs.siteId, n: count(digs.id) })
      .from(digs)
      .groupBy(digs.siteId);
    const byId = new Map(digCounts.map((d) => [d.siteId, d.n]));
    return rows.map((r) => ({
      ...r.site,
      visits: r.visits,
      lastVisit: r.lastVisit ?? null,
      digCount: byId.get(r.site.id) ?? 0,
    }));
  },

  async get(id: string): Promise<Site | undefined> {
    const [row] = await db.select().from(sites).where(eq(sites.id, id));
    return row;
  },

  async create(input: { name: string; lat: number; lng: number }): Promise<Site> {
    const t = now();
    const row: Site = {
      id: newId(),
      name: input.name.trim() || '—',
      centerLat: input.lat,
      centerLng: input.lng,
      notes: null,
      ownerName: null,
      ownerContact: null,
      permitFrom: null,
      permitUntil: null,
      permitPhotoUri: null,
      createdAt: t,
      updatedAt: t,
    };
    await db.insert(sites).values(row);
    return row;
  },

  async update(id: string, patch: Partial<Omit<Site, 'id' | 'createdAt'>>): Promise<void> {
    await db.update(sites).set({ ...patch, updatedAt: now() }).where(eq(sites.id, id));
  },

  async remove(id: string): Promise<void> {
    await db.delete(sites).where(eq(sites.id, id));
  },
};

/* ============================================================= Sessions */

export const sessionsRepo = {
  async getActive(): Promise<Session | undefined> {
    const [row] = await db
      .select()
      .from(sessions)
      .where(ne(sessions.status, 'ended'))
      .orderBy(desc(sessions.startedAt))
      .limit(1);
    return row;
  },

  async get(id: string): Promise<Session | undefined> {
    const [row] = await db.select().from(sessions).where(eq(sessions.id, id));
    return row;
  },

  async create(input: {
    siteId: string;
    deviceId: string | null;
    target: Session['target'];
    sweepWidthM: number;
  }): Promise<Session> {
    const row: Session = {
      id: newId(),
      siteId: input.siteId,
      deviceId: input.deviceId,
      status: 'active',
      target: input.target,
      sweepWidthM: input.sweepWidthM,
      distanceM: 0,
      coveredM2: 0,
      segment: 0,
      startedAt: now(),
      endedAt: null,
      notes: null,
    };
    await db.insert(sessions).values(row);
    return row;
  },

  async update(id: string, patch: Partial<Omit<Session, 'id'>>): Promise<void> {
    await db.update(sessions).set(patch).where(eq(sessions.id, id));
  },

  async recent(limit = 10) {
    return db
      .select({ session: sessions, siteName: sites.name })
      .from(sessions)
      .innerJoin(sites, eq(sites.id, sessions.siteId))
      .where(eq(sessions.status, 'ended'))
      .orderBy(desc(sessions.startedAt))
      .limit(limit);
  },

  async bySite(siteId: string): Promise<Session[]> {
    return db.select().from(sessions).where(eq(sessions.siteId, siteId)).orderBy(desc(sessions.startedAt));
  },

  async countForSite(siteId: string): Promise<number> {
    const [row] = await db.select({ n: count() }).from(sessions).where(eq(sessions.siteId, siteId));
    return row?.n ?? 0;
  },
};

/* ========================================================== Track points */

export type NewTrackPoint = { ts: number; lat: number; lng: number; accuracy: number | null };

export const trackRepo = {
  async append(sessionId: string, segment: number, points: NewTrackPoint[]): Promise<void> {
    if (points.length === 0) return;
    await db.insert(trackPoints).values(points.map((p) => ({ ...p, sessionId, segment })));
  },

  async forSession(sessionId: string) {
    return db
      .select()
      .from(trackPoints)
      .where(eq(trackPoints.sessionId, sessionId))
      .orderBy(asc(trackPoints.ts));
  },

  async after(sessionId: string, afterId: number) {
    return db
      .select()
      .from(trackPoints)
      .where(and(eq(trackPoints.sessionId, sessionId), gt(trackPoints.id, afterId)))
      .orderBy(asc(trackPoints.id));
  },

  async forSessions(sessionIds: string[]) {
    if (sessionIds.length === 0) return [];
    return db
      .select()
      .from(trackPoints)
      .where(inArray(trackPoints.sessionId, sessionIds))
      .orderBy(asc(trackPoints.sessionId), asc(trackPoints.ts));
  },

  async last(sessionId: string) {
    const [row] = await db
      .select()
      .from(trackPoints)
      .where(eq(trackPoints.sessionId, sessionId))
      .orderBy(desc(trackPoints.ts))
      .limit(1);
    return row;
  },
};

/* ================================================================= Digs */

export const COLLECTION_RESULTS: DigResult[] = ['coin', 'jewelry', 'relic'];

export const digsRepo = {
  async create(input: {
    sessionId: string;
    siteId: string;
    lat: number;
    lng: number;
    accuracy: number | null;
  }): Promise<Dig> {
    const row: Dig = {
      id: newId(),
      sessionId: input.sessionId,
      siteId: input.siteId,
      ts: now(),
      lat: input.lat,
      lng: input.lng,
      accuracy: input.accuracy,
      result: 'unknown',
      targetId: null,
      depthCm: null,
      title: null,
      note: null,
      voiceUri: null,
    };
    await db.insert(digs).values(row);
    return row;
  },

  async update(id: string, patch: Partial<Omit<Dig, 'id' | 'sessionId' | 'siteId'>>): Promise<void> {
    await db.update(digs).set(patch).where(eq(digs.id, id));
  },

  async get(id: string): Promise<Dig | undefined> {
    const [row] = await db.select().from(digs).where(eq(digs.id, id));
    return row;
  },

  async remove(id: string): Promise<void> {
    await db.delete(digs).where(eq(digs.id, id));
  },

  async forSession(sessionId: string): Promise<Dig[]> {
    return db.select().from(digs).where(eq(digs.sessionId, sessionId)).orderBy(asc(digs.ts));
  },

  async forSite(siteId: string): Promise<Dig[]> {
    return db.select().from(digs).where(eq(digs.siteId, siteId)).orderBy(desc(digs.ts));
  },

  async collection() {
    return db
      .select({ dig: digs, siteName: sites.name })
      .from(digs)
      .innerJoin(sites, eq(sites.id, digs.siteId))
      .where(inArray(digs.result, COLLECTION_RESULTS))
      .orderBy(desc(digs.ts));
  },

  async addPhoto(digId: string, uri: string): Promise<void> {
    await db.insert(digPhotos).values({ id: newId(), digId, uri, createdAt: now() });
  },

  async photos(digId: string) {
    return db.select().from(digPhotos).where(eq(digPhotos.digId, digId)).orderBy(asc(digPhotos.createdAt));
  },

  async firstPhotos(digIds: string[]): Promise<Map<string, string>> {
    if (digIds.length === 0) return new Map();
    const rows = await db
      .select()
      .from(digPhotos)
      .where(inArray(digPhotos.digId, digIds))
      .orderBy(asc(digPhotos.createdAt));
    const map = new Map<string, string>();
    for (const r of rows) if (!map.has(r.digId)) map.set(r.digId, r.uri);
    return map;
  },

  /** Result counts grouped by Target ID for one site (the personal ID library). */
  async idLibrary(siteId?: string) {
    const where = siteId
      ? and(eq(digs.siteId, siteId), sql`${digs.targetId} is not null`)
      : sql`${digs.targetId} is not null`;
    return db
      .select({ targetId: digs.targetId, result: digs.result, n: count() })
      .from(digs)
      .where(where)
      .groupBy(digs.targetId, digs.result);
  },
};

/* ============================================================== Devices */

export const devicesRepo = {
  async list(): Promise<Device[]> {
    return db.select().from(devices).orderBy(asc(devices.createdAt));
  },

  async get(id: string): Promise<Device | undefined> {
    const [row] = await db.select().from(devices).where(eq(devices.id, id));
    return row;
  },

  async create(input: Omit<Device, 'id' | 'createdAt'>): Promise<Device> {
    const row: Device = { ...input, id: newId(), createdAt: now() };
    await db.insert(devices).values(row);
    return row;
  },

  async update(id: string, patch: Partial<Omit<Device, 'id' | 'createdAt'>>): Promise<void> {
    await db.update(devices).set(patch).where(eq(devices.id, id));
  },

  async remove(id: string): Promise<void> {
    await db.delete(devices).where(eq(devices.id, id));
  },
};

/* ========================================================== Maintenance */

export async function deleteAllData(): Promise<void> {
  await db.delete(digPhotos);
  await db.delete(digs);
  await db.delete(trackPoints);
  await db.delete(sessions);
  await db.delete(sites);
  await db.delete(devices);
}

export async function exportAllData() {
  const [allSites, allSessions, allDigs, allDevices] = await Promise.all([
    db.select().from(sites),
    db.select().from(sessions),
    db.select().from(digs),
    db.select().from(devices),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    sites: allSites,
    sessions: allSessions,
    digs: allDigs,
    devices: allDevices,
  };
}

/** Sessions that never ended (e.g. app killed) — used for recovery. */
export async function orphanSessions(): Promise<Session[]> {
  return db.select().from(sessions).where(and(ne(sessions.status, 'ended'), isNull(sessions.endedAt)));
}
