# Extension token lifecycle

Cadie keeps extension tokens as opaque bearer tokens, but each token now carries explicit lifecycle metadata.

## Token fields

- `scope`: explicit capability list for the token. Legacy rows default to `legacy_full_access`.
- `revoked_at` / `revoked_reason`: deterministic revocation state.
- `client_id` / `install_id`: identify the calling client and a stable browser-installation record.
- `install_metadata`: per-install details such as extension version, browser, and platform.
- `rotated_from_token_id` / `rotated_at`: trace rotation history.

## Scope enforcement

- Read routes require `links:read`, `spaces:read`, `settings:read`, or `exports:read`.
- Write routes require `links:write`, `spaces:write`, or `settings:write`.
- Extension overlay context requires `extension:link-context:read`.
- Tokens with `legacy_full_access` continue to work during migration.

## Revocation

- Revoked tokens fail authentication as `401`.
- User disconnects now soft-revoke tokens instead of deleting rows, preserving audit history.

## Rotation

- `POST /api/auth/tokens/:id/rotate` issues a replacement opaque token, copies scope and install metadata, and revokes the old token with `revoked_reason = 'rotated'`.
- `POST /api/extension/authorize` rotates prior active tokens for the same `install_id` and `client_id`, which keeps reconnects tied to a single browser installation.

## Extension reconnect flow

The browser extension keeps a stable `installId` in local storage. When the extension reconnects after a `401` or a manual re-auth, the authorize flow sends that install identifier so the backend can revoke the previous install token and issue a fresh scoped replacement.
