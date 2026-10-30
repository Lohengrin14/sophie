// Decimal bytes leave room for multipart metadata below Netlify's binary request limit.
export const MAX_IMAGE_BYTES = 4_000_000
export const MAX_REFERENCE_BYTES = 4_000_000
export const MAX_INQUIRY_BODY_BYTES = 4_200_000
export const imageTypes = ['image/jpeg', 'image/png', 'image/webp']
export function validReferences(files: { size: number; type: string }[]) {
  return (
    files.length <= 3 &&
    files.every((file) => file.size <= MAX_IMAGE_BYTES && imageTypes.includes(file.type)) &&
    files.reduce((sum, file) => sum + file.size, 0) <= MAX_REFERENCE_BYTES
  )
}
