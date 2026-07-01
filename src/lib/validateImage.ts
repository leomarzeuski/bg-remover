const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export type ValidationErrorCode = 'unsupported-type' | 'empty-file';

export type ValidationResult =
  | { ok: true }
  | { ok: false; code: ValidationErrorCode };

export function validateImage(file: File): ValidationResult {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { ok: false, code: 'unsupported-type' };
  }
  if (file.size === 0) {
    return { ok: false, code: 'empty-file' };
  }
  return { ok: true };
}
