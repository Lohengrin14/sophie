import 'server-only'
import { cms } from './data'
import { matchQuote, type Rule } from './requests'
import type { z } from 'zod'
import type { choicesSchema } from './requests'

export async function getQuote(choices: z.infer<typeof choicesSchema>) {
  // Custom/undecided choices aren't database enum values; they always need personal clarification.
  if (
    choices.subject === 'other' ||
    choices.medium === 'unsure' ||
    choices.size === 'custom' ||
    choices.size === 'unsure'
  )
    return null
  const payload = await cms()
  const result = await payload.find({
    collection: 'quote-rules',
    overrideAccess: true,
    limit: 2,
    where: {
      and: [
        { active: { equals: true } },
        { subject: { equals: choices.subject } },
        { medium: { equals: choices.medium } },
        { size: { equals: choices.size } },
      ],
    },
  })
  return matchQuote(result.docs as unknown as Rule[], choices)
}
