import { describe, expect, it } from 'vitest'
import { sanitizeNext } from './redirect'

describe('sanitizeNext', () => {
  const FALLBACK = '/books'

  it('returns the fallback for null / undefined / empty', () => {
    expect(sanitizeNext(null)).toBe(FALLBACK)
    expect(sanitizeNext(undefined)).toBe(FALLBACK)
    expect(sanitizeNext('')).toBe(FALLBACK)
  })

  it('accepts a relative path that starts with /', () => {
    expect(sanitizeNext('/books')).toBe('/books')
    expect(sanitizeNext('/books/la-chambre-secrete')).toBe('/books/la-chambre-secrete')
    expect(sanitizeNext('/account')).toBe('/account')
  })

  it('rejects absolute URLs (open-redirect prevention)', () => {
    expect(sanitizeNext('http://evil.com')).toBe(FALLBACK)
    expect(sanitizeNext('https://evil.com/books')).toBe(FALLBACK)
    expect(sanitizeNext('ftp://server/file')).toBe(FALLBACK)
  })

  it('rejects protocol-relative URLs (//evil.com)', () => {
    expect(sanitizeNext('//evil.com')).toBe(FALLBACK)
    expect(sanitizeNext('//evil.com/books')).toBe(FALLBACK)
  })

  it('rejects paths that do not start with /', () => {
    expect(sanitizeNext('books')).toBe(FALLBACK)
    expect(sanitizeNext('javascript:alert(1)')).toBe(FALLBACK)
    expect(sanitizeNext('data:text/html,...')).toBe(FALLBACK)
  })

  it('allows a custom fallback', () => {
    expect(sanitizeNext(null, '/account')).toBe('/account')
    expect(sanitizeNext('http://evil.com', '/account')).toBe('/account')
  })

  it('preserves the query string and hash', () => {
    expect(sanitizeNext('/books?tier=premium')).toBe('/books?tier=premium')
    expect(sanitizeNext('/books#top')).toBe('/books#top')
  })

  it('does not trim, unless the string is an outright bogus format', () => {
    // Preserve the exact form so we do not alter intent.
    expect(sanitizeNext('/books/ ')).toBe('/books/ ')
  })
})
