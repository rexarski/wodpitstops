<script lang="ts">
	import { elevationAt, type Elevation, type Segment } from '#lib/types.js';
	import { SITE } from '#lib/site.js';

	interface Props {
		elevation: Elevation;
		end: number;
		segment: Segment | null;
		currentMile: number;
	}
	let { elevation, end, segment, currentMile }: Props = $props();

	let cw = $state(320);
	let ch = $state(100);
	const PAD = { l: 50, r: 14, t: 30, b: 18 };
	const lo = $derived(Math.floor(elevation.minFt / 100) * 100);
	const hi = $derived(Math.ceil(elevation.maxFt / 100) * 100);
	const x = $derived((m: number) => PAD.l + (m / end) * (cw - PAD.l - PAD.r));
	const y = $derived((ft: number) => PAD.t + (1 - (ft - lo) / (hi - lo)) * (ch - PAD.t - PAD.b));

	const linePath = $derived(
		elevation.samples.map(([m, ft], i) => `${i ? 'L' : 'M'}${x(m).toFixed(1)} ${y(ft).toFixed(1)}`).join(' ')
	);
	const areaPath = $derived(`${linePath} L${x(end).toFixed(1)} ${y(lo)} L${x(0).toFixed(1)} ${y(lo)} Z`);
	const mileTicks = $derived(Array.from({ length: Math.floor(end / 10) + 1 }, (_, i) => i * 10));
	const segEnd = $derived(segment ? Math.min(segment.to, end) : 0);
	const ft = $derived(elevationAt(elevation, currentMile));
	const label = $derived(
		segment
			? `mile ${currentMile.toFixed(1)} · ${ft} ft · ${segment.title.toLowerCase()}`
			: `${SITE.trailMiles} miles · ${elevation.minFt}–${elevation.maxFt} ft · shirlington to purcellville`
	);
	// Readout follows the cursor on wide charts; on narrow ones it is centered so it never clips.
	const narrow = $derived(cw < 560);
	const labelX = $derived(narrow ? cw / 2 : Math.min(Math.max(x(currentMile), PAD.l), cw - PAD.r));
	const labelAnchor = $derived(narrow ? 'middle' : x(currentMile) > cw * 0.6 ? 'end' : 'start');
</script>

<div class="profile" bind:clientWidth={cw} bind:clientHeight={ch} aria-live="polite">
	<svg viewBox="0 0 {cw} {ch}" width={cw} height={ch} role="img">
		<title>Elevation profile of the trail, {elevation.minFt} to {elevation.maxFt} feet</title>
		{#if segment}
			<rect class="band" x={x(segment.from)} y={PAD.t} width={x(segEnd) - x(segment.from)} height={ch - PAD.t - PAD.b} />
		{/if}
		<path class="area" d={areaPath} />
		<path class="line" d={linePath} />
		<g class="axis">
			<text x={PAD.l - 6} y={y(hi) + 4} text-anchor="end">{hi} ft</text>
			<text x={PAD.l - 6} y={y(lo) + 4} text-anchor="end">{lo}</text>
			{#each mileTicks as m (m)}
				<text x={x(m)} y={ch - 4} text-anchor="middle">{m}</text>
			{/each}
		</g>
		{#if segment}
			<line class="cursor" x1={x(currentMile)} x2={x(currentMile)} y1={PAD.t} y2={ch - PAD.b} />
			<circle class="dot" cx={x(currentMile)} cy={y(ft)} r="3.5" />
		{/if}
		<text class="readout" x={segment ? labelX : narrow ? cw / 2 : PAD.l} y="16" text-anchor={segment ? labelAnchor : narrow ? 'middle' : 'start'}>{label}</text>
	</svg>
</div>

<style>
	.profile {
		height: 100%;
		width: 100%;
		background: var(--bg);
		border-top: 1px solid var(--line);
	}
	svg {
		display: block;
	}
	.band {
		fill: var(--ink);
		opacity: 0.08;
	}
	.area {
		fill: var(--line);
	}
	.line {
		fill: none;
		stroke: var(--ink);
		stroke-width: 1.5;
	}
	.axis text {
		font-family: var(--font-mono);
		font-size: 10px;
		fill: var(--ink-3);
	}
	.cursor {
		stroke: var(--ink);
		stroke-width: 1;
	}
	.dot {
		fill: var(--ink);
		stroke: var(--bg);
		stroke-width: 1.5;
	}
	.readout {
		font-family: var(--font-mono);
		font-size: 12px;
		fill: var(--ink);
		paint-order: stroke;
		stroke: var(--bg);
		stroke-width: 3;
		stroke-linejoin: round;
	}
</style>
