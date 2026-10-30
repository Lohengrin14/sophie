import { withPayload } from '@payloadcms/next/withPayload'

export default withPayload({
  distDir: process.env.LOCAL_CLOUD_PREVIEW === 'true' ? '.next-preview' : '.next',
  poweredByHeader: false,
  serverExternalPackages: ['sharp'],
})
