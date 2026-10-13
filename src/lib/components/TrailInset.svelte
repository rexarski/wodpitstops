<script lang="ts">
	// Overview in the map corner: the whole trail, the active chapter in black, the reader's position.
	import { makeProjection, pointAtMile, sliceByMiles, toPath, VIEW_W } from '#lib/geo.js';
	import type { Trail } from '#lib/types.js';
	let { trail, from, to, mile }: { trail: Trail; from: number | null; to: number | null; mile: number } = $props();
	const proj = $derived(makeProjection(trail, 50));
	const all = $derived(
		toPath(
			trail.points.filter((_, i, a) => i % 3 === 0 || i === a.length - 1).map((p) => [p[0], p[1]]),
			proj.project
		)
	);
	const seg = $derived(from != null && to != null ? toPath(sliceByMiles(trail, from, to), proj.project) : '');
	const dot = $derived(proj.project(pointAtMile(trail, mile)));
</script>

<svg class="inset" viewBox="0 0 {VIEW_W} {proj.VIEW_H}" aria-hidden="true">
	<path d={all} class="all" />
	{#if seg}
		<path d={seg} class="seg" />
		<circle cx={dot[0]} cy={dot[1]} r="26" class="dot" />
	{/if}
</svg>

<style>
	.inset {
		position: absolute;
		z-index: 2;
		top: 8px;
		right: 8px;
		width: 132px;
		height: auto;
		padding: 5px;
		background: var(--bg);
		border: 1px solid var(--line);
		pointer-events: none;
	}
	path {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.all {
		stroke: var(--ink-3);
		stroke-width: 12;
	}
	.seg {
		stroke: var(--ink);
		stroke-width: 28;
	}
	.dot {
		fill: var(--bg);
		stroke: var(--ink);
		stroke-width: 12;
	}
	@media (max-width: 860px) {
		.inset {
			width: 104px;
		}
	}
</style>
