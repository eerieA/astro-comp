# Portfolio Redesign Plan

## Overview

Enhance the existing Astro portfolio with interactive components, multiple visual themes, and a 3D project grid while maintaining content-driven structure.

## Goals

- Add interactive elements without sacrificing Astro's performance benefits
- Implement 5+ switchable themes affecting entire site
- Create scroll-driven 3D carousel for projects
- Add rolling tag banner for skills
- Ensure mobile responsiveness throughout

## Architecture

- **Framework**: Astro 5.x with Svelte islands
- **Styling**: Tailwind CSS + CSS custom properties for theming
- **Animation**: svelte-motion for 3D effects
- **Theming**: CSS variables stored in localStorage

---

## Phase 1: Rolling Tag Banner

**Goal**: Replace current static skills section with animated tag banner

- Create `TagBanner.svelte` component with horizontal marquee
- Tags: Python, JavaScript, REST API, etc. (from current data)
- Mobile: scrollable horizontally or stack vertically
- CSS animation, zero-JS initially

**File**: `src/components/TagBanner.svelte`

---

## Phase 2: Theme System

**Goal**: 5 switchable themes with full-site coverage

| Theme | Description |
|-------|-------------|
| Starry Night | Deep blue background, white/yellow stars, twinkling effects |
| Foggy Morning | Soft gray/white gradients, muted tones |
| Cyberpunk 2077 | Neon pink/cyan accents, dark background, glow effects |
| Nier Automata | Black/white monochrome, gold accents, minimal |
| NASA White | Clean white, NASA blue accents, minimalist |

**Implementation**:
- CSS custom properties (`--bg-primary`, `--text-primary`, `--accent`, etc.)
- Theme stored in localStorage
- Add theme toggle component in header
- Apply theme class to `<html>` or `<body>`

**Files**:
- Modify: `src/styles/global.css`
- Add: theme CSS
- Modify: `src/components/Header.astro`

---

## Phase 3: Interactive Project Grid

**Goal**: Embedded Three.js scene with a spatial grid of interactive 3D project cards

**Components**:
- `GalleryCanvas.svelte` - owns the Three.js lifecycle (renderer, scene, camera, animation loop, resize, cleanup)

**Finalized design decisions** (confirmed in conversation):

| Concern | Decision |
|---------|----------|
| Layout | 3×2 grid (3 cols, 2 rows); each card has random Z depth offset (±30px) and Y-rotation offset (±5–10°) for cinematic feel |
| Future expansion | Grid rows are scrollable for when project count exceeds 6; 3D scrollbar deferred to later |
| Card texture | Static screenshot JPGs from `public/images/projects/`, one per project — no video |
| Individual animation | Slow jiggling around 2 local axes (X + Y rotation), each card has its own phase offset |
| Mouse parallax | Entire card group translates gently relative to mouse position over the canvas |
| Hover response | Emissive color boost + scale up on hovered card (no duplicate mesh glow — performance) |
| Click | Opens project link (`arrays.ts`) in a new browser tab |
| Mobile fallback | DOM grid shown on narrow viewports; Three.js not initialised |
| Postprocessing | Skipped (no bloom) — keep it lean |

**Image filename → project mapping**:
| File | Project |
|------|---------|
| `ndl-view.jpg` | NDL View (2025) |
| `astro-comp.jpg` | Astro Compact (2025) |
| `git-peek.jpg` | Git Peek (2024) |
| `coding-quizzes.jpg` | Coding Quizzes (2024) |
| `webgl-toon-shading.jpg` | WebGL Toon Shading (2025) |
| `webgl-vertex-exp.jpg` | WebGL Vertex Explosion (2025) |

**Implementation build order**:
1. Canvas mount + renderer init
2. Scene, camera, lighting
3. Card mesh creation (6 cards, plain boxes)
4. Texture loading per card
5. Staggered spatial grid layout (depth + Y-rotation offsets)
6. Per-card jiggle animation (local X + Y rotation, phase-offset per card)
7. Mouse parallax on card group
8. Raycasting hover (emissive boost + scale)
9. Click → open project link in new tab
10. Resize handler + onDestroy cleanup
11. Mobile DOM fallback

**Tech**:
- `three` (vanilla, no React Three Fiber)
- `@astrojs/svelte` + `svelte` (Svelte wraps the canvas lifecycle)
- Card textures: static screenshots per project (not video), stored in `public/images/projects/`

**Files**:
- Create: `src/components/GalleryCanvas.svelte`
- Screenshots already added to `public/images/projects/` ✓
- `src/pages/index.astro` modified in Phase 4 (not Phase 3)

---

