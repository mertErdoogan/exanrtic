import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useMemo, useRef, useState } from 'react';

import { trackRepo } from '@/db/repo';
import type { TrackPoint } from '@/db/schema';
import { cleanTrack, computeCoverage, pathLengthM } from '@/lib/geo';

/**
 * Live track for a session. Loads once, then appends rows written by the
 * background task (it listens for SQLite changes on track_points).
 * Coverage is recomputed at most every few seconds to keep the UI smooth.
 */
export function useTrack(sessionId: string | undefined, sweepWidthM: number) {
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const lastId = useRef(0);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      const rows = await trackRepo.forSession(sessionId);
      if (cancelled) return;
      lastId.current = rows.at(-1)?.id ?? 0;
      setPoints(rows);
    };

    const loadNew = async () => {
      const fresh = await trackRepo.after(sessionId, lastId.current);
      if (cancelled) return;
      if (fresh.length) {
        lastId.current = fresh.at(-1)?.id ?? lastId.current;
        setPoints((prev) => [...prev, ...fresh]);
      }
    };

    void load();
    const sub = addDatabaseChangeListener((e) => {
      if (e.tableName !== 'track_points') return;
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        void loadNew();
      }, 1500);
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, [sessionId]);

  const cleaned = useMemo(() => cleanTrack(points), [points]);
  const distanceM = useMemo(() => pathLengthM(cleaned), [cleaned]);
  const coverage = useMemo(() => computeCoverage(cleaned, sweepWidthM), [cleaned, sweepWidthM]);
  const lastAccuracy = points.at(-1)?.accuracy ?? null;

  return { points: cleaned, rawCount: points.length, distanceM, coverage, lastAccuracy };
}
