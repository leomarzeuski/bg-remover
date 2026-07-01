import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

export type ProgressCallback = (progress: number, stage?: string) => void;

export async function removeBackground(
  file: File,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  return imglyRemoveBackground(file, {
    progress: (key, current, total) => {
      if (onProgress && total > 0) {
        onProgress(current / total, key);
      }
    },
  });
}
