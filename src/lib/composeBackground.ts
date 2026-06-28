export async function composeBackground(
  cutout: Blob,
  color: string | null,
): Promise<Blob> {
  if (color === null) {
    return cutout;
  }

  const bitmap = await createImageBitmap(cutout);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D não disponível neste navegador.');
  }

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao exportar o PNG.'));
    }, 'image/png');
  });
}
