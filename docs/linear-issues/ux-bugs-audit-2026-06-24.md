# Linear Issue Draft: UX & Accessibility Bugs Found in Product Scan

**Status:** Ready to create in Linear  
**Suggested team:** Product / Frontend  
**Suggested priority:** High  
**Suggested labels:** `ux`, `accessibility`, `frontend`, `bug`  
**Suggested title:** Fix dashboard and onboarding UX/accessibility regressions found in June 2026 scan

## Problem

A scan of the primary dashboard, upload, view-switching, onboarding, and link-list UI found several issues that can block keyboard and assistive-technology users, reduce discoverability, or create inconsistent product polish.

## Findings

### 1. Search and capture placeholders use three periods instead of an ellipsis

- `src/components/capture-input.tsx` uses `"Search your links..."` and `"+ Insert a link, color, image, PDF, or note..."`.
- `src/components/dashboard-shell.tsx` uses `"Search..."` for dashboard search.

**Impact:** Inconsistent typography and product polish. The guidelines prefer the single ellipsis character (`…`) for placeholder/loading copy.

**Acceptance criteria:**

- Replace user-facing `...` placeholders with `…`.
- Confirm placeholder copy remains readable and does not overflow on small screens.

### 2. Search inputs are missing meaningful `name` and `autocomplete` attributes

- The capture/search input in `src/components/capture-input.tsx` only sets `type`, `value`, and ARIA label.
- The dashboard search input in `src/components/dashboard-shell.tsx` only sets `type`, `value`, and ARIA label.

**Impact:** Browser autofill, assistive technology, testing selectors, and form semantics are weaker than expected. Non-auth search fields should explicitly avoid password-manager interference.

**Acceptance criteria:**

- Add meaningful `name` attributes, such as `capture` and `dashboard-search`.
- Add an explicit autocomplete strategy, preferably `autocomplete="off"` for these non-auth fields.
- Keep keyboard shortcuts (`Escape`, `/`, `⌘F`) working after the change.

### 3. Image upload drop zone is a clickable `<div>` without keyboard semantics

- `src/components/image-upload-modal.tsx` makes the drop zone clickable with `onClick`, but the element is a plain `<div>` with no `role`, `tabIndex`, or keyboard activation.

**Impact:** Keyboard-only users cannot browse files from the drop zone. Screen readers do not get button semantics for the primary upload target.

**Acceptance criteria:**

- Convert the clickable drop zone to a `<button type="button">` or add equivalent button semantics and Enter/Space handling.
- Ensure drag-and-drop behavior still works.
- Add a visible `focus-visible` state.
- Add an accessible label that communicates accepted image upload behavior.

### 4. Hidden file inputs are missing accessible names

- `src/components/image-upload-modal.tsx` includes a hidden file input without `aria-label`.
- `src/components/dashboard-shell.tsx` includes a hidden global upload file input marked `aria-hidden="true"` while still serving as the actual file picker target.

**Impact:** Programmatically triggered file inputs can be hard to inspect or test, and the dashboard input is intentionally hidden from assistive technology despite being part of the upload workflow.

**Acceptance criteria:**

- Add meaningful labels such as `aria-label="Select image to upload"` and `aria-label="Select files to upload"` where appropriate.
- Prefer visually hidden but accessible inputs when they are user-triggered controls, or document why an input must remain `aria-hidden`.

### 5. Remove-image preview button lacks an accessible name and keyboard-visible focus style

- `src/components/image-upload-modal.tsx` has an icon-only remove button that only contains an `IconX`.
- The button is revealed on hover via opacity and has no explicit `aria-label` or visible focus treatment.

**Impact:** Screen reader users hear an unlabeled button, and keyboard users may tab to an invisible or poorly indicated control.

**Acceptance criteria:**

- Add `aria-label="Remove selected image"`.
- Make the button visible on `focus-visible`/`focus-within`, not only hover.
- Add a visible `focus-visible` ring.

### 6. Theme selection cards rely on visual selection only

- `src/components/onboarding/theme-step.tsx` uses two plain buttons to choose Light or Dark.
- The selected theme is only indicated by border color and preview appearance.

**Impact:** Screen reader users do not get selected-state semantics, and keyboard users have no explicit focus-visible style on the cards.

**Acceptance criteria:**

- Add `aria-pressed` or radio-group semantics for theme selection.
- Add visible `focus-visible` styles on both cards.
- Consider announcing the current selection in button labels.

### 7. View switcher contains custom interactive rows with incomplete focus styling and semantics

- `src/components/view-switcher.tsx` uses nested custom click targets, including a focusable `<div>` for each space row.
- Several menu row buttons use `outline-none` without an obvious `focus-visible` replacement.

**Impact:** Keyboard navigation can be inconsistent, and screen readers may not receive predictable button/menu item semantics for space navigation.

**Acceptance criteria:**

- Convert focusable custom rows to semantic buttons/menu items where possible.
- Add `focus-visible` rings or equivalent visible states to all interactive rows and icon menu triggers.
- Preserve shortcut hints and edit/delete menus.

### 8. Link list rows mix a clickable parent `<div>` with an anchor that prevents default navigation

- `src/features/links/components/link-list/link-list-item.tsx` wraps the row in a clickable `<div>` and contains an `<a>` whose `onClick` always calls `preventDefault()`.
- The anchor has `focus:outline-none` without an obvious focus replacement.

**Impact:** Native link affordances are weakened: keyboard users and users expecting Cmd/Ctrl-click or middle-click behavior may not get expected navigation. Focus can also become hard to see.

**Acceptance criteria:**

- Decide whether rows are links or selectable list items and align semantics accordingly.
- If links, preserve native link behavior for open-in-new-tab interactions and avoid unconditional `preventDefault()`.
- If selectable items, use proper listbox/grid semantics and expose an explicit “open link” action.
- Add visible focus styling.

## Suggested implementation order

1. Fix low-risk copy and input metadata issues in capture/dashboard search.
2. Fix upload modal keyboard and accessible-name issues.
3. Fix onboarding theme selection semantics.
4. Refactor view switcher and link list semantics after adding focused regression tests.

## Suggested tests

- Add React Testing Library coverage for keyboard activation of image upload and remove-image controls.
- Add accessibility assertions for icon-only buttons and selected theme state.
- Add regression coverage for dashboard search shortcut behavior.
- Manually verify keyboard-only flows: search, upload, theme selection, switch spaces, open links.
