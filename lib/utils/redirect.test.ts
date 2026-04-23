import { describe, expect, it } from 'vitest'
import { sanitizeNext } from './redirect'

describe('sanitizeNext', () => {
  const FALLBACK = '/livres'

  it('renvoie le fallback pour null / undefined / vide', () => {
    expect(sanitizeNext(null)).toBe(FALLBACK)
    expect(sanitizeNext(undefined)).toBe(FALLBACK)
    expect(sanitizeNext('')).toBe(FALLBACK)
  })

  it('accepte un chemin relatif qui commence par /', () => {
    expect(sanitizeNext('/livres')).toBe('/livres')
    expect(sanitizeNext('/livres/la-chambre-secrete')).toBe('/livres/la-chambre-secrete')
    expect(sanitizeNext('/compte')).toBe('/compte')
  })

  it("refuse les URLs absolues (prevention d'open redirect)", () => {
    expect(sanitizeNext('http://evil.com')).toBe(FALLBACK)
    expect(sanitizeNext('https://evil.com/livres')).toBe(FALLBACK)
    expect(sanitizeNext('ftp://server/file')).toBe(FALLBACK)
  })

  it('refuse les URLs protocol-relative (//evil.com)', () => {
    expect(sanitizeNext('//evil.com')).toBe(FALLBACK)
    expect(sanitizeNext('//evil.com/livres')).toBe(FALLBACK)
  })

  it('refuse les chemins qui ne commencent pas par /', () => {
    expect(sanitizeNext('livres')).toBe(FALLBACK)
    expect(sanitizeNext('javascript:alert(1)')).toBe(FALLBACK)
    expect(sanitizeNext('data:text/html,...')).toBe(FALLBACK)
  })

  it('permet un fallback personnalise', () => {
    expect(sanitizeNext(null, '/compte')).toBe('/compte')
    expect(sanitizeNext('http://evil.com', '/compte')).toBe('/compte')
  })

  it('preserve le query string et le hash', () => {
    expect(sanitizeNext('/livres?tier=premium')).toBe('/livres?tier=premium')
    expect(sanitizeNext('/livres#top')).toBe('/livres#top')
  })

  it('ne trim pas, sauf rejet total si la chaine est un format absurde', () => {
    // On garde la forme exacte pour ne pas alterer l'intention.
    expect(sanitizeNext('/livres/ ')).toBe('/livres/ ')
  })
})
