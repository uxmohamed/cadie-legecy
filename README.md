# Cadie

Cadie is a link and color organization app with Spaces, fast keyboard workflows, and a Chrome extension.

## What it does

- Save links with metadata
- Save color values (`hex`, `rgb`, `hsl`, `oklch`)
- Organize with Spaces, pinning, archive, and trash
- Sign in with Google or email magic link
- Import bookmarks and export links as CSV

## Quick start

```bash
git clone <your-repo-url>
cd cadie
npm install
```

Create `.env.local` (see `/Users/hassan/Repos/cadie/ENV_VARIABLES.md` for full list):

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

In Supabase Auth, add callback URLs:

- `http://localhost:3000/auth/callback`
- `https://your-domain.com/auth/callback`

Run:

```bash
npm run dev
```

## Extension

```bash
npm run extension:build
```

Load `extension/dist` in `chrome://extensions` (Developer Mode).

## Common scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run extension:dev
npm run extension:build
```

## Maintenance scripts

- Billing recovery: `pnpm ts-node scripts/recover-billing-state.ts --mode=all` (dry-run)
- Apply billing recovery: `pnpm ts-node scripts/recover-billing-state.ts --mode=all --apply`
- Deprecated and removed: `upgrade.ts` (unsafe mass-upgrade script)

## Docs

- Env vars: `/Users/hassan/Repos/cadie/ENV_VARIABLES.md`
- Bookmark import rollout: `/Users/hassan/Repos/cadie/docs/bookmark-import-v0-rollout.md`
- Link export rollout: `/Users/hassan/Repos/cadie/docs/link-export-v0-rollout.md`

## License

MIT
