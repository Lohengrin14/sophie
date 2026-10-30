import {
  commitTransaction,
  createLocalReq,
  getFieldsToSign,
  initTransaction,
  jwtSign,
  killTransaction,
  type Payload,
} from 'payload'
import { addSessionToUser, generatePayloadCookie } from 'payload/shared'
import type { User } from '@/payload-types'

export class StaffLoginDenied extends Error {}

// Called only after Supabase has verified the Google identity on the server.
// No user creation, password changes, or role/permission changes take place here.
export async function googlePayloadSession(payload: Payload, email: string) {
  const collectionConfig = payload.collections.users.config
  const req = await createLocalReq({}, payload)
  const doc = (await payload.db.findOne({
    collection: 'users',
    req,
    where: { email: { equals: email } },
  })) as (User & { _verified?: boolean }) | null
  if (!doc || (doc.lockUntil && new Date(doc.lockUntil).getTime() > Date.now()))
    throw new StaffLoginDenied()
  if (collectionConfig.auth.verify && !doc._verified) throw new StaffLoginDenied()
  const shouldCommit = await initTransaction(req)
  try {
    let user = { ...doc, collection: 'users' as const } as User & { collection: 'users' }
    for (const hook of collectionConfig.hooks.beforeLogin ?? [])
      user = (await hook({ collection: collectionConfig, context: req.context, req, user })) || user
    const { sid } = await addSessionToUser({ collectionConfig, payload, req, user })
    const { token } = await jwtSign({
      fieldsToSign: getFieldsToSign({ collectionConfig, email, sid, user }),
      secret: payload.secret,
      tokenExpiration: collectionConfig.auth.tokenExpiration,
    })
    req.user = Object.assign(user, { _sid: sid })
    for (const hook of collectionConfig.hooks.afterLogin ?? [])
      await hook({ collection: collectionConfig, context: req.context, req, token, user })
    const cookie = generatePayloadCookie({
      collectionAuthConfig: collectionConfig.auth,
      cookiePrefix: payload.config.cookiePrefix,
      token,
    })
    if (shouldCommit) await commitTransaction(req)
    return cookie
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}
