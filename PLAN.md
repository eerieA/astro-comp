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

**Goal**: 3D vertical scroll carousel + tilt/flip cards

**Components**:
- `ProjectCarousel.svelte` - main 3D carousel container
- `ProjectCard3D.svelte` - interactive card variant

**Features**:
- Scroll-driven: carousel moves as user scrolls vertically
- Vertical layout
- Unusual/uneven tile sizes for visual interest
- Mobile: fall back to stacked grid with hover effects only
- Intersection Observer for lazy loading
- Cards tilt on hover using CSS 3D transforms
- 3D depth effect with perspective transforms

**Files**:
- Create: `src/components/ProjectCarousel.svelte`
- Create: `src/components/ProjectCard3D.svelte`
- Modify: `src/pages/index.astro`

---

## Phase 5: CI-Automated PDF Resume Generation

**Goal**: Auto-regenerate `public/resume.pdf` on every push so the download button always reflects the latest markdown content.

**How it works**:
1. GitHub Actions workflow triggers on push to `main`
2. Workflow runs `astro build` (needed so `/resume-print` exists to be visited)
3. Runs `astro preview` in the background, waits for it to be ready
4. Runs `npm run resume` (Puppeteer visits `/resume-print`, saves PDF)
5. Commits the updated `public/resume.pdf` back to the repo

**File**: `.github/workflows/generate-resume.yml`

```yaml
name: Generate Resume PDF
on:
  push:
    branches: [main]
    paths:
      - 'src/content/resume.md'   # only trigger when resume content changes

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
      - run: npm run preview &
      - run: npx wait-on http://localhost:4321
      - run: npm run resume
      - name: Commit updated PDF
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add public/resume.pdf
          git diff --staged --quiet || git commit -m "chore: regenerate resume PDF [skip ci]"
          git push
```

> **Note**: The `[skip ci]` tag prevents the bot commit from triggering another workflow run. The `paths` filter avoids running on unrelated pushes.

**Files**:
- Create: `.github/workflows/generate-resume.yml`

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

## Dependencies to Add

```json
{
  "@astrojs/svelte": "^5.0.0",
  "svelte": "^5.0.0"
}
```

> **Note**: `svelte-motion` was considered but excluded — it targets Svelte 3 and is unmaintained. All 3D effects use native CSS transforms (`perspective`, `rotateX/Y`, `translateZ`) driven by Svelte `mousemove`/`scroll` event handlers instead.

---

## Build Order

1. Tag banner (simple, good warm-up)
2. Remove existing dark/light toggle from `Header.astro`
3. Theme system foundation (CSS variables + localStorage)
4. Theme CSS for all 5 themes
5. Theme toggle UI (floating button)
6. 3D carousel component (CSS scroll-driven + JS fallback for Safari)
7. Card tilt/flip effects
8. Mobile fallbacks
9. Final integration
10. GitHub Actions workflow for PDF generation

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