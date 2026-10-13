# wodpitstops (W&OD Pit Stops)

Crowd-sourced scrollytelling guide to food, drink, water and other pit stops along the Washington & Old Dominion (W&OD) Trail in Northern Virginia, presented as a companion site inspired by Friends of the W&OD Trail (independent, not affiliated). Scrolling down moves the reader southeast → northwest (Shirlington, mile 0 → Purcellville, mile ~45).

Positioning: the list is curated by the people who ride and run the trail, and asking for submissions and corrections is the site's main call to action. The ask appears in the hero, at the end of every chapter (prefilled issue link), under the table, and in the contribute section. Keep that emphasis when editing copy. Licenses: code MIT, stop data CC BY 4.0, trail/reach data ODbL (see README).

## Stack

- SvelteKit 3 + Svelte 5 (runes), TypeScript, Vite 8. No UI framework; plain CSS with custom properties in `src/app.css` (light/dark via `prefers-color-scheme`). Single webfont: Source Serif 4.
- Map: `maplibre-gl` with the OpenFreeMap Positron style (OpenStreetMap data, no API key). The worker is bundled by Vite via `maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url` and passed to `setWorkerUrl`; without that MapLibre 6 fails with “Worker failed to load”. If WebGL2 is unavailable the component shows a one-line note and the rest of the page keeps working.
- Elevation: USGS 3DEP bare-earth lidar DEM via the National Map point query service, sampled every 0.2 mi along the trail line by `scripts/fetch-elevation.mjs` (Open-Meteo/Copernicus only as a per-point fallback and for the comparison printed by the script). High point 615 ft at mile 37.8 (Clarks Gap).
- Icons: `@lucide/svelte`, one per category in `CategoryIcon.svelte`. Favicon: side profile of a front wheel, fork and drop bar (`static/favicon.svg`).
- `@sveltejs/adapter-static`, everything prerendered (`src/routes/+layout.ts`). Output in `build/`.
- Deploys to GitHub Pages via `.github/workflows/deploy.yml`. `BASE_PATH` env sets `paths.base` (set to `/<repo>` for a project site, empty for a custom domain).
- Package imports use the `#lib/*` alias (see `package.json` `imports`), not `$lib`.

## Commands

```
npm run dev        # local dev server
npm run build      # static build to build/
npm run preview
npm run check      # svelte-check (type-check .svelte + .ts)
node scripts/fetch-trail.mjs   # rebuild trail geometry from OpenStreetMap (Overpass is flaky; retries built in)
node scripts/fetch-elevation.mjs # rebuild elevation samples from USGS 3DEP (run after fetch-trail)
node scripts/build-reach.mjs   # rebuild the one-mile reach band polygon from trail.json (run after fetch-trail)
node scripts/geocode.mjs       # fill address/lat/lon via Nominatim for places missing them (add a `query` hint for misses)
node scripts/check-places.mjs  # duplicate ids, bad categories, geocodes far from the trail (--fix drops them)
node scripts/build-csv.mjs     # write static/wod-pit-stops.csv (also the first step of `npm run build`; not a prebuild hook, since ignore-scripts=true in a global .npmrc would skip it)
npm run data                   # all five, in order
node scripts/screenshot.mjs out/ # after `npm run build`: headless screenshots at desktop + phone widths, prints active chapter, visible marker count, overflow (SwiftShader flags give headless Chrome WebGL2)
```

## Layout of the code

