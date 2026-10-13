<script lang="ts">
	import TrailMap from '#lib/components/TrailMap.svelte';
	import Chapter from '#lib/components/Chapter.svelte';
	import CategoryFilter from '#lib/components/CategoryFilter.svelte';
	import SuggestLink from '#lib/components/SuggestLink.svelte';
	import StopsTable from '#lib/components/StopsTable.svelte';
	import { scrolly, type StepState } from '#lib/scrolly.js';
	import { filters } from '#lib/state.svelte.js';
	import { SITE } from '#lib/site.js';
	import { fitWidth } from '#lib/fit.js';
	import type { Elevation, Numbered, Place, Segment, Trail } from '#lib/types.js';
	import trailData from '#lib/data/trail.json';
	import segmentsData from '#lib/data/segments.json';
	import placesData from '#lib/data/places.json';
	import elevationData from '#lib/data/elevation.json';

	const trail = trailData as Trail;
	const segments = segmentsData as Segment[];
	const places = (placesData as Place[]).slice().sort((a, b) => a.mile - b.mile);
	const elevation = elevationData as Elevation;

	let active = $state<StepState | null>(null);

	/** One running number per stop, southeast to northwest, across the whole trail. */
	const numbered: Numbered[] = $derived(
		places.filter((p) => filters.show(p)).map((place, i) => ({ place, n: i + 1 }))
	);
	const bySegment = $derived(
		segments.map((s, i) =>
			numbered.filter(
				({ place: p }) =>
					p.mile >= s.from && (p.mile < s.to || (i === segments.length - 1 && p.mile <= s.to))
			)
		)
	);
	const allNumbered: Numbered[] = places.map((place, i) => ({ place, n: i + 1 }));
	const stats = [
		[SITE.trailMiles, 'miles'],
		[places.length, 'stops'],
		[new Set(places.map((p) => p.town)).size, 'towns'],
		[places.filter((p) => p.category === 'brewery').length, 'breweries']
	] as const;
	const title = `${SITE.name}: food, drink and water along the W&OD Trail`;
	const hiPoint = elevation.samples.reduce((b, s) => (s[1] > b[1] ? s : b));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={SITE.description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={SITE.description} />
	<link rel="canonical" href="https://rexarski.github.io/wodpitstops/" />
</svelte:head>

<header class="hero">
	<h1 class="masthead" aria-label={SITE.name}>
		<span class="line" use:fitWidth aria-hidden="true">W&amp;OD</span>
		<span class="line" use:fitWidth aria-hidden="true">Pit stops</span>
	</h1>
	<div class="wrap">
		<p class="caption">where to eat, drink and refill water on the W&amp;OD Trail</p>
		<p class="caption small">
			a crowd-sourced guide by the people who ride and run it · inspired by
			<a href="https://wodfriends.org" target="_blank" rel="noopener">Friends of the W&amp;OD Trail</a>
		</p>
		<dl class="stats">
			{#each stats as [value, label] (label)}
				<div>
					<dt class="num">{value}</dt>
					<dd>{label}</dd>
				</div>
			{/each}
		</dl>
		<p class="lede">scroll down to travel northwest.</p>
		<p class="caption ask">
			know a stop that is missing or wrong? <a href="#contribute">tell us</a>. every entry here came from a rider or
			runner.
		</p>
	</div>
</header>

<section class="section foreword" id="foreword">
	<div class="wrap">
		<h2>Foreword</h2>
		<p class="caption">why this exists</p>
		<blockquote>
			<p>
				“The Washington &amp; Old Dominion Trail (W&amp;OD) is a 45-mile trail that stretches from Arlington
				County, all the way through Fairfax County, and into Loudoun County, ending in the town of
				Purcellville. It is often called the ‘skinniest park in Virginia,’ since this former historic
				railroad bed is now maintained by the regional park organization, NOVA Parks. The trail winds
				through small towns, past restaurants and numerous breweries, by parks and other attractions, and
				includes historical markers that tell the story of the former railroad’s past.”
			</p>
			<footer>
				Ali Morris, <a href="https://www.fxva.com/blog/post/best-stops-along-the-wod-trail/" target="_blank" rel="noopener"
					>“Best Stops Along the Washington &amp; Old Dominion Trail”</a
				>, Visit Fairfax, April 12, 2024
			</footer>
		</blockquote>
		<p class="prose">
			That article is the seed of this list. The rest is curated from Washingtonian’s brewery coverage,
			rider threads on r/bikedc and r/nova from the last three years, and reader submissions, then laid out
			by mile marker so a runner or rider can see what is coming. Every stop links to its website and to
			Google Maps, and the whole list is downloadable as a spreadsheet below.
		</p>
	</div>
</section>

<div class="story">
	<div class="map-wrap">
		<TrailMap {trail} {segments} placesBySegment={bySegment} {elevation} {active} />
	</div>
	<div class="steps" use:scrolly={{ onchange: (s) => (active = s) }}>
		<div class="filterbar">
			<CategoryFilter />
		</div>
		{#each segments as seg, i (seg.id)}
			<Chapter segment={seg} entries={bySegment[i]} active={active?.index === i} />
		{/each}
	</div>
</div>

<section class="section" id="all-stops">
	<div class="wrap-wide">
		<h2>All stops</h2>
		<p class="caption">
			every stop by mile marker · <a href={SITE.csv} download>download as csv</a> (with addresses,
			coordinates, chapter, notes and sources) · none verified in person yet, so
			<a href={SITE.correct} target="_blank" rel="noopener">corrections</a> are the most useful thing you can send
		</p>
		<div class="table">
			<StopsTable entries={allNumbered} />
		</div>
	</div>
</section>

<section class="section" id="contribute">
	<div class="wrap">
		<h2>This list is yours to fix</h2>
		<p class="caption">crowd-sourced, so it is only as good as what you send in</p>
		<p class="prose">
			The stops here started from one Visit Fairfax article and two r/bikedc threads. None of them has been checked
			in person yet. If you ride or run the W&amp;OD, you know things this page does not: the fountain that is off,
			the patio that got bike racks, the taproom that closed, the bakery two blocks off the trail that everyone
			stops at. Please send them.
		</p>
		<ul class="ways">
			<li>
				<a href={SITE.suggest} target="_blank" rel="noopener">suggest a stop ↗</a> · name, nearest mile marker, why
				it is worth it. Partial is fine.
			</li>
			<li>
				<a href={SITE.correct} target="_blank" rel="noopener">report a correction ↗</a> · closed, moved, wrong
				hours, wrong distance.
			</li>
			<li>
				<a href="mailto:{SITE.email}?subject=W%26OD%20pit%20stop">{SITE.email}</a> · if you would rather email.
				A photo helps.
			</li>
		</ul>
		<p class="prose">
			Every submission is read. Accepted ones go into the public data file with your source credited, and the
			site, table and CSV rebuild from it.
		</p>
	</div>
</section>

<footer class="section credits">
	<div class="wrap">
		<h2>Sources</h2>
		<ul>
			<li>
				<a href="https://www.fxva.com/blog/post/best-stops-along-the-wod-trail/" target="_blank" rel="noopener"
					>Ali Morris, “Best Stops Along the Washington &amp; Old Dominion Trail (W&amp;OD)”, Visit Fairfax, April 12, 2024</a
				>: the starting list, quoted above; its mile-marker structure is the backbone of the chapters. Entries from it are marked
				“fxva.com best stops” in the table.
			</li>
			<li>
				<a href="https://wodfriends.org" target="_blank" rel="noopener">Friends of the W&amp;OD Trail</a>:
				“Established in 1991, the Friends of the Washington and Old Dominion Trail — FoWOD for short — is a
				citizen-driven organization dedicated to protecting and improving the W&amp;OD Trail.” Their
				<a href="https://wodfriends.org/trail-map/" target="_blank" rel="noopener">trail maps page</a>
				publishes “an overview of trail amenities as of 11/2024” and links Dmitriy Tarasov’s 2013 map suite
				with mile-marker elevations. This site is independent of FoWOD and NOVA Parks.
			</li>
			<li>
				<a
					href="https://www.novaparks.com/parks/washington-and-old-dominion-railroad-regional-park"
					target="_blank"
					rel="noopener">NOVA Parks</a
				>: the trail “runs 45 miles from Shirlington to Purcellville”; hours are 5 a.m. to 9 p.m. daily.
			</li>
			<li>
				Curated additions come from Washingtonian’s brewery coverage and from r/bikedc and r/nova threads
				(2023–2026); each is named in the source column.
			</li>
			<li>
				Elevation: USGS 3D Elevation Program (3DEP) lidar bare-earth model, queried every 0.2 mile along the
				trail line through the National Map point service, in feet. Cross-checked against Copernicus GLO-90,
				which averages about 7 ft higher because it includes tree canopy. High point measures {hiPoint[1]} ft at
				mile {hiPoint[0]} (Clarks Gap); the low is {elevation.minFt} ft at Shirlington. Values are smoothed by the 0.2-mile
				spacing, so short dips at road crossings do not show.
			</li>
			<li>
				Trail line and base map © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>,
				ODbL; tiles by <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>; addresses and coordinates via
				<a href="https://nominatim.org" target="_blank" rel="noopener">Nominatim</a>. Mile positions are measured along the line and may
				differ slightly from the posted markers.
			</li>
			<li>
				Layout and type after <a href="https://nodaysoff.run" target="_blank" rel="noopener">nodaysoff.run</a>. Typeface: Jost. Icons:
				<a href="https://lucide.dev" target="_blank" rel="noopener">Lucide</a>. Source code:
				<a href={SITE.repo} target="_blank" rel="noopener">{SITE.repo.replace('https://', '')}</a>
			</li>
		</ul>
	</div>
</footer>

<SuggestLink />

<style>
	.hero {
		padding: 4.5rem 0 3.5rem;
		text-align: center;
	}
	/* Masthead: two lines, each sized by fitWidth to span the page like a magazine cover. */
	.masthead {
		width: calc(100% - 2rem);
		margin: 0 auto 1.4rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: -0.02em;
		line-height: 0.86;
		text-align: left;
	}
	.masthead .line {
		display: block;
		white-space: nowrap;
		font-size: clamp(3rem, 22vw, 24rem);
	}
	.masthead .line + .line {
		font-size: clamp(1.4rem, 10.5vw, 11rem);
	}
	.caption.small {
		font-size: 12px;
		color: var(--ink-3);
	}
	.stats {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 1.2rem 2.6rem;
		margin: 2.2rem 0 2.4rem;
	}
	.stats div {
		min-width: 4.5rem;
	}
	.stats dt {
		font-size: 1.6rem;
		line-height: 1;
	}
	.stats dd {
		margin: 0.25rem 0 0;
		color: var(--ink-2);
	}
	.lede {
		margin: 0;
		color: var(--ink-2);
	}

	.foreword blockquote {
		margin: 1.8rem 0 1.2rem;
		padding: 0 0 0 1rem;
		border-left: 2px solid var(--ink);
	}
	.foreword blockquote p {
		margin-bottom: 0.6rem;
	}
	.foreword blockquote footer {
		color: var(--ink-3);
		font-size: 12px;
	}

	.story {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
		align-items: start;
		border-top: 1px solid var(--line);
	}
	.map-wrap {
		position: sticky;
		top: 0;
		height: 100dvh;
	}
	.steps {
		min-width: 0;
		padding: 0 clamp(1rem, 4vw, 3.5rem);
		/* Keep the map pinned until the last chapter's end has crossed the 45 % focus line
		   (scrolly.ts), so the position dot reaches mile 45 before the page scrolls on. */
		padding-bottom: 55dvh;
	}
	.filterbar {
		position: sticky;
		top: 0;
		z-index: 3;
		background: var(--bg);
	}

	@media (max-width: 860px) {
		.story {
			display: flex;
			flex-direction: column;
			align-items: stretch;
		}
		.map-wrap {
			height: 46dvh;
			width: 100%;
			min-width: 0;
			z-index: 2;
		}
		.steps {
			width: 100%;
			/* Band is 46dvh tall and the focus line sits at 45 %: only a sliver is needed. */
			padding: 0 1rem 3dvh;
		}
		.filterbar {
			top: 46dvh;
		}
		.hero {
			padding: 3rem 0 2.5rem;
		}
	}

	.section {
		padding: 4rem 0;
		border-top: 1px solid var(--line);
	}
	.table {
		margin-top: 1.8rem;
	}
	.prose {
		margin-top: 1.5rem;
		color: var(--ink-2);
	}
	.ask {
		margin-top: 1.4rem;
		max-width: 28rem;
		margin-inline: auto;
	}
	.ways {
		list-style: none;
		padding: 0;
		margin: 1.4rem 0 1.5rem;
		display: grid;
		gap: 0.6rem;
		color: var(--ink-2);
	}
	.credits {
		padding-bottom: 5rem;
		color: var(--ink-2);
		font-size: 13px;
	}
	.credits ul {
		margin: 1.5rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.7rem;
	}
</style>
