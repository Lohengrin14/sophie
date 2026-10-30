import type { S3ClientConfig } from '@aws-sdk/client-s3'
import { s3Storage } from '@payloadcms/storage-s3'

export function storageSettings(env: Record<string, string | undefined> = process.env): {
  enabled: boolean
  buckets: { media: string; references: string }
  config: S3ClientConfig
} {
  const enabled = env.STORAGE_TARGET === 'supabase'
  if (env.STORAGE_TARGET && !['local', 'supabase'].includes(env.STORAGE_TARGET)) {
    throw new Error('Unknown STORAGE_TARGET; use local or supabase')
  }
  if (env.DATABASE_TARGET === 'supabase' && !enabled) {
    throw new Error('Supabase preview requires STORAGE_TARGET=supabase for persistent uploads')
  }
  const buckets = {
    media: env.S3_BUCKET_ARTWORKS || 'artworks',
    references: env.S3_BUCKET_REFERENCES || 'references',
  }
  if (buckets.media === buckets.references)
    throw new Error('Public images and private references need separate buckets')
  if (!enabled)
    return { enabled, buckets, config: { region: 'eu-west-1' } satisfies S3ClientConfig }
  for (const key of ['S3_ENDPOINT', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']) {
    if (!env[key]) throw new Error(`Missing storage setting: ${key}`)
  }
  const endpoint = new URL(env.S3_ENDPOINT!)
  if (
    endpoint.protocol !== 'https:' ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash
  ) {
    throw new Error('S3_ENDPOINT must be an HTTPS address without credentials or query parameters')
  }
  const config: S3ClientConfig = {
    endpoint: endpoint.href.replace(/\/$/, ''),
    region: env.S3_REGION,
    forcePathStyle: true,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID!, secretAccessKey: env.S3_SECRET_ACCESS_KEY! },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  }
  return { enabled, buckets, config }
}

export function storagePlugins(env: Record<string, string | undefined> = process.env) {
  const { enabled, buckets, config } = storageSettings(env)
  return (['media', 'references'] as const).map((collection) =>
    s3Storage({
      enabled,
      alwaysInsertFields: true,
      bucket: buckets[collection],
      config,
      collections: { [collection]: { disablePayloadAccessControl: false } },
      signedDownloads: false,
      clientUploads: false,
    }),
  )
}
