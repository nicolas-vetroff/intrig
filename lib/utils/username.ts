// Username rules: 3-32 characters, letters / digits / _ / - only. We
// normalize to lowercase before storing: uniform comparison on the DB
// UNIQUE constraint and consistent display.
const USERNAME_PATTERN = /^[a-z0-9_-]{3,32}$/

export type UsernameValidation = { ok: true; value: string } | { ok: false; message: string }

export function validateUsername(input: string | null | undefined): UsernameValidation {
  if (typeof input !== 'string') {
    return { ok: false, message: 'Pseudo manquant.' }
  }
  const normalized = input.trim().toLowerCase()

  if (normalized.length < 3) {
    return { ok: false, message: 'Le pseudo doit contenir au moins 3 caractères.' }
  }
  if (normalized.length > 32) {
    return { ok: false, message: 'Le pseudo ne doit pas dépasser 32 caractères.' }
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return {
      ok: false,
      message: 'Pseudo invalide : lettres, chiffres, tirets et underscores uniquement.',
    }
  }

  return { ok: true, value: normalized }
}
