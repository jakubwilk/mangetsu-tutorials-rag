import { describe, expect, it } from 'vitest'

import { maskEmail } from './maskEmail'

describe('maskEmail', () => {
  it('masks the local part and domain name, keeping the TLD visible', () => {
    expect(maskEmail('jw@jakubwilk.pl')).toBe('j****@j****.pl')
  })

  it('always uses exactly four asterisks regardless of part length', () => {
    expect(maskEmail('a@b.com')).toBe('a****@b****.com')
    expect(maskEmail('averylongname@averylongdomain.co.uk')).toBe('a****@a****.uk')
  })

  it('returns an empty string for null', () => {
    expect(maskEmail(null)).toBe('')
  })

  it('returns the input unchanged when it has no "@"', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email')
  })

  it('keeps the domain unmasked-suffix behavior when there is no dot in the domain', () => {
    expect(maskEmail('user@localhost')).toBe('u****@l****')
  })
})
