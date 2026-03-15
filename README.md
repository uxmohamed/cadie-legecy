# Cadie Legacy

Legacy version of Cadie, originally built as a bookmark manager for links and colors.

This project is no longer maintained and is being kept online for reference and open source access.
The active product direction for Cadie now lives separately.

## What It Includes

- Save links with metadata
- Save colors in `hex`, `rgb`, `hsl`, and `oklch`
- Save notes, images, and PDF documents
- Organize items with Spaces, pinning, archive, and trash
- Fast keyboard workflows and command menu support
- Metadata enrichment and AI-generated tagging
- Sign in with Google or email magic link
- Import browser bookmarks and export links as CSV
- Use the Chrome extension for quick saving
- Light and dark themes

## Run Locally

```bash
git clone <your-repo-url>
cd cadie
npm install
npm run dev
```

Create `.env.local` with the required Supabase and site variables.
See [ENV_VARIABLES.md](/Users/hassan/Repos/cadie/ENV_VARIABLES.md) for the full list.

## Extension

```bash
npm run extension:build
```

Load `extension/dist` in `chrome://extensions` with Developer Mode enabled.

## Status

This repo is kept as a legacy archive and is not under active development.
Use it as a reference project, not as the current Cadie product.

The new Cadie direction is focused on building a workspace for product teams to save, organize, discuss, and learn from experiments across links, prototypes, recordings, screenshots, and notes.
