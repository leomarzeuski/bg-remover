import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import { createProgressTracker, type ProgressPhase } from './progress';

export type ProgressCallback = (progress: number, phase: ProgressPhase) => void;

export async function removeBackground(
  file: File,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  const track = createProgressTracker();
  return imglyRemoveBackground(file, {
    progress: (key, current, total) => {
      if (!onProgress || total <= 0) return;
      const { progress, phase } = track(key, current, total);
      onProgress(progress, phase);
    },
  });
}
