import { describe, expect, it } from 'vitest'
import { storagePlugins, storageSettings } from '../src/lib/storage'

describe('cloud storage configuration', () => {
  const env = {
    DATABASE_TARGET: 'supabase',
    STORAGE_TARGET: 'supabase',
    S3_ENDPOINT: 'https://example.storage.supabase.co/storage/v1/s3',
    S3_REGION: 'eu-west-1',
    S3_ACCESS_KEY_ID: 'test-access-key',
    S3_SECRET_ACCESS_KEY: 'test-secret',
  }
  it('keeps local uploads local and cloud uploads explicit', () => {
    expect(storageSettings({}).enabled).toBe(false)
    expect(() => storageSettings({ DATABASE_TARGET: 'supabase' })).toThrow('STORAGE_TARGET')
    expect(() => storageSettings({ ...env, S3_SECRET_ACCESS_KEY: '' })).toThrow(
      'S3_SECRET_ACCESS_KEY',
    )
    expect(() => storageSettings({ ...env, S3_BUCKET_REFERENCES: 'artworks' })).toThrow(
      'separate buckets',
    )
  })
  it('uses separate buckets with S3 path addressing', () => {
    const settings = storageSettings(env)
    expect(settings.buckets).toEqual({ media: 'artworks', references: 'references' })
    expect(settings.config.forcePathStyle).toBe(true)
    expect(() => storageSettings({ ...env, S3_ENDPOINT: 'http://example.com' })).toThrow('HTTPS')
  })
  it('preserves Payload file access checks and keeps schemas consistent in both environments', () => {
    const collections = [
      { slug: 'media', fields: [], upload: {} },
      { slug: 'references', fields: [], upload: {} },
    ]
    for (const settings of [{}, env]) {
      let config: any = { collections: structuredClone(collections) }
      for (const plugin of storagePlugins(settings)) config = plugin(config)
      for (const collection of config.collections) {
        expect(collection.fields.some((field: any) => field.name === 'prefix')).toBe(true)
        expect(collection.upload.disableLocalStorage).toBe(settings === env ? true : undefined)
      }
      expect(config.endpoints || []).toHaveLength(0)
    }
  })
})
