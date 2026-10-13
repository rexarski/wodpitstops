<script lang="ts">
	// Always-available ask: a tab on the right edge (desktop) or a square button
	// bottom-right (phones) that opens the repo's issue chooser. A plain link, no state.
	import { SITE } from '#lib/site.js';
</script>

<a class="suggest" href="{SITE.repo}/issues/new/choose" target="_blank" rel="noopener">
	<span class="plus" aria-hidden="true">+</span>
	<span class="label">suggest a stop</span>
</a>

<style>
	.suggest {
		position: fixed;
		z-index: 20;
		right: 0;
		top: 50%;
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.7rem 0.55rem;
		border: 1px solid var(--ink);
		border-right: 0;
		border-radius: var(--radius) 0 0 var(--radius);
		background: var(--bg);
		color: var(--ink);
		font-size: 12px;
		line-height: 1;
		text-decoration: none;
		/* Vertical tab: reads bottom-to-top like a book spine. */
		writing-mode: vertical-rl;
		transform: translateY(-50%) rotate(180deg);
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}
	.suggest:hover,
	.suggest:focus-visible {
		background: var(--ink);
		color: var(--bg);
		outline: none;
	}
	.plus {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 16px;
		transform: rotate(90deg);
	}
	@media (max-width: 860px) {
		.suggest {
			top: auto;
			bottom: 1rem;
			right: 1rem;
			width: 44px;
			height: 44px;
			padding: 0;
			justify-content: center;
			border-right: 1px solid var(--ink);
			border-radius: var(--radius);
			writing-mode: horizontal-tb;
			transform: none;
		}
		.plus {
			font-size: 22px;
			transform: none;
		}
		.label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0 0 0 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.suggest {
			transition: none;
		}
	}
	@media print {
		.suggest {
			display: none;
		}
	}
</style>
