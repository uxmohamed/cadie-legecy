# Lemon Squeezy Pricing + Entitlements Rollout (Starter / Pro / Believer)

## Summary
Implement end-to-end billing with Lemon Squeezy and enforce plan limits in API + UI for existing capabilities.  
Starter remains free, Pro supports monthly/yearly, Believer is yearly-only with pay-what-you-want (PWYW) amount at checkout.  
Pricing appears on landing and a new Billing section in settings. Webhooks are the source of truth for subscription state.

## Scope
1. Billing integration with Lemon Squeezy checkout + webhook + customer portal.
2. Subscription persistence in Supabase with idempotent webhook processing.
3. Central entitlement service used by all relevant API write paths.
4. UI changes: landing pricing section, settings Billing tab, 80/100 warning, locked-space UX, Believer badge.
5. Enforce only currently implemented features; future Pro items are labeled “Coming soon”.

## Non-goals (this release)
1. Implementing new product capabilities not currently built (AI search, sharing/publishing, external-source import, advanced video workflows).
2. Grandfathering existing users.
3. Admin backoffice UI.

## Implementation Plan

### 1) Data model + config
1. Add migration in `/Users/hassan/Repos/cadie/supabase/migrations/` for billing tables.
2. Create `public.user_billing` keyed by `user_id` with plan and Lemon linkage fields.
3. Create `public.billing_webhook_events` with unique webhook event ID for idempotency.
4. Add/normalize enum-like fields: `plan_tier`, `subscription_status`, `billing_interval`.
5. Persist Believer paid amount in cents (for recognition/analytics), but do not use it for access control.
6. Update `/Users/hassan/Repos/cadie/src/lib/supabase/types.ts` with new tables/columns.
7. Add env vars in `/Users/hassan/Repos/cadie/ENV_VARIABLES.md`:
`LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, `LEMON_SQUEEZY_WEBHOOK_SECRET`, `LEMON_VARIANT_PRO_MONTHLY`, `LEMON_VARIANT_PRO_YEARLY`, `LEMON_VARIANT_BELIEVER_YEARLY`.

### 2) Billing backend APIs
1. Add `/Users/hassan/Repos/cadie/src/app/api/billing/status/route.ts` (`GET`) returning current plan, usage, limits, and subscription metadata.
2. Add `/Users/hassan/Repos/cadie/src/app/api/billing/checkout/route.ts` (`POST`) accepting target plan + interval + optional Believer custom amount and returning checkout URL.
3. Add `/Users/hassan/Repos/cadie/src/app/api/billing/portal/route.ts` (`POST`) returning Lemon customer portal URL.
4. Add `/Users/hassan/Repos/cadie/src/app/api/webhooks/lemonsqueezy/route.ts` (`POST`) with signature verification + idempotent processing.
5. Add `/Users/hassan/Repos/cadie/src/lib/billing/lemon-client.ts` and `/Users/hassan/Repos/cadie/src/lib/billing/webhook-handler.ts` for API and mapping logic.
6. Attach internal `user_id` metadata when creating checkout so webhook events map reliably.

### 3) Entitlements and limits (central service)
1. Add `/Users/hassan/Repos/cadie/src/lib/billing/entitlements.ts` with canonical plan limits:
Starter: 100 total non-deleted items (all content types), 3 unlocked spaces, image/PDF max 10MB, 25 images, 25 PDFs, no bookmark import.
Pro: unlimited items/spaces, image/PDF max 25MB, 2000 images, 2000 PDFs, bookmark import enabled (50MB file limit).
Believer: same entitlements as Pro.
2. Add usage helpers in `/Users/hassan/Repos/cadie/src/lib/billing/usage.ts`.
3. Add plan resolver in `/Users/hassan/Repos/cadie/src/lib/billing/plan-resolver.ts` (Starter default when no active paid subscription).
4. Add a consistent limit error payload (HTTP 402) with machine-readable fields and upgrade CTA metadata.

### 4) Enforcement points (server-authoritative)
1. `/Users/hassan/Repos/cadie/src/features/links/api/handlers/create-link.handler.ts`: block at 100/100 Starter.
2. `/Users/hassan/Repos/cadie/src/app/api/links/batch/route.ts` action `add`: enforce item cap and media count caps.
3. `/Users/hassan/Repos/cadie/src/app/api/spaces/route.ts` `POST`: enforce 3-space Starter limit.
4. `/Users/hassan/Repos/cadie/src/app/api/spaces/[id]/route.ts` and `/Users/hassan/Repos/cadie/src/app/api/spaces/[id]/links/route.ts`: enforce locked overflow-space behavior for Starter.
5. `/Users/hassan/Repos/cadie/src/app/api/imports/bookmarks/preview/route.ts` and `/Users/hassan/Repos/cadie/src/app/api/imports/[id]/start/route.ts`: block Starter with upgrade-required response.
6. Space freeze rule for Starter with overflow: only first 3 spaces by `sort_order` are unlocked; overflow spaces remain visible but fully locked.

### 5) UI/UX rollout
1. Landing pricing section in `/Users/hassan/Repos/cadie/src/components/landing-page.tsx` with Starter/Pro/Believer cards, Pro monthly-yearly toggle, Believer yearly PWYW input.
2. Add Billing section to settings dialog in `/Users/hassan/Repos/cadie/src/components/settings-dialog.tsx`.
3. Create `/Users/hassan/Repos/cadie/src/components/settings/settings-billing.tsx` with:
current plan, usage meters, 80/100 warning, upgrade buttons, manage subscription button, cancellation-at-period-end state.
4. Add persistent in-app banner (dashboard shell/content) when Starter usage is 80-99.
5. At 100/100, block new saves/imports/uploads with clear upgrade CTA.
6. Show Believer badge next to avatar in `/Users/hassan/Repos/cadie/src/components/user-menu.tsx` and in Billing settings.
7. In spaces UI (`/Users/hassan/Repos/cadie/src/components/settings/settings-spaces.tsx` and sidebar usage), visually mark locked overflow spaces and disable all mutation actions on them.
8. Pricing copy: keep not-yet-built Pro features explicitly marked “Coming soon”.

### 6) Extension behavior
1. No extension API contract change needed; existing error parsing should surface plan-limit messages.
2. Ensure new limit errors are human-readable in API responses for `/api/links` and `/api/spaces/*` routes used by extension.

### 7) Subscription lifecycle behavior
1. No grandfathering/migration perks.
2. Cancellation/payment-failure downgrade takes effect at period end.
3. If downgraded to Starter with more than 3 spaces, overflow spaces are visible but locked (first 3 unlocked by order).

## Important API/interface/type changes
1. New endpoints:
`GET /api/billing/status`
`POST /api/billing/checkout`
`POST /api/billing/portal`
`POST /api/webhooks/lemonsqueezy`
2. New shared billing types in `/Users/hassan/Repos/cadie/src/lib/billing/types.ts`:
`PlanTier`, `SubscriptionStatus`, `BillingInterval`, `Entitlements`, `UsageSnapshot`.
3. Extended `Space` response shape to include lock status for overflow spaces on Starter (for UI disabling).
4. Standardized plan-limit error body for write APIs:
`code`, `limit_key`, `current`, `max`, `upgrade_required`, `message`.

## Test cases and scenarios
1. Starter usage thresholds:
79 saves (no warning), 80 saves (banner appears), 99 saves (banner persists), 100th save blocked.
2. Batch add at boundary:
payload partially accepted until cap, remainder rejected with deterministic response.
3. Space cap:
Starter can create first 3, 4th blocked; on downgrade with >3 spaces, only first 3 unlocked.
4. Locked overflow spaces:
attempt add/remove link, rename, recolor, delete on locked space returns limit/forbidden response.
5. Import gating:
Starter blocked on preview/start; Pro/Believer allowed.
6. Checkout creation:
Pro monthly/yearly and Believer yearly routes return valid checkout URLs with correct variant mapping and metadata.
7. Believer PWYW:
custom amount accepted and persisted as support amount after webhook.
8. Webhook idempotency:
replayed event does not duplicate or regress state.
9. Downgrade timing:
cancellation event with future period end keeps Pro/Believer entitlements until boundary.
10. UI integration:
Billing tab renders correct plan, badge, usage meters, warning/banner and button states.

## Explicit assumptions and defaults
1. Starter free forever is app-enforced (no Lemon product).
2. Plan mapping is variant-driven: Pro monthly/yearly variants map to `pro`; Believer yearly variant maps to `believer`.
3. Believer custom contribution is implemented in checkout (PWYW) while entitlements depend only on plan/variant, not amount.
4. “Saved items” count includes all non-deleted content types (url/color/image/document/note), archived included.
5. 80-item warning appears both in-app and in settings; hard block starts at 100.
6. Downgrade applies at period end.
7. Pro-only currently means gating existing capabilities now; unbuilt marketed capabilities are shown as coming soon.
8. Lemon IDs are environment-configured (not hardcoded literals in repo).
