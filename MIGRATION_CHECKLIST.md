# 📋 Cloudflare Migration Checklist

Quick reference for migrating Caddy to Cloudflare Pages.

## Pre-Migration

- [ ] Create `cloudflare-migration` branch ✅ (Done)
- [ ] Review migration guide (`CLOUDFLARE_MIGRATION.md`)
- [ ] Export all environment variables from Vercel
- [ ] Create Cloudflare account
- [ ] Test build locally: `npm run build`

## Configuration Files

- [ ] `.node-version` ✅ (Created)
- [ ] `public/_headers` ✅ (Created)
- [ ] `public/_redirects` ✅ (Created)
- [ ] `next.config.ts` ✅ (Updated)

## Environment Variables to Transfer

Document your current values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Add any other variables here
```

## Cloudflare Setup

- [ ] Login to Cloudflare Dashboard
- [ ] Navigate to Workers & Pages
- [ ] Create new Pages project
- [ ] Connect to GitHub repo: `uxmohamed/caddy`
- [ ] Configure build settings:
  - Framework: Next.js
  - Build command: `npm run build`
  - Build output: `.next`
  - Node version: 20
- [ ] Add all environment variables
- [ ] Deploy

## Testing

- [ ] Homepage loads
- [ ] Authentication works (Supabase)
- [ ] All routes accessible
- [ ] Browser extension integration
- [ ] Analytics tracking (PostHog)
- [ ] Run Lighthouse audit
- [ ] Test on mobile
- [ ] Test in different browsers

## Performance Comparison

| Metric     | Vercel | Cloudflare |
| ---------- | ------ | ---------- |
| LCP        |        |            |
| FCP        |        |            |
| TTI        |        |            |
| TTFB       |        |            |
| Build Time |        |            |

## Go-Live

- [ ] Set up test subdomain (optional)
- [ ] Update DNS records
- [ ] Monitor for 48 hours
- [ ] Keep Vercel active as backup
- [ ] Document any issues

## Post-Migration

- [ ] Merge to main
- [ ] Update team documentation
- [ ] Cancel Vercel (if desired)
- [ ] Enable Cloudflare features:
  - [ ] Web Analytics
  - [ ] Auto Minify
  - [ ] Cache Rules
  - [ ] Brotli compression

## Rollback Plan

If issues occur:

1. Revert DNS to Vercel
2. Keep Vercel deployment active for 1 week
3. Document lessons learned

---

**Current Status**: Configuration files created, ready for deployment testing

**Next Step**: Export environment variables from Vercel and set up Cloudflare Pages project
