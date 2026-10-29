import config from '@payload-config'
import { generatePageMetadata, RootPage } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'
type Props = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}
export function generateMetadata(props: Props) {
  return generatePageMetadata({ config, ...props })
}
export default function AdminPage(props: Props) {
  return RootPage({ config, importMap, ...props })
}
