import { NextResponse } from 'next/server'
import { choicesSchema } from '@/lib/requests'
import { getQuote } from '@/lib/estimate'
export async function GET(req: Request) {
  const parsed = choicesSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  return NextResponse.json(
    { quote: await getQuote(parsed.data) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