- `src/routes/+page.svelte` – the single page: hero → sticky map + chapters → contribute → credits.
- `src/lib/components/TrailMap.svelte` – MapLibre map + `ElevationProfile`. Reach band (fill from `reach.json`, legend bottom-left), `TrailInset` overview top-right, trail, active-segment band, progress line and 5-mile ticks are GeoJSON layers; the position dot and numbered place markers are `Marker`s (HTML, styled via `:global(.poi)` / `.runner`; markers fade in). Camera `fitBounds` to the active chapter with a 1.6 s ease-in-out (0 under `prefers-reduced-motion`), refits on container resize. Marker and camera effects key on `activeIndex`, not `active`: the scrolly action emits a new object every tick, and rebuilding markers per tick made them vanish mid-scroll. Two-finger / ctrl+wheel gestures only, so page scrolling wins on phones.
- `src/lib/components/StopsTable.svelte` – the “All stops” reference table (#, mile, name, kind, town, address, website/map links, source). The CSV (`static/wod-pit-stops.csv`, built by `scripts/build-csv.mjs`) carries more columns: chapter, county, coordinates + their source, notes, tags, verified flag.
- `src/lib/components/TrailInset.svelte` – corner overview: whole trail in grey, active chapter in black, position dot. Uses the SVG projection helpers in `geo.ts`.
- `src/lib/components/CategoryIcon.svelte` – Lucide icon per category.
- `src/lib/components/SuggestFab.svelte` – fixed tab on the right edge (square icon button bottom-right on phones) that opens a panel with the suggest / correct / email links. Closes on Escape or outside click.
- `src/lib/links.ts` – `mapsUrl(place)` (Google Maps search by coordinates or name+town) and `hostname(url)`.
- `src/lib/components/ElevationProfile.svelte` – SVG strip under the map: profile, active-segment band, cursor at the current mile, and the mile/feet readout.
- `src/lib/components/Chapter.svelte` – one scrolly step (`data-step`) per segment; renders numbered `PlaceCard`s.
- `src/lib/scrolly.ts` – action that reports the active step index + 0–1 progress through it (drives the mile counter).
- `src/lib/state.svelte.ts` – shared category filter state (rune class). Model: “All” at rest; clicking a kind narrows to that kind; further clicks add/remove; removing the last one returns to All.
- `src/lib/geo.ts` – `pointAtMile`, `sliceByMiles` (used by the map and scripts); the SVG projection helpers are kept but unused by the map.
- `src/lib/site.ts` – site name, description, repo URL, suggest/correct issue-form URLs, contact email (rexarski@gmail.com).
- `src/lib/fit.ts` – `fitWidth` action: scales a line of text to its parent's width (the two-line hero masthead). Re-measures on resize and once fonts load.

## Data (edit these to change content)

- `src/lib/data/places.json` – array of `Place` (see `src/lib/types.ts`). Required: `id` (kebab, unique), `name`, `category`, `mile`, `town`. Optional `also: Category[]` for places that are two things at once (Bike Lane is a brewery, bike shop and café); `kindsOf(place)` in `types.ts` returns primary + secondary, and the filter, cards, table and CSV (`also_categories`) all use it. Markers use `lat`/`lon` when present (filled by `scripts/geocode.mjs`, which also sets `address` and `geocoded`), otherwise the trail point at `mile`. `query` is an optional geocoder hint. Keep `source` honest: “fxva.com best stops” (Visit Fairfax 2024), “Washingtonian”, “r/bikedc <thread id>” (threads 1mmr9sa, Aug 2025, and i64koh, Aug 2020, are in), “local knowledge”, “reader submission”. Numbering on the page is one running sequence by mile across the whole trail.
- `src/lib/data/segments.json` – the chapters, ordered SE→NW with contiguous `[from, to)` mile ranges (`range` is the display string). The last segment is inclusive of `to`.
- `src/lib/data/trail.json` – generated. `[lon, lat, cumulativeMiles]` polyline. Do not hand-edit; rerun the script. Attribution: © OpenStreetMap contributors, ODbL.
- `src/lib/data/elevation.json` – generated `[mile, feet]` samples. Rerun `fetch-elevation` whenever `trail.json` changes.
- `src/lib/data/reach.json` – generated GeoJSON polygon, one mile either side of the trail (about five minutes of easy riding), built by `scripts/build-reach.mjs` with `@turf/buffer` + `@turf/simplify`. Rerun whenever `trail.json` changes.

Categories: `brewery | bar | restaurant | coffee | water-restroom | bike-shop | park | trailhead | landmark` (`CATEGORY_LABEL` in `types.ts` holds the display names; `CategoryIcon.svelte` the icons). There is deliberately no “pit stop” category: the whole site is pit stops. Beer gardens are `brewery` (label “Brewery”) with a `beer-garden` tag, since nearly all of them are brewery taprooms. Water fountains/restrooms are `water-restroom`; parking and access points are `trailhead`.

## Community submissions

- Issue forms: `.github/ISSUE_TEMPLATE/new-place.yml` and `correction.yml` (labels `place-submission`, `correction`). Reviewer copies the fields into `places.json` and opens a PR.
- Contribute section links `SITE.suggest`, `SITE.correct` and `SITE.email`; each chapter ends with a suggest link whose issue title is prefilled with the chapter name. The category dropdown in `new-place.yml` must stay in sync with `CATEGORIES`.
- Future idea: a GitHub Action that parses `place-submission` issues into a PR automatically.

## Performance notes

- Jost is self-hosted (latin subset only loads); no third-party font request. Preconnect to `tiles.openfreemap.org`.
- The stylesheet is inlined (`inlineStyleThreshold` in `vite.config.ts`), so first paint needs HTML + one JS entry.
- MapLibre (~250 KB gz + 500 KB worker) is imported lazily: when the map container is within 400px of the viewport or on `requestIdleCallback`, whichever first. Everything else renders before it arrives.
- Icons: `static/favicon.svg` is the source; PNGs were rendered from it (`icon-512.png`, `icon-192.png`, `apple-touch-icon.png`). Regenerate with headless Chrome + `sips` if the mark changes.

## Known limitations / next steps

- The map hides the position dot and markers until a chapter is active; the idle state shows the whole trail.
- `trail.json` bridges three stretches where OSM names the trail differently (around miles 8–10, 19–21 and 23.5–28.6). They render as straight lines, which is close to reality on a rail corridor. Improve by also matching ways by `route=bicycle` relation membership.
- Five places still lack coordinates (three are trail points; Dynasty Brewing and Transition Triathlon need addresses) and sit on the trail at `mile`, fanned out in a 3-wide block when several share a mile.
- Reddit research: reddit.com, old.reddit.com, the `.json` endpoints and the redlib mirrors all block or captcha scripted access, and search engines cannot index the domain. What works: the Pullpush archive, `https://api.pullpush.io/reddit/search/comment/?link_id=<id>&size=500` (plus `/submission/?ids=<id>`), given a thread id the user supplies. Cite the thread id in `source`.
- All seeded places are `verified: false`. Hours, closures and patio details need checking.
- Submissions are manual (issue → edit JSON → PR). An Action that converts `place-submission` issues into PRs is the obvious automation.
- Filter buttons scroll horizontally on phones; a popover would save vertical space.

## Design rules

Reference aesthetic: https://nodaysoff.run (Adrien Friggeri). Anti-slop reference: https://godobject.dev/blog/10-tells-of-slop/ and the `kill-ai-slop` skill (`node ~/.claude/skills/kill-ai-slop/scripts/scan.mjs src` before shipping UI changes).

- Monochrome: white page, near-black ink (`--ink`), greys for secondary text and hairlines, black fills for marks. No accent colour, no gradients, no glass/blur, no shadows. The basemap stays Positron (grey); in dark mode the canvas is CSS-inverted.
- Two type roles: Jost (self-hosted via `@fontsource-variable/jost`) for headings and big numbers; the system monospace for body, captions, tables, axes and buttons. No other fonts.
- Section pattern: centered uppercase Jost heading (`h2`) + lowercase mono `.caption` under it; body text left-aligned, grey (`--ink-2`), max ~42rem.
- The hero masthead is two lines (“W&OD” / “Pit stops”), each fitted to the page width like a magazine cover; the rest of the hero keeps the normal measure.
- Numbers as facts are fine when they are real (hero stat row: miles, stops, towns, breweries). No invented stats.
- No emoji, no badges/pills, no coloured category marks. Buttons are flat grey with a black active state.
- Copy is specific and lowercase in captions (“scroll down to travel northwest.”). Don’t explain the site’s architecture to visitors.
- `--radius` is 2px. Every visual choice should be explainable in a sentence; if it isn’t, remove it.

## Conventions

- Svelte 5 runes only (`$state`, `$derived`, `$props`); no legacy `export let` / stores.
- Mobile first: the map is a sticky 46dvh band above the chapters below 860px; a sticky left column on desktop. Test both (`scripts/screenshot.mjs`).
- The steps column carries bottom padding (55dvh desktop, 3dvh phone) so the map stays pinned until the last chapter's end crosses the 45 % focus line; without it the page scrolls on while the position dot is still short of the end.
- Headless screenshots: `scripts/screenshot.mjs` needs the SwiftShader flags for WebGL2, waits for the map and fonts before scrolling (the masthead resizes to the webfont), and clears port 4173 before and after. A leftover `vite preview` serves a stale build whose hashed JS is gone, so nothing hydrates and every shot reports no active chapter.
- Watch for max-content sizing: any `display:grid` wrapper around long text needs `grid-template-columns: minmax(0, 1fr)`, and the phone flex layout needs `align-items: stretch`, or the page overflows horizontally.
- Respect `prefers-reduced-motion` for any new animation.
- When quoting wodfriends.org or NOVA Parks text on the site, quote verbatim and link the page (see the credits footer). This site is independent of FoWOD and NOVA Parks; say so.
- Update this file when the structure or data model changes.

## Research notes (for context, not code)

- wodfriends.org is a WordPress site behind a SiteGround captcha; direct fetches often get a 202 challenge page. The content worth reusing: the FoWOD description, the trail-maps page (amenities overview image dated 11/2024, Tarasov 2013 map suite at `/maps/MainMap.html`, elevation tables by milepost and landmark as JPG/PDF). Their map is a static image; ours is an interactive, data-driven line keyed by mile marker.
- NOVA Parks: 45 miles Shirlington–Purcellville, hours 5 a.m.–9 p.m., 32-mile parallel gravel horse trail, “skinniest park in Virginia”.
- Mile-marker landmarks used for chapters came from Visit Fairfax’s “Best Stops Along the W&OD Trail” (mile 0 Shirlington, 3–4 Bluemont, 6 Falls Church, 8 Fairfax line, 11–12 Vienna, 14 Meadowlark, 15 CCT, 16.5 Sunset Hills, 18 Reston, 20 Herndon, 22 Loudoun line, 25 Old Ox, 27.5 Carolina Brothers, 34 Leesburg, 44–45 Purcellville).
