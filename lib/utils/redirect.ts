// Sanitize un parametre `next` fourni en query string pour rediriger apres
// auth. Previent les open redirects vers un domaine arbitraire : seuls les
// chemins relatifs qui commencent par `/` (et non `//`) sont acceptes.
export function sanitizeNext(next: string | null | undefined, fallback = '/livres'): string {
  if (!next) return fallback
  if (!next.startsWith('/')) return fallback
  if (next.startsWith('//')) return fallback
  return next
}
