import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

/**
 * Single SQLite connection shared by the UI and the background location task
 * (both run in the same JS runtime). Change listener powers useLiveQuery.
 */
export const expoDb = openDatabaseSync('dedektor.db', { enableChangeListener: true });

expoDb.execSync('PRAGMA journal_mode = WAL;');
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });
export type DB = typeof db;
