# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Prospera — a single-page React career platform (ATS resume scanner, resume builder, application tracker, interview prep). Marketing landing page + an in-app dashboard. All data is hardcoded and in-memory; there is no backend, router, or persistence.

Note: `package.json` `name` is still `parsewave` (an older name) — the product is Prospera. Don't "fix" it unless asked.

## Commands

Standard Vite scripts (`dev`, `build`, `lint`, `preview`). There is **no test suite**, so after making changes verify with:

```
npm run lint && npm run build
```

This is the only self-check available and catches broken imports (e.g. a mis-pathed file move) and lint errors. The `/verify` skill runs it.

## Architecture

- **No router.** Top-level view switches in `src/App.jsx` via `useState` (`'landing'` | `'dashboard'`) and prop callbacks: `onEnterApp()` enters the dashboard, `onLogout()` returns to landing. Inside the dashboard, sections switch via `activeTab` state in `src/pages/DashboardPage.jsx` — not URLs.
- **State** is local React `useState` only (no Redux/Zustand/Context). The resume list lives in `DashboardPage` and is passed down; it's the single source of truth shared by the dashboard widgets and the library.

## Folder structure (follow this when adding files)

- `src/pages/` — full screens, named `*Page.jsx` (`LandingPage`, `DashboardPage`, `LibraryPage`).
- `src/components/dashboard/` and `src/components/landing/` — feature components, grouped by area.
- CSS is co-located in a `css/` subfolder next to its components (e.g. `src/components/dashboard/css/Sidebar.css`); global tokens/typography live in `src/index.css`. Inline `style={}` objects mixed with these CSS files is an accepted pattern in this codebase.

A new full screen goes in `src/pages/`, not `src/components/`.

## Assets (using the wrong location breaks the image)

- `src/assets/*` — imported in JS (`import hero from '../../assets/hero.png'`). Vite hashes and bundles these.
- `public/assets/*` — referenced by absolute path (`src="/assets/alex_avatar.png"`). Served as-is.

## Style

2-space indentation, single quotes, default exports for pages and components. `lucide-react` for icons.
