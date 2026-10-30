import type { Artwork, Media } from '@/payload-types'

export async function studioAPI<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', ...init })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) throw new Error('Сессия закончилась. Войдите в мастерскую ещё раз.')
    if (response.status === 403) throw new Error('Недостаточно прав. Обратитесь к администратору.')
    const detail = data.errors
      ?.flatMap(
        (error: { message?: string; data?: { errors?: { message: string }[] } }) =>
          error.data?.errors?.map((item) => item.message) ?? [error.message],
      )
      .filter(Boolean)
      .join(' ')
    throw new Error(detail || 'Не удалось сохранить. Проверьте соединение и попробуйте ещё раз.')
  }
  return data as T
}

export const contentQuery = (locale: string) => `locale=${locale}&fallback-locale=none&depth=1`
export const jsonRequest = (method: string, data: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
export type Page<T> = { docs: T[]; page: number; totalPages: number; totalDocs: number }
export function galleryImages(work: Artwork): Media[] {
  const values = [work.image, ...(work.images || [])]
  const images = values.filter((value): value is Media =>
    Boolean(value && typeof value === 'object' && value.url),
  )
  return [...new Map(images.map((image) => [image.id, image])).values()]
}
export async function uploadArtImage(file: File, title: string, locale: string) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
    throw new Error('Выберите JPG, PNG или WebP размером до 5 МБ.')
  const form = new FormData()
  form.set('_payload', JSON.stringify({ alt: title || file.name }))
  form.set('file', file)
  const result = await studioAPI<{ doc: Media }>(`/api/media?locale=${locale}`, {
    method: 'POST',
    body: form,
  })
  return result.doc
}
