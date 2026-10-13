<script lang="ts">
	import { CATEGORY_LABEL, kindsOf, type Numbered } from '#lib/types.js';
	import { mapsUrl } from '#lib/links.js';
	import CategoryIcon from './CategoryIcon.svelte';
	let { entries }: { entries: Numbered[] } = $props();
</script>

<div class="tablewrap">
	<table>
		<thead>
			<tr>
				<th class="r">#</th>
				<th class="r">mile</th>
				<th>stop</th>
				<th>kind</th>
				<th>town</th>
				<th>address</th>
				<th>links</th>
				<th>source</th>
			</tr>
		</thead>
		<tbody>
			{#each entries as { place: p, n } (p.id)}
				<tr>
					<td class="r">{n}</td>
					<td class="r">{p.mile.toFixed(1)}</td>
					<td class="name">{p.name}</td>
					<td class="kind">
						{#each kindsOf(p) as k, i (k)}<CategoryIcon category={k} size={13} /> {i ? CATEGORY_LABEL[k].toLowerCase() : CATEGORY_LABEL[k]}{#if i < kindsOf(p).length - 1},{' '}{/if}{/each}
					</td>
					<td>{p.town}</td>
					<td>{p.address ?? p.offTrail ?? ''}</td>
					<td class="links">
						{#if p.url}
							<a href={p.url} target="_blank" rel="noopener">website</a>{' · '}
						{/if}
						<a href={mapsUrl(p)} target="_blank" rel="noopener">map</a>
					</td>
					<td class="src">{p.source ?? ''}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.tablewrap {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
		min-width: 860px;
	}
	th {
		text-align: left;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 11px;
		padding: 0.5rem 0.6rem;
		border-bottom: 1px solid var(--ink);
		white-space: nowrap;
	}
	td {
		padding: 0.5rem 0.6rem;
		border-bottom: 1px solid var(--line);
		vertical-align: top;
	}
	.r {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.name {
		color: var(--ink);
		white-space: nowrap;
	}
	.kind {
		white-space: nowrap;
	}
	.kind :global(svg) {
		vertical-align: -2px;
		margin-right: 0.2rem;
	}
	.links {
		white-space: nowrap;
	}
	.src {
		color: var(--ink-3);
	}
	td:not(.name) {
		color: var(--ink-2);
	}
</style>
