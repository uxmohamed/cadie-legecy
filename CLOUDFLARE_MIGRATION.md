# 🚀 Cloudflare Pages Migration Guide

This guide will walk you through migrating Caddy from Vercel to Cloudflare Pages.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Configuration Changes](#configuration-changes)
3. [Environment Variables](#environment-variables)
4. [Deployment Setup](#deployment-setup)
5. [Testing & Validation](#testing--validation)
6. [DNS & Domain Setup](#dns--domain-setup)
7. [Rollback Plan](#rollback-plan)
8. [Performance Comparison](#performance-comparison)

---

## 🔧 Prerequisites

Before starting the migration, ensure you have:

- [ ] Cloudflare account (free tier is fine to start)
- [ ] Access to your GitHub repository
- [ ] List of all environment variables from Vercel
- [ ] Current Vercel deployment URL for comparison
- [ ] Supabase credentials ready

---

## ⚙️ Configuration Changes

### 1. Update `next.config.ts`

Cloudflare Pages requires specific Next.js configuration for optimal performance.

**Current config:**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

**Updated config for Cloudflare:**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static exports where possible
  output: "standalone", // or 'export' for fully static sites

  // Optimize images for Cloudflare
  images: {
    formats: ["image/avif", "image/webp"],
    // Cloudflare Images integration (optional)
    loader: "default",
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Enable compression
  compress: true,
};

export default nextConfig;
```

### 2. Create Cloudflare-specific files

We'll need to add some Cloudflare-specific configuration files.

---

## 🔐 Environment Variables

### Export from Vercel

1. Go to your Vercel dashboard
2. Navigate to Project Settings → Environment Variables
3. Document all variables

### Current Environment Variables (Update these)

Based on your project, you likely have:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Other variables
# Add any other environment variables here
```

### Add to Cloudflare Pages

1. Go to Cloudflare Dashboard
2. Navigate to Pages → Your Project → Settings → Environment Variables
3. Add all variables for both **Production** and **Preview** environments

---

## 🚀 Deployment Setup

### Option 1: Deploy via Cloudflare Dashboard (Recommended for First Time)

1. **Login to Cloudflare Dashboard**

   - Go to https://dash.cloudflare.com/
   - Navigate to **Workers & Pages**

2. **Create a New Pages Project**

   - Click **Create Application** → **Pages** → **Connect to Git**
   - Select your GitHub repository: `uxmohamed/caddy`
   - Authorize Cloudflare to access your repository

3. **Configure Build Settings**

   ```
   Framework preset: Next.js
   Build command: npm run build
   Build output directory: .next
   Root directory: /
   Node version: 20
   ```

4. **Add Environment Variables**

   - Add all environment variables from the section above
   - Make sure to add them for both Production and Preview

5. **Deploy**
   - Click **Save and Deploy**
   - Wait for the build to complete (usually 2-5 minutes)

### Option 2: Deploy via Wrangler CLI

1. **Install Wrangler**

   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**

   ```bash
   wrangler login
   ```

3. **Create `wrangler.toml` (we'll create this file next)**

4. **Deploy**
   ```bash
   wrangler pages deploy .next
   ```

---

## 📝 Additional Configuration Files

### 1. Create `.node-version` file

This ensures Cloudflare uses the correct Node.js version:

```
20
```

### 2. Create `_headers` file (Optional but Recommended)

For security and performance headers:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-XSS-Protection: 1; mode=block
```

### 3. Create `_redirects` file (Optional)

For custom redirects:

```
# Example redirects
# /old-path /new-path 301
```

---

## ✅ Testing & Validation

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Build succeeds locally: `npm run build`
- [ ] Test production build locally: `npm start`
- [ ] Supabase connection works
- [ ] PostHog analytics configured

### Post-Deployment Testing

1. **Functional Testing**

   - [ ] Homepage loads correctly
   - [ ] User authentication works (Supabase)
   - [ ] All routes are accessible
   - [ ] Browser extension integration works
   - [ ] Analytics tracking works (PostHog)

2. **Performance Testing**

   - [ ] Run Lighthouse audit
   - [ ] Compare load times with Vercel
   - [ ] Test from multiple geographic locations
   - [ ] Check Core Web Vitals

3. **Edge Cases**
   - [ ] Test with ad blockers enabled
   - [ ] Test on mobile devices
   - [ ] Test in different browsers
   - [ ] Test API routes (if any)

### Testing Tools

```bash
# Test build locally
npm run build
npm start

# Check for build errors
npm run lint

# Run tests
npm test
```

---

## 🌐 DNS & Domain Setup

### If Using Custom Domain

1. **Add Domain to Cloudflare Pages**

   - Go to your Pages project → Custom Domains
   - Click **Set up a custom domain**
   - Enter your domain name

2. **Update DNS Records**

   **If domain is already on Cloudflare:**

   - Cloudflare will automatically configure DNS

   **If domain is elsewhere:**

   - Add CNAME record pointing to your Cloudflare Pages URL
   - Or migrate your domain to Cloudflare (recommended)

3. **SSL/TLS Configuration**
   - Cloudflare provides free SSL automatically
   - Ensure SSL/TLS mode is set to "Full" or "Full (strict)"

### Subdomain Strategy (Recommended for Testing)

Before switching your main domain:

1. Create a subdomain (e.g., `beta.caddy.com` or `cf.caddy.com`)
2. Point it to Cloudflare Pages
3. Test thoroughly
4. Switch main domain once confident

---

## 🔄 Rollback Plan

### If Something Goes Wrong

1. **DNS Rollback**

   - Change DNS records back to Vercel
   - TTL should be low (5 minutes) during migration

2. **Keep Vercel Deployment Active**

   - Don't delete Vercel project immediately
   - Keep it running for at least 1 week after migration
   - Monitor both deployments

3. **Git Rollback**
   ```bash
   git checkout main
   git branch -D cloudflare-migration
   ```

---

## 📊 Performance Comparison

### Metrics to Track

Create a spreadsheet to compare:

| Metric                         | Vercel | Cloudflare | Winner |
| ------------------------------ | ------ | ---------- | ------ |
| First Contentful Paint (FCP)   |        |            |        |
| Largest Contentful Paint (LCP) |        |            |        |
| Time to Interactive (TTI)      |        |            |        |
| Total Blocking Time (TBT)      |        |            |        |
| Cumulative Layout Shift (CLS)  |        |            |        |
| Server Response Time (TTFB)    |        |            |        |
| Build Time                     |        |            |        |
| Monthly Cost                   |        |            |        |

### Testing Tools

- **Lighthouse**: Chrome DevTools
- **WebPageTest**: https://www.webpagetest.org/
- **GTmetrix**: https://gtmetrix.com/
- **Cloudflare Analytics**: Built into dashboard
- **Vercel Analytics**: For comparison

---

## 🎯 Migration Timeline

### Recommended Approach

**Week 1: Preparation**

- [ ] Create `cloudflare-migration` branch
- [ ] Update configuration files
- [ ] Document all environment variables
- [ ] Set up Cloudflare account

**Week 2: Initial Deployment**

- [ ] Deploy to Cloudflare Pages
- [ ] Configure environment variables
- [ ] Test on Cloudflare preview URL
- [ ] Fix any issues

**Week 3: Testing**

- [ ] Set up subdomain pointing to Cloudflare
- [ ] Run comprehensive tests
- [ ] Compare performance metrics
- [ ] Get team/user feedback

**Week 4: Migration**

- [ ] Switch DNS to Cloudflare
- [ ] Monitor for 48 hours
- [ ] Keep Vercel as backup
- [ ] Document lessons learned

**Week 5: Cleanup**

- [ ] Merge `cloudflare-migration` to `main`
- [ ] Update documentation
- [ ] Cancel Vercel subscription (if desired)
- [ ] Celebrate! 🎉

---

## 🆘 Troubleshooting

### Common Issues

**Build Fails on Cloudflare**

- Check Node.js version (should be 20)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

**Environment Variables Not Working**

- Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

**Supabase Connection Issues**

- Verify Supabase URLs are correct
- Check CORS settings in Supabase dashboard
- Ensure SSR package is configured correctly

**Slow Build Times**

- Enable caching in Cloudflare Pages settings
- Optimize dependencies
- Consider using `output: 'standalone'`

---

## 📚 Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Supabase with Cloudflare](https://supabase.com/docs/guides/getting-started/tutorials/with-cloudflare-workers)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

---

## 💰 Cost Comparison

### Vercel Pricing

- **Free**: 100GB bandwidth, 100 build hours/month
- **Pro ($20/month)**: 1TB bandwidth, 400 build hours/month
- **Overage**: $40/100GB bandwidth

### Cloudflare Pages Pricing

- **Free**: Unlimited bandwidth, 500 builds/month, 1 build at a time
- **Paid ($20/month)**: Unlimited bandwidth, 5000 builds/month, 5 concurrent builds
- **No bandwidth overage charges**

**Estimated Savings**: $20-200/month depending on traffic

---

## ✨ Next Steps After Migration

1. **Enable Cloudflare Features**

   - Web Analytics (free)
   - Cloudflare Images (optional)
   - Cloudflare Workers for edge functions
   - D1 database (if needed)

2. **Optimize Further**

   - Enable Cloudflare's Auto Minify
   - Set up Cloudflare Cache Rules
   - Configure Cloudflare's Rocket Loader
   - Enable Brotli compression

3. **Monitor & Iterate**
   - Set up uptime monitoring
   - Configure alerts
   - Review analytics weekly
   - Gather user feedback

---

## 📞 Support

If you encounter issues:

1. Check Cloudflare Pages logs in dashboard
2. Review Cloudflare Community: https://community.cloudflare.com/
3. Cloudflare Discord: https://discord.cloudflare.com/
4. Cloudflare Support (paid plans)

---

**Good luck with your migration! 🚀**

_Last updated: 2025-11-22_
