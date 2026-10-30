import { describe, expect, it } from 'vitest'
import { localizeAdminMetadata } from '../src/lib/admin-metadata'
describe('admin configuration translations', () => {
  it('translates interface metadata while preserving stored values and hooks', () => {
    const hook = () => true
    const source = { label: 'Галерея', value: 'Галерея', access: hook }
    const result = localizeAdminMetadata(source)
    expect(result.label).toEqual({ ru: 'Галерея', en: 'Gallery' })
    expect(result.value).toBe('Галерея')
    expect(result.access).toBe(hook)
    expect(source.label).toBe('Галерея')
  })
  it('translates nested fields, options and technical descriptions', () => {
    const result = localizeAdminMetadata({
      fields: [
        {
          name: 'role',
          label: 'Роль',
          options: [{ value: 'staff', label: 'Сотрудник' }],
          admin: { description: 'Видно только вам. Помогает быстро найти нужные расценки.' },
        },
      ],
    })
    expect(result.fields[0].name).toBe('role')
    expect(result.fields[0].options[0].label).toEqual({ ru: 'Сотрудник', en: 'Staff member' })
    expect(result.fields[0].admin.description).toEqual({
      ru: 'Видно только вам. Помогает быстро найти нужные расценки.',
      en: 'Internal name to help find the right price guide.',
    })
  })
})
