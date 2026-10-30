import { describe, expect, it } from 'vitest'
import { can, isAdmin, sections } from '../src/lib/studio-access'
describe('section permissions', () => {
  it('denies anonymous and unassigned staff access', () => {
    for (const section of sections) {
      expect(can(null, section)).toBe(false)
      expect(can({ role: 'staff' }, section)).toBe(false)
    }
  })
  it('keeps legacy owner access and grants administrators all sections', () => {
    for (const role of [null, 'admin'])
      for (const section of sections) expect(can({ role }, section, 'edit')).toBe(true)
  })
  it('supports read-only and independent section access', () => {
    const user = {
      role: 'staff',
      permissions: { gallery: { read: true }, requests: { edit: true } },
    }
    expect(can(user, 'gallery')).toBe(true)
    expect(can(user, 'gallery', 'edit')).toBe(false)
    expect(can(user, 'requests')).toBe(true)
    expect(can(user, 'users')).toBe(false)
    expect(isAdmin(user)).toBe(false)
  })
})
