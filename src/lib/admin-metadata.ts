import { adminEnglish } from './admin-english'
import { technicalEnglish } from './admin-technical-english'
const keys = new Set(['label', 'description', 'placeholder', 'group', 'singular', 'plural'])
// Translate configuration metadata only. Stored artwork and customer data never pass here.
export function localizeAdminMetadata<T>(value: T, key = ''): T {
  if (typeof value === 'string' && keys.has(key) && /[А-Яа-яЁё]/.test(value))
    return { ru: value, en: adminEnglish[value] || technicalEnglish[value] || value } as T
  if (Array.isArray(value)) return value.map((item) => localizeAdminMetadata(item)) as T
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, value]) => [key, localizeAdminMetadata(value, key)]),
    ) as T
  return value
}
