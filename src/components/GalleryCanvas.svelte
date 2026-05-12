<script>
    import { onMount, onDestroy } from "svelte";

    const { projects } = $props();

    // ── Mobile detection ────────────────────────────────────────────────────
    let isMobile = $state(false);

    // ── Canvas ref ──────────────────────────────────────────────────────────
    let canvasEl;

    // ── Cleanup handle ──────────────────────────────────────────────────────
    let dispose = () => {};

    onMount(async () => {
        isMobile = window.matchMedia("(max-width: 768px)").matches;
        if (isMobile) return;

        const THREE = await import("three");

        // ── Renderer ────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            antialias: true,
            alpha: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight);

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
        const CARD_D = 0.1;

        // Grid: 2 cols × N rows, spacing
        const COLS = 2;
        const GAP_X = 0.28;
        const GAP_Y = 0.32;
        const GRID_W = COLS * CARD_W + (COLS - 1) * GAP_X;

        // ── Texture loader ───────────────────────────────────────────────────
        const loader = new THREE.TextureLoader();

        // ── Card group (parallax target) ─────────────────────────────────────
        const group = new THREE.Group();
        scene.add(group);

        // Per-card data for animation + interaction
        const cards = [];

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

            // Materials: front face gets texture, sides get plain dark
            const texture = loader.load(`/images/projects/${proj.image}`);
            texture.colorSpace = THREE.SRGBColorSpace;

            const faceMat = new THREE.MeshStandardMaterial({
                map: texture,
                emissive: new THREE.Color(0x000000),
                emissiveIntensity: 0,
            });
            const sideMat = new THREE.MeshStandardMaterial({
                color: 0x1a1a2e,
                emissive: new THREE.Color(0x000000),
                emissiveIntensity: 0,
            });

            // BoxGeometry face order: +X, -X, +Y, -Y, +Z (front), -Z (back)
            const materials = [sideMat, sideMat, sideMat, sideMat, faceMat, sideMat];
            const geo = new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D);
            const mesh = new THREE.Mesh(geo, materials);

            mesh.position.set(bx, by, depthOffset);
            mesh.rotation.y = yRotOffset;

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

        // ── Resize ───────────────────────────────────────────────────────────
        function onResize() {
            const w = canvasEl.clientWidth;
            const h = canvasEl.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        window.addEventListener("resize", onResize);

        // ── Cleanup ──────────────────────────────────────────────────────────
        dispose = () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", onResize);
            canvasEl.removeEventListener("mousemove", onMouseMove);
            canvasEl.removeEventListener("mousemove", onMouseMoveRay);
            canvasEl.removeEventListener("click", onClick);
            cards.forEach(({ mesh }) => {
                mesh.geometry.dispose();
                mesh.material.forEach?.((m) => {
                    m.map?.dispose();
                    m.dispose();
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
        height: 480px;
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
