# Environment Variables Guide

## Required Environment Variables

### Production (Railway / Vercel / etc.)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=<your-upstash-redis-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-redis-token>

# Upstash QStash (Background Jobs)
QSTASH_TOKEN=<your-qstash-token>
QSTASH_CURRENT_SIGNING_KEY=<your-qstash-current-signing-key>
QSTASH_NEXT_SIGNING_KEY=<your-qstash-next-signing-key>

# Cron Job Authentication (generate with: openssl rand -base64 32)
CRON_SECRET=<your-random-secret-min-32-chars>

# Internal API Authentication (generate with: openssl rand -base64 32)
# Used for secure service-to-service communication
INTERNAL_API_SECRET=<your-random-secret-min-32-chars>

# Lemon Squeezy (Billing)
LEMON_SQUEEZY_API_KEY=<your-lemon-api-key>
LEMON_SQUEEZY_STORE_ID=<your-lemon-store-id>
LEMON_SQUEEZY_WEBHOOK_SECRET=<your-lemon-webhook-signing-secret>
LEMON_VARIANT_PRO_MONTHLY=<your-pro-monthly-variant-id>
LEMON_VARIANT_PRO_YEARLY=<your-pro-yearly-variant-id>
LEMON_VARIANT_BELIEVER_YEARLY=<your-believer-yearly-variant-id>

# Site URL (your deployed domain)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=<your-posthog-key>
NEXT_PUBLIC_POSTHOG_HOST=<your-posthog-host>

# Sentry (optional)
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>
```

### Local Development (.env.local)

```env
# Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Get these from your Upstash dashboard
UPSTASH_REDIS_REST_URL=<your-upstash-redis-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-redis-token>

# QStash (get from Upstash dashboard)
QSTASH_TOKEN=<your-qstash-token>
QSTASH_CURRENT_SIGNING_KEY=<your-qstash-signing-key>
QSTASH_NEXT_SIGNING_KEY=<your-qstash-next-signing-key>

# Generate with: openssl rand -base64 32
CRON_SECRET=<generate-for-local-testing>
INTERNAL_API_SECRET=<generate-for-local-testing>

# Lemon Squeezy (Billing)
LEMON_SQUEEZY_API_KEY=<your-lemon-api-key>
LEMON_SQUEEZY_STORE_ID=<your-lemon-store-id>
LEMON_SQUEEZY_WEBHOOK_SECRET=<your-lemon-webhook-signing-secret>
LEMON_VARIANT_PRO_MONTHLY=<your-pro-monthly-variant-id>
LEMON_VARIANT_PRO_YEARLY=<your-pro-yearly-variant-id>
LEMON_VARIANT_BELIEVER_YEARLY=<your-believer-yearly-variant-id>

# Local development URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Generating Secrets

For `CRON_SECRET` and `INTERNAL_API_SECRET`, generate cryptographically secure values:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Cloudflare Scheduled Cleanup Options

### Option 1: Cloudflare Workers Cron Triggers (Recommended)

Create a separate Cloudflare Worker to call your API:

**File**: `worker-cron.js` (in separate worker project)

```javascript
export default {
  async scheduled(event, env, ctx) {
    const response = await fetch(
      "https://your-domain.com/api/cron/cleanup-trash",
      {
        headers: {
          Authorization: `Bearer ${env.CRON_SECRET}`,
        },
      }
    );

    const result = await response.json();
    console.log("Cleanup result:", result);
  },
};
```

**wrangler.toml**:

```toml
name = "cadie-cron"
main = "worker-cron.js"
compatibility_date = "2024-01-01"

[triggers]
crons = ["0 2 * * *"]  # Daily at 2 AM UTC

[vars]
# Don't put secrets here
```

Deploy: `wrangler deploy`  
Add secret: `wrangler secret put CRON_SECRET`

### Option 2: External Cron Service (Easiest)

Use a free service like:

- **EasyCron** (https://www.easycron.com/) - Free tier available
- **Cron-job.org** (https://cron-job.org/) - Free forever
- **GitHub Actions** (if using GitHub)

**GitHub Actions** (.github/workflows/cleanup.yml):

```yaml
name: Daily Trash Cleanup

on:
  schedule:
    - cron: "0 2 * * *" # 2 AM UTC daily
  workflow_dispatch: # Manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cleanup
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/cleanup-trash
```

### Option 3: Cloudflare Durable Objects (Advanced)

For complex scheduling within Cloudflare ecosystem.

## Testing Cron Job Locally

```bash
# Generate a secret
openssl rand -base64 32

# Add to .env.local, then test:
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/cleanup-trash
```

## Cloudflare Pages Deployment

1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables
2. Add: `CRON_SECRET` = (value from openssl command)
3. Choose one of the scheduling options above
4. Save and configure the chosen cron service

**Recommendation**: Use **GitHub Actions** (Option 2) for simplicity - it's free and requires no additional infrastructure.
