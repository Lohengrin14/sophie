import '@payloadcms/next/css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@/styles/studio-admin.css'
import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'
import { importMap } from './admin/importMap.js'

const invoke: ServerFunctionClient = async (input) => {
  'use server'
  return handleServerFunctions({ config, importMap, ...input })
}
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={invoke}>
      {children}
    </RootLayout>
  )
}
