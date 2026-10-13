<script lang="ts">
	import { CATEGORIES, CATEGORY_LABEL } from '#lib/types.js';
	import { filters } from '#lib/state.svelte.js';
	import CategoryIcon from './CategoryIcon.svelte';
</script>

<div class="filters" role="group" aria-label="Kinds of stops to show">
	<button class:on={filters.all} aria-pressed={filters.all} onclick={() => filters.reset()}>all</button>
	{#each CATEGORIES as c (c)}
		{@const on = !filters.all && filters.active.has(c)}
		<button class:on aria-pressed={on} onclick={() => filters.toggle(c)}>
			<CategoryIcon category={c} size={13} />
			{CATEGORY_LABEL[c].toLowerCase()}
		</button>
	{/each}
</div>

<style>
	.filters {
		display: flex;
		gap: 0.35rem;
		overflow-x: auto;
		padding: 0.6rem 0;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
	}
	.filters::-webkit-scrollbar {
		display: none;
	}
	button {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: 0;
		background: var(--bg-2);
		color: var(--ink-2);
		border-radius: var(--radius);
		padding: 0.25rem 0.6rem;
		font-size: 13px;
		cursor: pointer;
		white-space: nowrap;
	}
	button.on {
		background: var(--ink);
		color: var(--bg);
	}
	button:not(.on):hover {
		color: var(--ink);
	}
	button:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
</style>
