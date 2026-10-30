'use client'
import { useTranslation } from '@payloadcms/ui'
import { technicalEnglish } from '@/lib/admin-technical-english'
import { adminEnglish } from '@/lib/admin-english'
export function useAdminText() {
  const { i18n } = useTranslation()
  return (value: string) => {
    if (i18n.language !== 'en') return value
    if (adminEnglish[value] || technicalEnglish[value])
      return adminEnglish[value] || technicalEnglish[value]
    return Object.keys(adminEnglish)
      .filter((key) => key.length > 3)
      .sort((a, b) => b.length - a.length)
      .reduce((text, key) => text.replaceAll(key, adminEnglish[key]), value)
  }
}
export function useAdminLocale(): 'ru' | 'en' {
  return useTranslation().i18n.language === 'en' ? 'en' : 'ru'
}
