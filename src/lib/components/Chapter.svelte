<script lang="ts">
	import PlaceCard from './PlaceCard.svelte';
	import type { Numbered, Segment } from '#lib/types.js';
	import { SITE } from '#lib/site.js';
	let { segment, entries, active }: { segment: Segment; entries: Numbered[]; active: boolean } = $props();
</script>

<section class="chapter" class:active id={segment.id} data-step aria-current={active ? 'step' : undefined}>
	<h2>{segment.title}</h2>
	<p class="caption">{segment.range}</p>
	<div class="body">
		{#each segment.body as para, i (i)}
			<p>{para}</p>
		{/each}
	</div>

	{#if entries.length}
		<ol class="places">
			{#each entries as e (e.place.id)}
				<li><PlaceCard place={e.place} n={e.n} /></li>
			{/each}
		</ol>
	{:else}
		<p class="empty">no stops of the selected kinds on this stretch yet.</p>
	{/if}
	<p class="ask">
		missing something on this stretch?
		<a href="{SITE.suggest}&title={encodeURIComponent(`[place] ${segment.title}: `)}" target="_blank" rel="noopener">suggest a stop ↗</a>
	</p>
</section>

<style>
	.chapter {
		padding: 22vh 0 18vh;
		opacity: 0.45;
		transition: opacity 0.35s ease;
	}
	.chapter.active {
		opacity: 1;
	}
	.chapter:first-child {
		padding-top: 12vh;
	}
	.body {
		margin-top: 1.5rem;
		color: var(--ink-2);
	}
	.places {
		list-style: none;
		padding: 0;
		margin: 1.2rem 0 0;
		border-top: 1px solid var(--ink);
	}
	.places li + li {
		border-top: 1px solid var(--line);
	}
	.empty {
		margin-top: 1.2rem;
		color: var(--ink-3);
		text-align: center;
	}
	.ask {
		margin: 1.4rem 0 0;
		color: var(--ink-3);
		font-size: 0.9em;
	}
	@media (max-width: 860px) {
		.chapter {
			padding: 10vh 0;
		}
		.chapter:first-child {
			padding-top: 1.5rem;
		}
	}
</style>