## Phase 4: Integration

**Goal**: Wire everything together on main page

- Replace current project list with `ProjectCarousel`
- Add theme toggle to Header
- Ensure theme persists across navigation
- Test mobile responsiveness

**Files**:
- Modify: `src/pages/index.astro`
- Modify: `src/components/Header.astro`

---

## Phase 5: CI-Automated PDF Resume Generation

**Goal**: Auto-regenerate a PDF for every resume variant (`resume.md`, `resume-fe.md`, etc.) on every push so all download buttons always reflect the latest markdown content.

**How it works**:
1. GitHub Actions workflow triggers on push to `main` when any `src/content/resume*.md` changes
2. Workflow runs `astro build` then starts the Node server (`node dist/server/entry.mjs`)
3. Waits for the server to be ready
4. For each known variant, Puppeteer visits the corresponding `/resume-print?aud=<variant>` page and saves a PDF to `public/resume-<variant>.pdf`; the default `/resume-print` saves to `public/resume.pdf`
5. Commits all updated PDFs back to the repo

**File**: `.github/workflows/generate-resume.yml`

```yaml
name: Generate Resume PDFs
on:
  push:
    branches: [main]
    paths:
      - 'src/content/resume*.md'

jobs:
  generate-pdf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: HOST=0.0.0.0 node dist/server/entry.mjs &
      - run: npx wait-on http://localhost:4321
      - run: npm run resume   # must iterate over all variants
      - name: Commit updated PDFs
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add public/resume*.pdf
          git diff --staged --quiet || git commit -m "chore: regenerate resume PDFs [skip ci]"
          git push
```

> **Note**: The `[skip ci]` tag prevents the bot commit from triggering another workflow run. The `paths` filter avoids running on unrelated pushes. The `npm run resume` script (`src/print-resume.js`) needs to be updated to iterate over all variants and save each to its own PDF file.

**Files**:
- Create: `.github/workflows/generate-resume.yml`
- Modify: `src/print-resume.js` (iterate variants, save `public/resume-<variant>.pdf` per variant)

---

## Dependencies to Add

```json
{
  "@astrojs/svelte": "^5.0.0",
  "svelte": "^5.0.0",
  "three": "^0.170.0"
}
```

---

## Build Order

1. ~~Tag banner~~ ✓ done
2. ~~SSR + `?aud=` resume variants~~ ✓ done
3. Remove existing dark/light toggle from `Header.astro`
4. Theme system foundation (CSS variables + localStorage)
5. Theme CSS for all 5 themes
6. Theme toggle UI (floating button)
7. Install `@astrojs/svelte`, `svelte`, `three`
8. Add static project screenshot images to `public/images/projects/`
9. Build `GalleryCanvas.svelte` (scene, cards, raycasting, hover, float animation)
10. Scroll interpolation for gallery
11. Mobile fallback (DOM grid)
12. Final integration into `index.astro`
13. GitHub Actions workflow for PDF generation

---

## Design Decisions

### Tag Banner
- Use existing skills list + project tech tags
- Default: current skills

### Theme Default
- Starry Night (fits dark aesthetic, distinctive)

### Theme Toggle Location
- Floating button in bottom-right corner (non-intrusive)
- **Action required**: `Header.astro` already has a dark/light toggle wired to localStorage. The new 5-theme system must replace it entirely — remove the existing toggle and migrate its localStorage key to the new theme system to avoid two conflicting theme mechanisms.

### Svelte Island Hydration
- All interactive Svelte components (`TagBanner`, `ProjectCarousel`, `ProjectCard3D`, theme toggle) must be mounted with a `client:` directive in `.astro` files or they will render as static HTML with no interactivity.
- Use `client:visible` for the carousel (lazy hydrate when scrolled into view) and `client:load` for the theme toggle (needed immediately on page load).

### Scroll-Driven Animation Browser Support
- `animation-timeline: scroll()` is supported in Chrome 115+, Edge 115+, Firefox 110+. Safari support is partial.
- Implement the carousel scroll effect in CSS scroll-driven animations first, with a JS `scroll` event listener fallback for Safari. Detect support via `CSS.supports('animation-timeline', 'scroll()')`.

### PDF Generation
- PDF is generated at build time via Puppeteer (`src/print-resume.js`) rendering the `/resume-print` Astro page.
- Automate via GitHub Actions CI so the PDF regenerates on every push without manual intervention (see Phase 5).

---

## Mobile Considerations

- Tag banner: horizontal scroll on mobile
- Project carousel: fall back to stacked grid
- 3D effects: disable on low-power devices
- Touch gestures: swipe support for carousel fallback