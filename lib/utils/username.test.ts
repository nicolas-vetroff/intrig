import { describe, expect, it } from 'vitest'
import { validateUsername } from './username'

describe('validateUsername', () => {
  it('accepts a lowercase username of 3 to 32 characters', () => {
    const r = validateUsername('alice')
    expect(r).toEqual({ ok: true, value: 'alice' })
  })

  it('allows digits, hyphens and underscores', () => {
    expect(validateUsername('bob_42')).toEqual({ ok: true, value: 'bob_42' })
    expect(validateUsername('anon-reader')).toEqual({ ok: true, value: 'anon-reader' })
  })

  it('trims surrounding spaces before validation', () => {
    expect(validateUsername('  alice  ')).toEqual({ ok: true, value: 'alice' })
  })

  it('normalizes to lowercase', () => {
    expect(validateUsername('Alice')).toEqual({ ok: true, value: 'alice' })
    expect(validateUsername('ALICE_42')).toEqual({ ok: true, value: 'alice_42' })
  })

  it('rejects usernames that are too short', () => {
    const r = validateUsername('ab')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/3/)
  })

  it('rejects usernames that are too long (> 32)', () => {
    const r = validateUsername('a'.repeat(33))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/32/)
  })

  it('accepts exactly 3 and 32 characters', () => {
    expect(validateUsername('abc').ok).toBe(true)
    expect(validateUsername('a'.repeat(32)).ok).toBe(true)
  })

  it('rejects accents, inner spaces and punctuation', () => {
    expect(validateUsername('alice!').ok).toBe(false)
    expect(validateUsername('alice bob').ok).toBe(false)
    expect(validateUsername('héloïse').ok).toBe(false)
    expect(validateUsername('al.ice').ok).toBe(false)
  })

  it('rejects empty strings and null/undefined', () => {
    expect(validateUsername('').ok).toBe(false)
    expect(validateUsername('   ').ok).toBe(false)
    expect(validateUsername(null).ok).toBe(false)
    expect(validateUsername(undefined).ok).toBe(false)
  })
})
