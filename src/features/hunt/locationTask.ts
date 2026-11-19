import type { LocationObject } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { sessionsRepo, trackRepo } from '@/db/repo';

/**
 * Background location task. Must be imported at module top level from the
 * root layout so it is registered on every launch, including when the OS
 * wakes the app in the background to deliver locations.
 */
export const HUNT_LOCATION_TASK = 'hunt-location-updates';

type TaskData = { locations?: LocationObject[] };

TaskManager.defineTask<TaskData>(HUNT_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  try {
    const session = await sessionsRepo.getActive();
    // Paused hunts keep the task alive for a quick resume but record nothing.
    if (!session || session.status !== 'active') return;
    await trackRepo.append(
      session.id,
      session.segment,
      data.locations.map((l) => ({
        ts: l.timestamp,
        lat: l.coords.latitude,
        lng: l.coords.longitude,
        accuracy: l.coords.accuracy ?? null,
      })),
    );
  } catch (e) {
    // Never throw from a background task; a failed batch must not kill tracking.
    console.warn('[hunt-location] failed to store batch', e);
  }
});
