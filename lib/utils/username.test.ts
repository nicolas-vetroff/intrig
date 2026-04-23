import { describe, expect, it } from 'vitest'
import { validateUsername } from './username'

describe('validateUsername', () => {
  it('accepte un pseudo minuscule de 3 a 32 caracteres', () => {
    const r = validateUsername('alice')
    expect(r).toEqual({ ok: true, value: 'alice' })
  })

  it('autorise chiffres, tirets et underscores', () => {
    expect(validateUsername('bob_42')).toEqual({ ok: true, value: 'bob_42' })
    expect(validateUsername('lecteur-anonyme')).toEqual({ ok: true, value: 'lecteur-anonyme' })
  })

  it('trim les espaces de bordure avant validation', () => {
    expect(validateUsername('  alice  ')).toEqual({ ok: true, value: 'alice' })
  })

  it('passe en minuscules', () => {
    expect(validateUsername('Alice')).toEqual({ ok: true, value: 'alice' })
    expect(validateUsername('ALICE_42')).toEqual({ ok: true, value: 'alice_42' })
  })

  it('refuse les pseudos trop courts', () => {
    const r = validateUsername('ab')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/3/)
  })

  it('refuse les pseudos trop longs (> 32)', () => {
    const r = validateUsername('a'.repeat(33))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/32/)
  })

  it('accepte exactement 3 et 32 caracteres', () => {
    expect(validateUsername('abc').ok).toBe(true)
    expect(validateUsername('a'.repeat(32)).ok).toBe(true)
  })

  it('refuse les accents, espaces internes et ponctuation', () => {
    expect(validateUsername('alice!').ok).toBe(false)
    expect(validateUsername('alice bob').ok).toBe(false)
    expect(validateUsername('héloïse').ok).toBe(false)
    expect(validateUsername('al.ice').ok).toBe(false)
  })

  it('refuse une chaine vide ou null/undefined', () => {
    expect(validateUsername('').ok).toBe(false)
    expect(validateUsername('   ').ok).toBe(false)
    expect(validateUsername(null).ok).toBe(false)
    expect(validateUsername(undefined).ok).toBe(false)
  })
})
