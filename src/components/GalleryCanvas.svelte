<script>
    import { onMount, onDestroy } from "svelte";

    const { projects } = $props();

    // ── Mobile detection (reactive, driven by ResizeObserver) ───────────────
    const MOBILE_BREAKPOINT = 560;
    let isMobile = $state(false); // real value set in onMount (window not available during SSR)

    // ── Canvas ref ──────────────────────────────────────────────────────────
    let canvasEl;

    // ── Cleanup handle ──────────────────────────────────────────────────────
    let dispose = () => {};

    onMount(async () => {
        // Wait one tick so the canvas element is measured correctly
        await new Promise((r) => requestAnimationFrame(r));

        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            isMobile = true;
            return;
        }

        const THREE = await import("three");

        // ── Renderer ────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            antialias: true,
            alpha: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight, false);

        // ── Scene + camera ───────────────────────────────────────────────────
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            45,
            canvasEl.clientWidth / canvasEl.clientHeight,
            0.1,
            100
        );
        camera.position.set(0, 0, 6);

        // ── Lighting ─────────────────────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0xffffff, 1.2));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(3, 4, 5);
        scene.add(dirLight);

        // ── Card geometry ────────────────────────────────────────────────────
        // Card face is 16:9-ish, thin depth
        const CARD_W = 1.0;
        const CARD_H = 1.0;
        const CARD_D = 0.2;

        // Grid: 2 cols × N rows, spacing
        const COLS = 2;
        const GAP_X = 0.28;
        const GAP_Y = 0.48;
        const GRID_W = COLS * CARD_W + (COLS - 1) * GAP_X;

        // ── Texture loader ───────────────────────────────────────────────────
        const loader = new THREE.TextureLoader();

        // ── Shared gradient texture for side/back faces ──────────────────────
        // Drawn once on a small offscreen canvas, shared across all cards
        const gradCanvas = document.createElement("canvas");
        gradCanvas.width = 64;
        gradCanvas.height = 64;
        const gctx = gradCanvas.getContext("2d");
        const grad = gctx.createLinearGradient(0, 0, 64, 64);
        grad.addColorStop(0, "#1e2a3a");
        grad.addColorStop(1, "#0d1520");
        gctx.fillStyle = grad;
        gctx.fillRect(0, 0, 64, 64);
        const gradTex = new THREE.CanvasTexture(gradCanvas);

        // ── Card group (parallax target) ─────────────────────────────────────
        const group = new THREE.Group();
        scene.add(group);

        // Per-card data for animation + interaction
        const cards = [];

        // Label strip dimensions
        const LABEL_H = 0.22;
        const LABEL_GAP = 0.10; // gap between card bottom and label top

        projects.forEach((proj, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);

            // Base position — centre the grid
            const rows = Math.ceil(projects.length / COLS);
            const GRID_H = rows * CARD_H + (rows - 1) * GAP_Y;
            const bx = -GRID_W / 2 + col * (CARD_W + GAP_X) + CARD_W / 2;
            const by = GRID_H / 2 - row * (CARD_H + GAP_Y) - CARD_H / 2;

            // Stagger offsets
            const depthOffset = (Math.random() - 0.5) * 0.0;
            const yRotOffset = (Math.random() - 0.5) * 0.0; // ±~10°

            // Front face texture
            const texture = loader.load(`/images/projects/${proj.image}`);
            texture.colorSpace = THREE.SRGBColorSpace;

            const faceMat = new THREE.MeshStandardMaterial({
                map: texture,
                emissive: new THREE.Color(0x000000),
                emissiveIntensity: 0,
            });
            const sideMat = new THREE.MeshStandardMaterial({
                map: gradTex,
                emissive: new THREE.Color(0x000000),
                emissiveIntensity: 0,
            });

            // BoxGeometry face order: +X, -X, +Y, -Y, +Z (front), -Z (back)
            const materials = [sideMat, sideMat, sideMat, sideMat, faceMat, sideMat];
            const geo = new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D);
            const mesh = new THREE.Mesh(geo, materials);

            mesh.position.set(bx, by, depthOffset);
            mesh.rotation.y = yRotOffset;

            // ── Tag label strip ──────────────────────────────────────────────
            const tags = (proj.tags || []).slice(0, 3);
            const labelCanvas = document.createElement("canvas");
            const LCW = 256;
            const LCH = 56;
            const TAG_SPACING = 22;
            labelCanvas.width = LCW;
            labelCanvas.height = LCH;
            const lctx = labelCanvas.getContext("2d");

            // Background — solid color
            lctx.fillStyle = "#1e2a3a";
            lctx.roundRect(0, 0, LCW, LCH, 6);
            lctx.fill();

            // Tag text (no pill background)
            lctx.font = "bold 24px sans-serif";
            let px = 4;
            const py = LCH / 2;
            tags.forEach((tag) => {
                const tw = lctx.measureText(tag).width;
                lctx.fillStyle = "#c8d8e8";
                lctx.fillText(tag, px + 7, py + 5); // 7 and 5 are heuristic adjustments to make the texts position better
                px += tw + TAG_SPACING;
            });

            const labelTex = new THREE.CanvasTexture(labelCanvas);
            const labelMat = new THREE.MeshBasicMaterial({
                map: labelTex,
                transparent: true,
            });
            const labelGeo = new THREE.PlaneGeometry(CARD_W, LABEL_H);
            const labelMesh = new THREE.Mesh(labelGeo, labelMat);
            // Position relative to card: just below card bottom, slightly in front
            labelMesh.position.set(
                0,
                -(CARD_H / 2 + LABEL_GAP + LABEL_H / 2),
                CARD_D / 2 + 0.001
            );
            mesh.add(labelMesh);

            // Store base pose for animation
            const basePos = mesh.position.clone();
            const baseRotY = yRotOffset;
            const phase = Math.random() * Math.PI * 2;

            group.add(mesh);
            cards.push({ mesh, basePos, baseRotY, phase, proj });
        });

        // ── Mouse parallax state ─────────────────────────────────────────────
        let mouseNorm = { x: 0, y: 0 }; // -1..1
        const PARALLAX_STRENGTH = 0.35;

        function onMouseMove(e) {
            const rect = canvasEl.getBoundingClientRect();
            mouseNorm.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouseNorm.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        }
        canvasEl.addEventListener("mousemove", onMouseMove);

        // ── Raycaster ────────────────────────────────────────────────────────
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let hoveredCard = null;

        const HOVER_EMISSIVE = new THREE.Color(0xe3f5ff);
        const HOVER_SCALE = 1.2;
        const NORMAL_SCALE = 1.0;
        const LERP_SPEED = 0.12;

        function onMouseMoveRay(e) {
            const rect = canvasEl.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        }
        canvasEl.addEventListener("mousemove", onMouseMoveRay);

        // ── Click handler ────────────────────────────────────────────────────
        function onClick() {
            if (hoveredCard) {
                window.open(hoveredCard.proj.link, "_blank", "noopener,noreferrer");
            }
        }
        canvasEl.addEventListener("click", onClick);
        canvasEl.style.cursor = "default";

        // ── Animation loop ───────────────────────────────────────────────────
        let animId;
        let groupTargetX = 0;
        let groupTargetY = 0;

        function animate(t) {
            animId = requestAnimationFrame(animate);
            const time = t * 0.005;

            // Per-card jiggle (local X + Y rotation)
            cards.forEach(({ mesh, basePos, baseRotY, phase }) => {
                mesh.rotation.x = Math.sin(time * 0.5 + phase) * 0.04;
                mesh.rotation.y = baseRotY + Math.sin(time * 0.4 + phase + 1) * 0.05;
                // subtle vertical float
                mesh.position.y = basePos.y + Math.sin(time * 0.6 + phase) * 0.03;
            });

            // Mouse parallax — smoothly move group toward target
            groupTargetX = -mouseNorm.x * PARALLAX_STRENGTH;
            groupTargetY = -mouseNorm.y * PARALLAX_STRENGTH * 0.6;
            group.position.x += (groupTargetX - group.position.x) * LERP_SPEED;
            group.position.y += (groupTargetY - group.position.y) * LERP_SPEED;

            // Raycasting hover
            raycaster.setFromCamera(pointer, camera);
            const meshes = cards.map((c) => c.mesh);
            const hits = raycaster.intersectObjects(meshes);
            const hit = hits.length > 0 ? cards.find((c) => c.mesh === hits[0].object) : null;

            if (hit !== hoveredCard) {
                // Un-hover previous
                if (hoveredCard) {
                    hoveredCard.mesh.material.forEach?.((m) => {
                        m.emissiveIntensity = 0;
                        m.emissive.set(0x000000);
                    });
                }
                hoveredCard = hit;
                canvasEl.style.cursor = hit ? "pointer" : "default";
            }

            // Lerp scale + emissive for hovered card
            cards.forEach((card) => {
                const isHovered = card === hoveredCard;
                const targetScale = isHovered ? HOVER_SCALE : NORMAL_SCALE;
                card.mesh.scale.x += (targetScale - card.mesh.scale.x) * 0.1;
                card.mesh.scale.y += (targetScale - card.mesh.scale.y) * 0.1;

                const faceMat = card.mesh.material[4]; // +Z face
                if (isHovered) {
                    faceMat.emissive.lerp(HOVER_EMISSIVE, 0.1);
                    faceMat.emissiveIntensity = 0.25;
                } else {
                    faceMat.emissive.lerp(new THREE.Color(0x000000), 0.1);
                    faceMat.emissiveIntensity = Math.max(0, faceMat.emissiveIntensity - 0.02);
                }
            });

            renderer.render(scene, camera);
        }
        animate(0);

        // ── Resize (ResizeObserver so canvas tracks container, not window) ───
        const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            if (width <= MOBILE_BREAKPOINT) {
                isMobile = true;
                return;
            }
            if (height === 0) return;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false); // false = don't set inline style
        });
        ro.observe(canvasEl);

        // ── Cleanup ──────────────────────────────────────────────────────────
        dispose = () => {
            cancelAnimationFrame(animId);
            ro.disconnect();
            canvasEl.removeEventListener("mousemove", onMouseMove);
            canvasEl.removeEventListener("mousemove", onMouseMoveRay);
            canvasEl.removeEventListener("click", onClick);
            gradTex.dispose();
            cards.forEach(({ mesh }) => {
                mesh.geometry.dispose();
                mesh.material.forEach?.((m) => {
                    m.map?.dispose();
                    m.dispose();
                });
                mesh.children.forEach((child) => {
                    child.geometry.dispose();
                    child.material.map?.dispose();
                    child.material.dispose();
                });
            });
            renderer.dispose();
        };
    });

    onDestroy(() => dispose());
</script>

{#if isMobile}
    <!-- Mobile DOM fallback -->
    <div class="mobile-grid">
        {#each projects as proj}
            <a
                href={proj.link}
                target="_blank"
                rel="noopener noreferrer"
                class="mobile-card"
            >
                <img src={`/images/projects/${proj.image}`} alt={proj.title} />
                <p>{proj.title}</p>
            </a>
        {/each}
    </div>
{:else}
    <canvas bind:this={canvasEl} class="gallery-canvas"></canvas>
{/if}

<style>
    .gallery-canvas {
        width: 100%;
        height: 100%;
        min-height: 400px;
        display: block;
    }

    .mobile-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        padding: 1rem 0;
    }

    .mobile-card {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        text-decoration: none;
        color: var(--color-primary);
    }

    .mobile-card img {
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        border-radius: 4px;
    }

    .mobile-card p {
        font-size: 0.8rem;
        margin: 0;
    }
</style>
