<script lang="ts">
	import { onMount } from 'svelte';
	// MapLibre's stylesheet (~65 KB, mostly control icons) and worker load with the map, not with the page.
	import mapCssUrl from 'maplibre-gl/dist/maplibre-gl.css?url';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import type { GeoJSONSource, LngLatBoundsLike, Map as MLMap, Marker } from 'maplibre-gl';
	import type { Feature } from 'geojson';
	import reach from '#lib/data/reach.json';
	import { pointAtMile, sliceByMiles } from '#lib/geo.js';
	import type { Elevation, Numbered, Place, Segment, Trail } from '#lib/types.js';
	import type { StepState } from '#lib/scrolly.js';
	import ElevationProfile from './ElevationProfile.svelte';
	import TrailInset from './TrailInset.svelte';

	interface Props {
		trail: Trail;
		segments: Segment[];
		/** Numbered places grouped per segment, already filtered; index = segment index. */
		placesBySegment: Numbered[][];
		elevation: Elevation;
		active: StepState | null;
	}
	let { trail, segments, placesBySegment, elevation, active }: Props = $props();

	// OpenFreeMap serves OpenStreetMap vector tiles with no key; Positron is its
	// quietest style, so the trail and markers stay the only strong marks.
	const STYLE = 'https://tiles.openfreemap.org/styles/positron';
	const PAD = { top: 64, right: 44, bottom: 48, left: 44 };
	const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

	const END = $derived(trail.points[trail.points.length - 1][2]);
	const allPts = $derived(trail.points.map((p) => [p[0], p[1]] as [number, number]));
	// Index alone: `active` is a fresh object on every scroll tick, the index only changes per chapter.
	const activeIndex = $derived(active ? active.index : -1);
	const segment = $derived(activeIndex >= 0 ? segments[activeIndex] : null);
	const segEnd = $derived(segment ? Math.min(segment.to, END) : 0);
	const currentMile = $derived(
		segment && active ? segment.from + (segEnd - segment.from) * active.progress : 0
	);

	type LngLat = [number, number];
	const line = (pts: LngLat[]) => ({
		type: 'Feature' as const,
		properties: {},
		geometry: { type: 'LineString' as const, coordinates: pts }
	});
	function bounds(pts: LngLat[]): LngLatBoundsLike {
		let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
		for (const [x, y] of pts) {
			w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y);
		}
		return [[w, s], [e, n]];
	}

	let container: HTMLDivElement;
	let ML: typeof import('maplibre-gl');
	let map: MLMap | undefined;
	let runner: Marker | undefined;
	let poiMarkers: { marker: Marker; base: [number, number] }[] = [];

	// Push overlapping markers apart on screen (same block, same address) so every
	// number stays readable. Re-run whenever the camera settles, since spacing changes with zoom.
	function decollide() {
		if (!map || poiMarkers.length < 2) return;
		const MIN = 25;
		const pos = poiMarkers.map(({ marker, base }) => {
			const p = map!.project(marker.getLngLat());
			return { x: p.x + base[0], y: p.y + base[1], ox: p.x, oy: p.y };
		});
		for (let iter = 0; iter < 30; iter++) {
			let moved = false;
			for (let i = 0; i < pos.length; i++)
				for (let j = i + 1; j < pos.length; j++) {
					const dx = pos[j].x - pos[i].x, dy = pos[j].y - pos[i].y;
					const d = Math.hypot(dx, dy) || 0.01;
					if (d < MIN) {
						const push = (MIN - d) / 2, ux = dx / d, uy = dy / d;
						pos[i].x -= ux * push; pos[i].y -= uy * push;
						pos[j].x += ux * push; pos[j].y += uy * push;
						moved = true;
					}
				}
			if (!moved) break;
		}
		poiMarkers.forEach(({ marker }, i) => marker.setOffset([pos[i].x - pos[i].ox, pos[i].y - pos[i].oy]));
	}
	let target: LngLat[] = [];
	let maxZoom = 11;
	let ready = $state(false);
	let failed = $state(false);

	function refit(animate = true) {
		if (!map || !target.length) return;
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		map.fitBounds(bounds(target), {
			padding: PAD,
			duration: animate && !reduced ? 1600 : 0,
			easing: easeInOut,
			essential: true,
			maxZoom
		});
	}

	onMount(() => {
		let cancelled = false;
		let started = false;
		// The map library is ~250 KB gzipped: start fetching it when the map is near the
		// viewport or the browser is idle, whichever comes first, so first paint stays light.
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) start();
			},
			{ rootMargin: '400px' }
		);
		io.observe(container);
		// Safari has no requestIdleCallback.
		const ric = window.requestIdleCallback as typeof requestIdleCallback | undefined;
		const idle = ric ? ric(start, { timeout: 2500 }) : window.setTimeout(start, 1500);

		function start() {
			if (started || cancelled) return;
			started = true;
			io.disconnect();
			void load();
		}

		function loadCss() {
			return new Promise<void>((resolve) => {
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = mapCssUrl;
				link.onload = () => resolve();
				link.onerror = () => resolve();
				document.head.append(link);
			});
		}

		async function load() {
			const [lib] = await Promise.all([import('maplibre-gl'), loadCss()]);
			ML = lib;
			if (cancelled) return;
			ML.setWorkerUrl(workerUrl);
			try {
				map = new ML.Map({
					container,
					style: STYLE,
					bounds: bounds(allPts),
					fitBoundsOptions: { padding: PAD },
					// Two-finger / ctrl+wheel to move the map, so one-finger swipes keep scrolling the page.
					cooperativeGestures: true,
					dragRotate: false,
					pitchWithRotate: false,
					attributionControl: { compact: true }
				});
			} catch (e) {
				// No WebGL2 (old browser, some headless or energy-saver modes): keep the page usable.
				console.warn('Map unavailable:', e);
				failed = true;
				return;
			}
			map.touchZoomRotate.disableRotation();
			map.on('load', () => {
				if (!map) return;
				const round = { 'line-cap': 'round' as const, 'line-join': 'round' as const };
				const milePts = {
					type: 'FeatureCollection' as const,
					features: Array.from({ length: Math.floor(END / 5) + 1 }, (_, i) => ({
						type: 'Feature' as const,
						properties: { mile: String(i * 5) },
						geometry: { type: 'Point' as const, coordinates: pointAtMile(trail, i * 5) }
					}))
				};
				// Reach band: everything within about five minutes of easy riding (scripts/build-reach.mjs).
				map.addSource('reach', { type: 'geojson', data: reach as Feature });
				map.addSource('trail', { type: 'geojson', data: line(allPts) });
				map.addSource('segment', { type: 'geojson', data: line([]) });
				map.addSource('progress', { type: 'geojson', data: line([]) });
				map.addSource('miles', { type: 'geojson', data: milePts });
				map.addLayer({ id: 'reach', type: 'fill', source: 'reach', paint: { 'fill-color': '#000', 'fill-opacity': 0.05 } });
				map.addLayer({ id: 'segment', type: 'line', source: 'segment', layout: round, paint: { 'line-color': '#000', 'line-width': 16, 'line-opacity': 0.08 } });
				map.addLayer({ id: 'trail', type: 'line', source: 'trail', layout: round, paint: { 'line-color': '#a3a3a3', 'line-width': 3 } });
				map.addLayer({ id: 'progress', type: 'line', source: 'progress', layout: round, paint: { 'line-color': '#171717', 'line-width': 4 } });
				map.addLayer({ id: 'miles', type: 'circle', source: 'miles', paint: { 'circle-radius': 3, 'circle-color': '#fff', 'circle-stroke-color': '#525252', 'circle-stroke-width': 1 } });
				map.addLayer({
					id: 'mile-labels', type: 'symbol', source: 'miles',
					layout: { 'text-field': ['get', 'mile'], 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-anchor': 'bottom', 'text-offset': [0, -0.6] },
					paint: { 'text-color': '#525252', 'text-halo-color': '#fff', 'text-halo-width': 1 }
				});
				const el = document.createElement('div');
				el.className = 'runner';
				runner = new ML.Marker({ element: el }).setLngLat(pointAtMile(trail, 0)).addTo(map);
				// The sticky container changes size (phone rotation, address bar, fonts loading); keep the fit.
				map.on('resize', () => refit(false));
				map.on('moveend', decollide);
				// Debug hook for the screenshot harness: ?debug exposes the map instance.
				if (location.search.includes('debug')) (window as unknown as { __map?: MLMap }).__map = map;
				ready = true;
			});
		}

		return () => {
			cancelled = true;
			io.disconnect();
			if (ric) window.cancelIdleCallback(idle);
			else clearTimeout(idle);
			map?.remove();
		};
	});

	// Camera and segment band follow the active chapter.
	$effect(() => {
		if (!ready || !map) return;
		const seg = segment;
		const pts = seg ? sliceByMiles(trail, seg.from, segEnd) : allPts;
		const located = seg
			? (placesBySegment[activeIndex] ?? [])
					.filter(({ place: p }) => p.lon != null && p.lat != null)
					.map(({ place: p }) => [p.lon!, p.lat!] as LngLat)
			: [];
		target = [...pts, ...located];
		maxZoom = seg ? 13.5 : 11;
		map.resize();
		refit();
		(map.getSource('segment') as GeoJSONSource).setData(line(seg ? pts : []));
	});

	// Progress line and position dot follow the reader's mile.
	$effect(() => {
		if (!ready || !map || !runner) return;
		const m = currentMile;
		(map.getSource('progress') as GeoJSONSource).setData(line(m > 0 ? sliceByMiles(trail, 0, m) : []));
		runner.setLngLat(pointAtMile(trail, m));
		runner.getElement().style.visibility = active ? 'visible' : 'hidden';
	});

	// Numbered markers for the active chapter's places. Geocoded places sit at their real
	// location; the rest sit on the trail at their mile, fanned out beside it in a compact
	// block when several share a mile so none hides another or leaves the frame.
	$effect(() => {
		if (!ready || !map) return;
		for (const { marker } of poiMarkers) marker.remove();
		poiMarkers = [];
		if (activeIndex < 0) return;
		const list = placesBySegment[activeIndex] ?? [];
		const located = (p: Place) => p.lon != null && p.lat != null;
		const groups = new Map<number, Place[]>();
		for (const { place: p } of list) {
			if (located(p)) continue;
			const k = Math.round(p.mile * 4) / 4;
			groups.set(k, [...(groups.get(k) ?? []), p]);
		}
		for (const { place: p, n } of list) {
			const el = document.createElement('div');
			el.className = 'poi';
			el.textContent = String(n);
			el.title = `${p.name} · mile ${p.mile}`;
			let at: LngLat;
			let offset: [number, number] = [0, 0];
			if (located(p)) {
				at = [p.lon!, p.lat!];
			} else {
				const k = Math.round(p.mile * 4) / 4;
				at = pointAtMile(trail, k);
				const g = groups.get(k)!;
				const i = g.indexOf(p);
				const a = map.project(pointAtMile(trail, Math.max(0, k - 0.3)));
				const b = map.project(pointAtMile(trail, Math.min(END, k + 0.3)));
				const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
				const tx = (b.x - a.x) / len, ty = (b.y - a.y) / len; // along the trail
				const nx = -ty, ny = tx; // across it
				const col = (i % 3) - 1, row = Math.floor(i / 3);
				const along = col * 26, across = 22 + row * 26;
				offset = [tx * along + nx * across, ty * along + ny * across];
			}
			poiMarkers.push({ marker: new ML.Marker({ element: el, offset }).setLngLat(at).addTo(map), base: offset });
		}
		decollide();
	});
