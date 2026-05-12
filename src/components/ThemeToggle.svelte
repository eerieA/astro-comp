<script>
    import { onMount } from "svelte";

    const themes = [
        { id: "foggy-morning", label: "Foggy Morning", swatch: "#f0eeeb" },
        { id: "starry-night",  label: "Starry Night",  swatch: "#0a1520" },
        { id: "cyberpunk",     label: "Cyberpunk 2077", swatch: "#0a0a12" },
        { id: "nier",          label: "Nier Automata",  swatch: "#ebe8e2" },
        { id: "nasa",          label: "NASA White",     swatch: "#f8f9fb" },
    ];

    let current = $state("foggy-morning");
    let open = $state(false);

    onMount(() => {
        current = localStorage.getItem("theme") || "foggy-morning";
        applyTheme(current);
    });

    function applyTheme(id) {
        document.documentElement.setAttribute("data-theme", id);
        localStorage.setItem("theme", id);
        current = id;
    }

    function pick(id) {
        applyTheme(id);
        open = false;
    }
</script>

<!-- Floating container -->
<div class="theme-toggle-wrap">
    <!-- Picker panel -->
    {#if open}
        <div class="picker" role="menu">
            {#each themes as theme}
                <button
                    class="theme-option"
                    class:active={current === theme.id}
                    onclick={() => pick(theme.id)}
                    role="menuitem"
                >
                    <span class="swatch" style="background:{theme.swatch}"></span>
                    {theme.label}
                </button>
            {/each}
        </div>
    {/if}

    <!-- Toggle button -->
    <button
        class="toggle-btn"
        onclick={() => (open = !open)}
        aria-label="Change theme"
        aria-expanded={open}
    >
        ☪
    </button>
</div>

<style>
    .theme-toggle-wrap {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;
    }

    .toggle-btn {
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        font-size: 1.25rem;
        background: var(--color-neutral-100, #e8e8e2);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease;
    }

    .toggle-btn:hover {
        transform: scale(1.1);
    }

    .picker {
        background: var(--color-white, #f5f5f0);
        /* border: 1px solid var(--color-neutral-200, #d0d0c8); */
        border-radius: 0.5rem;
        padding: 0.4rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        min-width: 11rem;
    }

    .theme-option {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.4rem 0.6rem;
        border: none;
        border-radius: 0.35rem;
        background: transparent;
        cursor: pointer;
        font-size: 0.85rem;
        color: var(--color-primary, #3a3a3a);
        text-align: left;
        transition: background 0.1s ease;
    }

    .theme-option:hover {
        background: var(--color-neutral-100, #e8e8e2);
    }

    .theme-option.active {
        font-weight: 600;
        background: var(--color-neutral-200, #d0d0c8);
    }

    .swatch {
        width: 1rem;
        height: 1rem;
        border-radius: 50%;
        border: 1px solid var(--color-neutral-200, #d0d0c8);
        flex-shrink: 0;
    }
</style>
