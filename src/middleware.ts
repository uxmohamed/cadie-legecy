export { proxy as middleware, config } from './proxy'

// Cloudflare Pages requires edge runtime for middleware
export const runtime = 'edge'
