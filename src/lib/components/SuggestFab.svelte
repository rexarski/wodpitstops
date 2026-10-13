<script lang="ts">
	// Always-available ask: a tab on the right edge (desktop) or a square button
	// bottom-right (phones) that opens the three ways to contribute.
	import { SITE } from '#lib/site.js';
	import MapPinPlus from '@lucide/svelte/icons/map-pin-plus';
	import X from '@lucide/svelte/icons/x';
	let open = $state(false);
	let root: HTMLElement;
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
	function onPointer(e: PointerEvent) {
		if (open && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onkeydown={onKey} onpointerdown={onPointer} />

<div class="fab" bind:this={root}>
	<button
		class="tab"
		class:open
		type="button"
		aria-expanded={open}
		aria-controls="suggest-panel"
		onclick={() => (open = !open)}
	>
		<span class="icon">
			{#if open}<X size={16} strokeWidth={1.75} />{:else}<MapPinPlus size={16} strokeWidth={1.75} />{/if}
		</span>
		<span class="label">{open ? 'close' : 'suggest a stop'}</span>
	</button>
	{#if open}
		<div class="panel" id="suggest-panel" role="dialog" aria-label="Suggest a stop">
			<p class="caption">know the trail? this list is yours to fix.</p>
			<a href={SITE.suggest} target="_blank" rel="noopener">
				<strong>suggest a stop</strong>
				<span>name, nearest mile marker, why it is worth it</span>
			</a>
			<a href={SITE.correct} target="_blank" rel="noopener">
				<strong>report a correction</strong>
				<span>closed, moved, wrong hours or distance</span>
			</a>
			<a href="mailto:{SITE.email}?subject=W%26OD%20pit%20stop">
				<strong>email instead</strong>
				<span>{SITE.email}</span>
			</a>
		</div>
	{/if}
</div>

<style>
	.fab {
		position: fixed;
		right: 0;
		top: 50%;
		z-index: 20;
		transform: translateY(-50%);
	}
	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 0.55rem;
		border: 1px solid var(--ink);
		border-right: 0;
		border-radius: var(--radius) 0 0 var(--radius);
		background: var(--bg);
		color: var(--ink);
		font-size: 12px;
		line-height: 1;
		cursor: pointer;
		/* Vertical tab: text reads bottom-to-top like a book spine. */
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}
	.tab:hover,
	.tab.open,
	.tab:focus-visible {
		background: var(--ink);
		color: var(--bg);
		outline: none;
	}
	.icon {
		display: inline-flex;
		transform: rotate(90deg);
	}
	.panel {
		position: absolute;
		right: calc(100% + 0.6rem);
		top: 50%;
		transform: translateY(-50%);
		width: min(19rem, calc(100vw - 4.5rem));
		padding: 0.9rem 1rem 1rem;
		border: 1px solid var(--ink);
		border-radius: var(--radius);
		background: var(--bg);
		display: grid;
		gap: 0.65rem;
		animation: panel-in 0.18s ease-out both;
	}
	.panel .caption {
		margin: 0 0 0.2rem;
		text-align: left;
	}
	.panel a {
		display: grid;
		gap: 0.15rem;
		text-decoration: none;
		color: var(--ink);
		padding: 0.45rem 0.55rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
	}
	.panel a:hover,
	.panel a:focus-visible {
		border-color: var(--ink);
		outline: none;
	}
	.panel strong {
		font-weight: 600;
	}
	.panel span {
		font-size: 12px;
		color: var(--ink-2);
	}
	@keyframes panel-in {
		from {
			opacity: 0;
			transform: translate(6px, -50%);
		}
	}
	@media (max-width: 860px) {
		.fab {
			top: auto;
			bottom: 1rem;
			right: 1rem;
			transform: none;
		}
		.tab {
			writing-mode: horizontal-tb;
			transform: none;
			width: 44px;
			height: 44px;
			padding: 0;
			justify-content: center;
			border-right: 1px solid var(--ink);
			border-radius: var(--radius);
		}
		.icon {
			transform: none;
		}
		.label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0 0 0 0);
		}
		.panel {
			right: 0;
			top: auto;
			bottom: calc(100% + 0.6rem);
			transform: none;
			animation-name: panel-in-up;
		}
		@keyframes panel-in-up {
			from {
				opacity: 0;
				transform: translateY(6px);
			}
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tab,
		.panel {
			transition: none;
			animation: none;
		}
	}
	@media print {
		.fab {
			display: none;
		}
	}
</style>
