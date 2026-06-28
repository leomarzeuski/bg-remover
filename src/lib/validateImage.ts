const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export type ValidationResult = { ok: true } | { ok: false; message: string };

export function validateImage(file: File): ValidationResult {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { ok: false, message: 'Formato não suportado. Use PNG, JPG ou WebP.' };
  }
  if (file.size === 0) {
    return { ok: false, message: 'Arquivo vazio. Escolha outra imagem.' };
  }
  return { ok: true };
}
