import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { resolveBrand } from '../src/lib/brand'
import { SellerDetails } from '../src/components/seller-details'
describe('public seller information', () => {
  it('does not invent registration details for an unconfigured studio', () => {
    expect(renderToStaticMarkup(<SellerDetails seller={resolveBrand().seller} locale="ru" />)).toBe(
      '',
    )
  })
  it('shows only supplied fields, preserves leading zeros and escapes HTML', () => {
    const seller = resolveBrand({
      sellerName: '<Artist>',
      sellerTaxId: '001234567890',
      sellerRegistration: '012345678901234',
      sellerTerms: 'Delivery by agreement.',
    }).seller
    const html = renderToStaticMarkup(<SellerDetails seller={seller} locale="en" />)
    expect(html).toContain('&lt;Artist&gt;')
    expect(html).toContain('001234567890')
    expect(html).toContain('012345678901234')
    expect(html).toContain('Delivery by agreement.')
    expect(html).not.toContain('<dt>Address</dt>')
  })
})
