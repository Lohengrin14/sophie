export const sections = ['artist', 'gallery', 'users', 'quotes', 'requests'] as const
export type Section = (typeof sections)[number]
export type StudioUser = {
  id?: number
  role?: string | null
  permissions?: Partial<Record<Section, { read?: boolean | null; edit?: boolean | null }>> | null
}
export const isAdmin = (user?: StudioUser | null) =>
  Boolean(user && (user.role === 'admin' || user.role == null))
export function can(
  user: StudioUser | null | undefined,
  section: Section,
  action: 'read' | 'edit' = 'read',
) {
  return Boolean(
    user &&
    (isAdmin(user) ||
      user.permissions?.[section]?.[action] ||
      (action === 'read' && user.permissions?.[section]?.edit)),
  )
}
export const sectionNames: Record<Section, string> = {
  artist: 'Художник',
  gallery: 'Галерея',
  users: 'Сотрудники',
  quotes: 'Цены и сроки',
  requests: 'Заявки',
}
