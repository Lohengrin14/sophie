import { z } from 'zod'

export const choicesSchema = z.object({
  subject: z.enum(['portrait', 'landscape', 'still-life', 'other']),
  medium: z.enum(['oil', 'acrylic', 'unsure']),
  size: z.enum(['30x40', '40x40', '50x70', 'custom', 'unsure']),
})
export const requestSchema = z
  .object({
    kind: z.enum(['purchase', 'commission', 'question']),
    locale: z.enum(['ru', 'en']),
    name: z.string().trim().max(100).default(''),
    channel: z.enum(['email', 'telegram', 'instagram']),
    contact: z.string().trim().min(3).max(150),
    message: z.string().trim().max(3000).default(''),
    artworkId: z.coerce.number().int().positive().optional(),
    subject: choicesSchema.shape.subject.optional(),
    medium: choicesSchema.shape.medium.optional(),
    size: choicesSchema.shape.size.optional(),
    customWidth: z.coerce.number().min(5).max(300).optional(),
    customHeight: z.coerce.number().min(5).max(300).optional(),
    referenceLink: z.union([z.literal(''), z.url().max(1000)]).default(''),
    idempotencyKey: z.uuid(),
    consent: z.literal(true),
    website: z.literal('').default(''),
    estimateToken: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.channel === 'email' && !z.email().safeParse(data.contact).success)
      ctx.addIssue({ code: 'custom', path: ['contact'], message: 'email' })
    if (data.channel !== 'email' && !/^@?[a-zA-Z0-9._]{3,64}$/.test(data.contact))
      ctx.addIssue({ code: 'custom', path: ['contact'], message: 'username' })
    if (data.kind === 'purchase' && !data.artworkId)
      ctx.addIssue({ code: 'custom', path: ['artworkId'], message: 'required' })
    if (data.kind === 'question' && data.message.length < 3)
      ctx.addIssue({ code: 'custom', path: ['message'], message: 'required' })
    if (data.kind === 'commission' && (!data.subject || !data.medium || !data.size))
      ctx.addIssue({ code: 'custom', path: ['subject'], message: 'required' })
    if (
      data.kind === 'commission' &&
      data.size === 'custom' &&
      (!data.customWidth || !data.customHeight)
    )
      ctx.addIssue({ code: 'custom', path: ['customWidth'], message: 'required' })
    if (data.referenceLink && !/^https?:\/\//.test(data.referenceLink))
      ctx.addIssue({ code: 'custom', path: ['referenceLink'], message: 'http' })
  })
export type Quote = {
  minPrice: number
  maxPrice: number
  currency: string
  minDays: number
  maxDays: number
  demo: boolean
  token: string
}
export type Rule = {
  id: number | string
  subject: string
  medium: string
  size: string
  minPrice: number
  maxPrice: number
  currency: string
  minDays: number
  maxDays: number
  demo?: boolean | null
  active?: boolean | null
  updatedAt: string
}
export function matchQuote(rules: Rule[], choices: z.infer<typeof choicesSchema>): Quote | null {
  const matches = rules.filter(
    (r) =>
      r.active &&
      r.subject === choices.subject &&
      r.medium === choices.medium &&
      r.size === choices.size,
  )
  if (matches.length !== 1) return null
  const r = matches[0]
  if (
    r.maxPrice < r.minPrice ||
    r.maxDays < r.minDays ||
    r.minPrice < 0 ||
    r.minDays <= 0 ||
    !/^[A-Z]{3}$/.test(r.currency)
  )
    return null
  return {
    minPrice: r.minPrice,
    maxPrice: r.maxPrice,
    currency: r.currency,
    minDays: r.minDays,
    maxDays: r.maxDays,
    demo: Boolean(r.demo),
    token: `${r.id}:${r.updatedAt}`,
  }
}