</script>

<div class="map">
	<div class="canvas" bind:this={container} aria-label="Map of the W&OD Trail">
		{#if failed}
			<p class="nomap">The map needs WebGL2, which this browser has turned off. The chapters and elevation profile still work.</p>
		{:else if ready}
			<p class="legend">shaded band · about five minutes by bike from the trail</p>
			<TrailInset {trail} from={segment ? segment.from : null} to={segment ? segEnd : null} mile={currentMile} />
		{/if}
	</div>
	<div class="elev">
		<ElevationProfile {elevation} end={END} {segment} {currentMile} />
	</div>
</div>

<style>
	.map {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		background: var(--bg-2);
		border-bottom: 1px solid var(--line);
	}
	.canvas {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
	}
	.legend {
		position: absolute;
		z-index: 1;
		bottom: 6px;
		left: 8px;
		margin: 0;
		padding: 2px 6px;
		font-size: 11px;
		color: var(--ink-2);
		background: var(--bg);
		pointer-events: none;
	}
	.elev {
		flex: 0 0 110px;
	}
	.nomap {
		margin: 0;
		padding: 1rem;
		color: var(--ink-2);
	}
	@media (max-width: 860px) {
		.elev {
			flex-basis: 84px;
		}
		/* The attribution bar spans most of a phone-width map; sit above it. */
		.legend {
			bottom: 28px;
		}
	}
	:global(.poi) {
		animation: poi-in 500ms ease-out both;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #171717;
		color: #fff;
		border: 2px solid #fff;
		font: 600 11px/18px var(--font-display);
		text-align: center;
		cursor: default;
	}
	:global(.runner) {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #171717;
		border: 2.5px solid #fff;
	}
	:global(.maplibregl-ctrl-attrib) {
		font-size: 10px;
	}
	@keyframes poi-in {
		from {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.poi) {
			animation: none;
		}
	}
	@media (prefers-color-scheme: dark) {
		/* Positron is a light style; invert it so the map matches the page in dark mode. */
		:global(.maplibregl-canvas) {
			filter: invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9);
		}
	}
</style>
