import * as Location from 'expo-location';

import { sessionsRepo, sitesRepo, trackRepo } from '@/db/repo';
import type { Session } from '@/db/schema';
import { cleanTrack, computeCoverage, pathLengthM } from '@/lib/geo';

import { HUNT_LOCATION_TASK } from './locationTask';

export type PermissionLevel = 'always' | 'foreground' | 'denied';

/** Foreground first, then background ("Always"), as both platforms require. */
export async function ensureLocationPermission(): Promise<PermissionLevel> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'denied';
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted' ? 'always' : 'foreground';
}

export async function currentPosition(timeoutMs = 6000) {
  const fresh = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  const result = await Promise.race([fresh, timeout]);
  if (result) return result;
  return Location.getLastKnownPositionAsync({ maxAge: 60_000 });
}

async function startUpdates(level: PermissionLevel, notificationTitle: string, notificationBody: string) {
  const running = await Location.hasStartedLocationUpdatesAsync(HUNT_LOCATION_TASK);
  if (running) return;
  await Location.startLocationUpdatesAsync(HUNT_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    distanceInterval: 2,
    timeInterval: 3000,
    activityType: Location.ActivityType.Fitness,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: level === 'always',
    foregroundService: {
      notificationTitle,
      notificationBody,
      notificationColor: '#15130F',
    },
  });
}

async function stopUpdates() {
  if (await Location.hasStartedLocationUpdatesAsync(HUNT_LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(HUNT_LOCATION_TASK);
  }
}

export type StartHuntInput = {
  site: { id: string } | { name: string; lat: number; lng: number };
  deviceId: string | null;
  target: Session['target'];
  sweepWidthM: number;
  permission: PermissionLevel;
  notification: { title: string; body: string };
};

export async function startHunt(input: StartHuntInput): Promise<Session> {
  const existing = await sessionsRepo.getActive();
  if (existing) return existing;
  const siteId = 'id' in input.site ? input.site.id : (await sitesRepo.create(input.site)).id;
  const session = await sessionsRepo.create({
    siteId,
    deviceId: input.deviceId,
    target: input.target,
    sweepWidthM: input.sweepWidthM,
  });
  await startUpdates(input.permission, input.notification.title, input.notification.body);
  return session;
}

export async function pauseHunt(session: Session): Promise<void> {
  await sessionsRepo.update(session.id, { status: 'paused' });
}

/** Resuming starts a new segment so the paused gap is not drawn as a line. */
export async function resumeHunt(session: Session, permission: PermissionLevel, notification: { title: string; body: string }) {
  await sessionsRepo.update(session.id, { status: 'active', segment: session.segment + 1 });
  await startUpdates(permission, notification.title, notification.body);
}

/** Final stats are computed from the cleaned track and stored on the session. */
export async function finishHunt(session: Session): Promise<void> {
  await stopUpdates();
  const raw = await trackRepo.forSession(session.id);
  const track = cleanTrack(raw);
  const coverage = computeCoverage(track, session.sweepWidthM);
  await sessionsRepo.update(session.id, {
    status: 'ended',
    endedAt: Date.now(),
    distanceM: pathLengthM(track),
    coveredM2: coverage.areaM2,
  });
}

/**
 * Called on launch: if a hunt is still active (app was killed or the phone
 * restarted), make sure location updates are running again.
 */
export async function recoverActiveHunt(notification: { title: string; body: string }): Promise<Session | undefined> {
  const session = await sessionsRepo.getActive();
  if (!session) {
    await stopUpdates();
    return undefined;
  }
  if (session.status === 'active') {
    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.status === 'granted') {
      const bg = await Location.getBackgroundPermissionsAsync();
      await startUpdates(bg.status === 'granted' ? 'always' : 'foreground', notification.title, notification.body);
    }
  }
  return session;
}
