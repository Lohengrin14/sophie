// Only public, serializable artwork data may cross into the catalog client component.
export type CatalogItem = {
  id: string | number
  slug: string
  title: string
  image: string
  width: number
  height: number
  priceMinor: number
  currency: string
  medium: string
  availability: string
  demo: boolean
}
