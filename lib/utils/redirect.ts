// Sanitizes a `next` query-string parameter used to redirect after auth.
// Prevents open redirects to an arbitrary domain: only relative paths
// that start with `/` (and not `//`) are accepted.
export function sanitizeNext(next: string | null | undefined, fallback = '/books'): string {
  if (!next) return fallback
  if (!next.startsWith('/')) return fallback
  if (next.startsWith('//')) return fallback
  return next
}
