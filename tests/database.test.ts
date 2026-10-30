import { describe, expect, it } from 'vitest'
import { databaseOptions } from '../src/lib/database'

describe('database configuration', () => {
  const env = {
    DATABASE_TARGET: 'supabase',
    SUPABASE_DB_HOST: 'example.pooler.supabase.com',
    SUPABASE_DB_USER: 'postgres.example',
    SUPABASE_DB_PASSWORD: 'a@b:c/d?#%$ space',
    DATABASE_SSL_CA: 'test certificate',
    DATABASE_URL: 'postgresql://localhost/local-db',
  }
  it('encodes credentials without accidentally using the local database', () => {
    const options = databaseOptions(env)
    const url = new URL(options.pool.connectionString!)
    expect(url.hostname).toBe(env.SUPABASE_DB_HOST)
    expect(decodeURIComponent(url.password)).toBe(env.SUPABASE_DB_PASSWORD)
    expect(url.pathname).toBe('/postgres')
    expect(url.port).toBe('6543')
    expect(options.pool.ssl).toEqual({ ca: 'test certificate', rejectUnauthorized: true })
    expect(options.pool.max).toBe(3)
    expect(options.push).toBe(false)
    expect(options.disableCreateDatabase).toBe(true)
  })
  it('honors an explicitly selected session port for persistent processes and migrations', () => {
    const options = databaseOptions({ ...env, SUPABASE_DB_PORT: '5432' })
    expect(new URL(options.pool.connectionString!).port).toBe('5432')
    expect(options.pool.max).toBe(3)
    expect(() => databaseOptions({ ...env, DATABASE_POOL_MAX: '1' })).toThrow('at least 2')
  })
  it('refuses remote connections without credentials or a trusted CA', () => {
    expect(() => databaseOptions({ ...env, SUPABASE_DB_PASSWORD: '' })).toThrow(
      'SUPABASE_DB_PASSWORD',
    )
    expect(() => databaseOptions({ ...env, DATABASE_SSL_CA: '' })).toThrow('DATABASE_SSL_CA')
  })
  it('keeps local development on its original database', () => {
    expect(databaseOptions({ DATABASE_URL: env.DATABASE_URL })).toEqual({
      pool: { connectionString: env.DATABASE_URL },
      push: undefined,
    })
  })
})
