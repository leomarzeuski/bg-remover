import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

export async function removeBackground(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  return imglyRemoveBackground(file, {
    progress: (_key, current, total) => {
      if (onProgress && total > 0) {
        onProgress(current / total);
      }
    },
  });
}
