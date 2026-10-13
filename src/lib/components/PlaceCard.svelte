<script lang="ts">
	import { CATEGORY_LABEL, kindsOf, type Place } from '#lib/types.js';
	import { mapsUrl, hostname } from '#lib/links.js';
	import CategoryIcon from './CategoryIcon.svelte';
	let { place, n }: { place: Place; n: number } = $props();
	const kinds = $derived(kindsOf(place));
	const kindLabel = $derived(kinds.map((k, i) => (i ? CATEGORY_LABEL[k].toLowerCase() : CATEGORY_LABEL[k])).join(', '));
	const meta = $derived([kindLabel, `mile ${place.mile}`, place.offTrail].filter(Boolean).join(' · '));
</script>

<article class="place">
	<span class="n num" aria-hidden="true">{n}</span>
	<div>
		<h3>
			<span class="icon">{#each kinds as k (k)}<CategoryIcon category={k} size={15} />{/each}</span>{place.name}
		</h3>
		<p class="meta">{meta}</p>
		<p class="links">
			{#if place.url}
				<a href={place.url} target="_blank" rel="noopener">{hostname(place.url)} ↗</a>{' · '}
			{/if}
			<a href={mapsUrl(place)} target="_blank" rel="noopener">google maps ↗</a>
		</p>
		{#if place.notes}<p class="notes">{place.notes}</p>{/if}
		{#if place.tags?.length}<p class="tags">{place.tags.join(', ')}</p>{/if}
	</div>
</article>

<style>
	.place {
		display: grid;
		grid-template-columns: 2.2rem minmax(0, 1fr);
		gap: 0.5rem;
		padding: 0.85rem 0;
	}
	.n {
		color: var(--ink-3);
		padding-top: 0.15rem;
	}
	h3 {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 1.05rem;
		font-weight: 600;
		margin-bottom: 0.15rem;
	}
	.icon {
		display: inline-flex;
		gap: 0.25rem;
		color: var(--ink-2);
	}
	.meta,
	.links {
		color: var(--ink-2);
		margin-bottom: 0.2rem;
	}
	.links {
		margin-bottom: 0.45rem;
	}
	.notes {
		margin-bottom: 0.3rem;
	}
	.tags {
		font-size: 0.85em;
		color: var(--ink-3);
		margin: 0;
	}
</style>
