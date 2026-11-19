import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Local-first schema. Everything the user records lives on the phone.
 * Timestamps are epoch milliseconds. IDs are UUIDs so rows can be synced
 * to the cloud later without collisions.
 */

export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
  catalogId: text('catalog_id'),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  technology: text('technology', { enum: ['vlf', 'smf', 'pi', 'other'] }).notNull(),
  frequencies: text('frequencies'),
  coil: text('coil'),
  serial: text('serial'),
  purchasedAt: integer('purchased_at'),
  warrantyMonths: integer('warranty_months'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
});

export const sites = sqliteTable('sites', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  centerLat: real('center_lat').notNull(),
  centerLng: real('center_lng').notNull(),
  notes: text('notes'),
  ownerName: text('owner_name'),
  ownerContact: text('owner_contact'),
  permitFrom: integer('permit_from'),
  permitUntil: integer('permit_until'),
  permitPhotoUri: text('permit_photo_uri'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    deviceId: text('device_id').references(() => devices.id, { onDelete: 'set null' }),
    status: text('status', { enum: ['active', 'paused', 'ended'] }).notNull(),
    target: text('target', { enum: ['coin', 'jewelry', 'relic', 'gold', 'general'] })
      .notNull()
      .default('general'),
    sweepWidthM: real('sweep_width_m').notNull(),
    distanceM: real('distance_m').notNull().default(0),
    coveredM2: real('covered_m2').notNull().default(0),
    segment: integer('segment').notNull().default(0),
    startedAt: integer('started_at').notNull(),
    endedAt: integer('ended_at'),
    notes: text('notes'),
  },
  (t) => [index('sessions_site_idx').on(t.siteId), index('sessions_status_idx').on(t.status)],
);

export const trackPoints = sqliteTable(
  'track_points',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    segment: integer('segment').notNull().default(0),
    ts: integer('ts').notNull(),
    lat: real('lat').notNull(),
    lng: real('lng').notNull(),
    accuracy: real('accuracy'),
  },
  (t) => [index('track_points_session_idx').on(t.sessionId, t.ts)],
);

export const DIG_RESULTS = ['coin', 'jewelry', 'relic', 'trash', 'empty', 'unknown'] as const;
export type DigResult = (typeof DIG_RESULTS)[number];

export const digs = sqliteTable(
  'digs',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    ts: integer('ts').notNull(),
    lat: real('lat').notNull(),
    lng: real('lng').notNull(),
    accuracy: real('accuracy'),
    result: text('result', { enum: DIG_RESULTS }).notNull().default('unknown'),
    targetId: integer('target_id'),
    depthCm: integer('depth_cm'),
    title: text('title'),
    note: text('note'),
    voiceUri: text('voice_uri'),
  },
  (t) => [index('digs_session_idx').on(t.sessionId), index('digs_site_idx').on(t.siteId)],
);

export const digPhotos = sqliteTable('dig_photos', {
  id: text('id').primaryKey(),
  digId: text('dig_id')
    .notNull()
    .references(() => digs.id, { onDelete: 'cascade' }),
  uri: text('uri').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type Device = typeof devices.$inferSelect;
export type Site = typeof sites.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type TrackPoint = typeof trackPoints.$inferSelect;
export type Dig = typeof digs.$inferSelect;
export type DigPhoto = typeof digPhotos.$inferSelect;
