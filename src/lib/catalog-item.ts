// Only public, serializable artwork data may cross into the catalog client component.
export type CatalogItem = {
  id: string | number
  slug: string
  title: string
  images?: string[]
  image: string
  width: number
  height: number
  medium: string
  availability: string
  demo: boolean
  displaySize?: number | null
}
