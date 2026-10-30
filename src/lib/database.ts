import { readFileSync } from 'node:fs'
import type { PostgresAdapterArgs } from '@payloadcms/db-postgres'

export function databaseOptions(
  env: Record<string, string | undefined> = process.env,
): PostgresAdapterArgs {
  if (env.DATABASE_TARGET && !['local', 'supabase'].includes(env.DATABASE_TARGET)) {
    throw new Error('Unknown DATABASE_TARGET; use local or supabase')
  }
  const configuredMax = env.DATABASE_POOL_MAX ? Number(env.DATABASE_POOL_MAX) : undefined
  if (configuredMax !== undefined && (!Number.isInteger(configuredMax) || configuredMax < 2)) {
    throw new Error('DATABASE_POOL_MAX must be an integer of at least 2 for Payload')
  }
  if (env.DATABASE_TARGET !== 'supabase') {
    return {
      pool: {
        connectionString: env.DATABASE_URL,
        ...(configuredMax ? { max: configuredMax } : {}),
      },
      push: env.DATABASE_PUSH === 'false' ? false : undefined,
    }
  }

  for (const key of ['SUPABASE_DB_HOST', 'SUPABASE_DB_USER', 'SUPABASE_DB_PASSWORD']) {
    if (!env[key]) throw new Error(`Missing database setting: ${key}`)
  }
  const ca =
    env.DATABASE_SSL_CA ||
    (env.DATABASE_SSL_CA_FILE ? readFileSync(env.DATABASE_SSL_CA_FILE, 'utf8') : undefined)
  if (!ca) throw new Error('Supabase requires DATABASE_SSL_CA or DATABASE_SSL_CA_FILE')

  const url = new URL('postgresql://localhost')
  url.hostname = env.SUPABASE_DB_HOST!
  url.port = env.SUPABASE_DB_PORT || '5432'
  url.pathname = '/' + encodeURIComponent(env.SUPABASE_DB_NAME || 'postgres')
  url.username = encodeURIComponent(env.SUPABASE_DB_USER!)
  url.password = encodeURIComponent(env.SUPABASE_DB_PASSWORD!)

  return {
    pool: {
      connectionString: url.href,
      ssl: { ca, rejectUnauthorized: true },
      // Payload 3.92 retains a control connection; leave capacity for queries and transactions.
      max: configuredMax || 3,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 10000,
    },
    push: false,
    disableCreateDatabase: true,
  }
}
