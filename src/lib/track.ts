import { track as vercelTrack } from '@vercel/analytics';

export type TrackEvent = 'process_done' | 'download' | 'sample_used';

// Analytics nunca pode quebrar o app (ex.: bloqueadores de script).
export function track(event: TrackEvent) {
  try {
    vercelTrack(event);
  } catch {
    /* noop */
  }
}
