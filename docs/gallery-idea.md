# 3D Portfolio Gallery Concept Summary

## Reference Site: messenger.abeto.co

The main inspiration for this idea comes from [messenger.abeto.co](https://messenger.abeto.co), especially its intro/main-menu sequence. The tech breakdown is here: https://www.webgpu.com/showcase/messenger/ .
But I am just interested in its intro menu.

After inspecting one of the JavaScript bundles from the site, it looks like the intro menu is built as a real 3D scene cluster containing:

* a set of interactive cube-like glyph objects,
* a `BEGIN` / `ENTER` button,
* particle and ambient effects,
* custom interaction logic using raycasting,
* camera-relative positioning logic.

The `BEGIN` button itself appears to be an actual 3D mesh loaded from compressed geometry (`button.drc`), not a DOM button. Hovering and clicking are likely handled through Three.js raycasting and shader/material transitions.

Conceptually, the intro menu probably looks something like this:

```text
IntroMenuRoot
├── GlyphGrid
│   ├── Glyph_01
│   ├── Glyph_02
│   └── ...
├── BeginButton
├── AmbientFX
└── ParticleFX
```

One particularly interesting design choice is that the menu seems to “follow” the camera in world-space. Instead of pinning UI to the browser viewport, the site places the menu scene slightly in front of the camera and continuously rotates it to face the viewer. This creates the feeling that the UI physically exists inside the world.

Technically, the site feels less like:

* “a webpage with some Three.js decorations”

and more like:

* “a lightweight cinematic realtime engine.”

That said, the actual sophistication probably comes more from:

* motion design,
* easing,
* shader polish,
* depth composition,
* postprocessing,
* and interaction choreography

than from extremely complicated geometry or rendering techniques.

---

# The Portfolio Gallery Idea

The portfolio idea is inspired by the spatial layout and interaction style of that menu, but in a much simpler and more practical form.

Instead of:

* symbolic 3D glyph cubes,

the portfolio would use:

* interactive 3D cards.

Each card would:

* be a thin 3D box or beveled plane,
* display project artwork or screenshots as textures,
* react to hover,
* optionally react to scrolling,
* and possibly expand or animate on click.

The overall goal is not to build a fully immersive 3D world. The portfolio itself would still remain a normal website with DOM content such as:

* name,
* profession,
* summary,
* contact info,
* project descriptions,
* etc.

The 3D gallery would instead act as a “premium interactive section” embedded within the page.

Conceptually:

```text
Portfolio Page
├── Hero / Intro (DOM)
├── About Section (DOM)
├── 3D Gallery Section
│   └── Three.js Canvas
└── Footer (DOM)
```

The gallery itself could resemble:

```text
GalleryRoot
├── Card_01
├── Card_02
├── Card_03
└── ...
```

where each card contains:

* geometry,
* image textures,
* hover animation state,
* interaction handlers,
* subtle floating or rotation motion.

The cards would likely be arranged in a stylized spatial grid rather than a perfectly flat HTML-style layout. Small depth offsets, staggered positioning, and slight rotations could help create a more cinematic look without adding much technical complexity.

---

# Simplified Direction Compared to the Reference Site

An important realization during discussion was that the portfolio does **not** need to reproduce the architecture of the reference site literally.

The reference site is effectively:

* a fully WebGL-driven cinematic application.

The portfolio does not need:

* world navigation,
* scene transitions,
* complex camera rigs,
* fully diegetic UI,
* or game-engine-like structure.

Instead, the portfolio can borrow:

* the motion language,
* the spatial feeling,
* the hover behavior,
* and the sense of depth,

while still remaining mostly:

* DOM-driven,
* SEO-friendly,
* lightweight,
* and maintainable.

This simplifies the engineering cost significantly.

---

# Proposed Tech Stack

The recommended stack for this simplified version is:

* Astro
* Svelte
* vanilla Three.js

with optional additions such as:

* GSAP (for animation orchestration),
* Lenis (for smooth scrolling).

Importantly, React Three Fiber is probably unnecessary for this scope.

The original immersive interpretation might have justified React Three Fiber because:

* scene complexity,
* state synchronization,
* and reusable 3D component systems

would eventually become large.

But for this portfolio:

* there is only one isolated 3D section,
* one scene,
* one camera,
* and a relatively small number of interactive meshes.

That scale is very manageable in vanilla Three.js.

---

# Why Astro + Svelte + Vanilla Three.js Makes Sense

Astro works well because the site itself is still primarily a traditional content-focused website.

Astro can:

* statically render most of the page,
* keep bundle sizes small,
* and hydrate only the interactive gallery section.

Svelte then becomes a nice lightweight wrapper around the Three.js canvas lifecycle:

* mounting,
* resizing,
* cleanup,
* scroll state,
* interaction state,
* etc.

Inside the Svelte component, vanilla Three.js can manage:

* renderer,
* scene,
* camera,
* animation loop,
* raycasting,
* textures,
* hover transitions.

Conceptually, the implementation might look like:

```text
GalleryCanvas.svelte
├── init renderer
├── init scene
├── init camera
├── create cards
├── setup raycaster
├── setup scroll interpolation
├── animation loop
└── cleanup
```

This avoids:

* React overhead,
* additional abstraction layers,
* and unnecessary architectural complexity.

---

# Recommended Interaction Style

Rather than creating a fully navigable 3D environment, the interaction style can stay relatively restrained.

For example:

* cards subtly float,
* cards slightly rotate toward cursor movement,
* hovering causes glow/scale changes,
* scrolling shifts the gallery arrangement,
* camera movement remains minimal,
* and postprocessing stays subtle.

This is probably enough to achieve the desired:

> “premium interactive 3D portfolio”

feel without turning the project into a massive realtime graphics application.

The important part is less about raw graphical complexity and more about:

* motion quality,
* smooth interpolation,
* layering,
* pacing,
* and restraint.

Even relatively simple geometry can feel very high-end if the interaction design is polished carefully.
