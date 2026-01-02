# Environment Variables Guide

## Required Environment Variables

### Production (Add to Cloudflare Pages)

```env
# Cron Job Authentication
CRON_SECRET=your_random_secret_here_min_32_characters

# Example generation:
# openssl rand -base64 32
```

### Local Development (.env.local)

```env
# Already configured:
UPSTASH_REDIS_REST_URL=https://sure-aardvark-13335.upstash.io
UPSTASH_REDIS_REST_TOKEN=ATQXAAIncDIzNmFlZjYyYTM2ZGI0ZmJjODI0OWJhOTUwZTBiM2EwNHAyMTMzMzU

# Add for cron testing:
CRON_SECRET=test_secret_for_local_development_only
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
