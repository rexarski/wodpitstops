// Rebuilds src/lib/data/trail.json from OpenStreetMap.
//   node scripts/fetch-trail.mjs
// Pulls every highway way whose name matches the W&OD trail inside a Northern
// Virginia bounding box, finds the shortest path from Shirlington (SE) to
// Purcellville (NW) through those ways (bridging small unnamed gaps), then
// simplifies the line and tags each vertex with cumulative miles from Shirlington.
// Output geometry is © OpenStreetMap contributors, ODbL.
import fs from 'node:fs';

const OUT = new URL('../src/lib/data/trail.json', import.meta.url);
const SHIRL = [-77.0895, 38.8395]; // mile 0, Shirlington
const PURC = [-77.715, 39.137]; // mile ~45, Purcellville
const QUERY = `[out:json][timeout:120][bbox:38.80,-77.80,39.20,-77.05];
way["name"~"(Washington (&|&amp;|and) Old Dominion|W ?& ?O ?D|W&amp;OD)",i]["highway"];
out geom;`;
const ENDPOINTS = [
	'https://overpass-api.de/api/interpreter',
	'https://overpass.kumi.systems/api/interpreter',
	'https://overpass.osm.ch/api/interpreter'
];

const R = 3958.8;
const rad = (x) => (x * Math.PI) / 180;
const hav = (a, b) => {
	const dLat = rad(b[1] - a[1]);
	const dLon = rad(b[0] - a[0]);
	const s =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(s));
};
const len = (pts) => pts.reduce((s, p, i) => (i ? s + hav(pts[i - 1], p) : 0), 0);

async function fetchWays() {
	for (const ep of [...ENDPOINTS, ...ENDPOINTS]) {
		try {
			const r = await fetch(ep, {
				method: 'POST',
				body: 'data=' + encodeURIComponent(QUERY),
				headers: { 'User-Agent': 'wodpitstops/0.1 (trail geometry build script)' }
			});
			const t = await r.text();
			if (!t.trim().startsWith('{')) {
				console.warn(ep, 'non-JSON response', r.status);
				continue;
			}
			const j = JSON.parse(t);
			if (!j.elements?.length) {
				console.warn(ep, "returned no ways");
				continue;
			}
			return j.elements
				.filter((e) => e.type === 'way' && e.geometry?.length > 1)
				.map((w) => ({ id: w.id, name: w.tags.name, pts: w.geometry.map((p) => [p.lon, p.lat]) }));
		} catch (e) {
			console.warn(ep, 'failed:', e.message);
		}
	}
	throw new Error('All Overpass endpoints failed');
}

function shortestPath(ways) {
	const key = (p) => p.map((x) => x.toFixed(4)).join(',');
	const adj = new Map();
	const add = (a, b, e) => {
		if (!adj.has(a)) adj.set(a, []);
		adj.get(a).push({ to: b, ...e });
	};
	for (const w of ways) {
		const a = key(w.pts[0]);
		const b = key(w.pts.at(-1));
		add(a, b, { w, rev: false });
		add(b, a, { w, rev: true });
	}
	const nodes = [...adj.keys()].map((k) => ({ k, p: k.split(',').map(Number) }));
	// Bridge gaps (unnamed/unmapped segments) with straight lines, at a cost penalty.
	for (const a of nodes)
		for (const b of nodes) {
			if (a.k === b.k) continue;
			const d = hav(a.p, b.p);
			if (d < 1.5 && !adj.get(a.k).some((e) => e.to === b.k)) add(a.k, b.k, { gap: d });
		}
	const nearest = (t) => nodes.reduce((best, n) => (hav(n.p, t) < hav(best.p, t) ? n : best));
	const s = nearest(SHIRL);
	const e = nearest(PURC);
	const dist = new Map([[s.k, 0]]);
	const prev = new Map();
	const q = new Set([s.k]);
	while (q.size) {
		let u = null;
		for (const k of q) if (u === null || dist.get(k) < dist.get(u)) u = k;
		q.delete(u);
		if (u === e.k) break;
		for (const edge of adj.get(u) ?? []) {
			const c = dist.get(u) + (edge.w ? len(edge.w.pts) : edge.gap * 4 + 0.1);
			if (c < (dist.get(edge.to) ?? Infinity)) {
				dist.set(edge.to, c);
				prev.set(edge.to, { from: u, edge });
				q.add(edge.to);
			}
		}
	}
	if (!prev.has(e.k)) throw new Error('No path from Shirlington to Purcellville');
	const chain = [];
	for (let cur = e.k; prev.has(cur); cur = prev.get(cur).from) chain.unshift(prev.get(cur).edge);
	const line = [];
	let gaps = 0;
	for (const edge of chain) {
		if (!edge.w) {
			gaps++;
			continue;
		}
		const pts = edge.rev ? [...edge.w.pts].reverse() : edge.w.pts;
		line.push(...(line.length ? pts.slice(1) : pts));
	}
	return { line, waysUsed: chain.filter((c) => c.w).length, gaps };
}

function simplify(pts, tol) {
	if (pts.length < 3) return pts;
	const [a, b] = [pts[0], pts.at(-1)];
	let md = 0;
	let mi = 0;
	for (let i = 1; i < pts.length - 1; i++) {
		const p = pts[i];
		const d =
			Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) /
			Math.hypot(b[0] - a[0], b[1] - a[1]);
		if (d > md) {
			md = d;
			mi = i;
		}
	}
	if (md > tol)
		return [...simplify(pts.slice(0, mi + 1), tol).slice(0, -1), ...simplify(pts.slice(mi), tol)];
	return [a, b];
}

const ways = await fetchWays();
console.log(`fetched ${ways.length} ways (${[...new Set(ways.map((w) => w.name))].join(' | ')})`);
const { line, waysUsed, gaps } = shortestPath(ways);
const simp = simplify(line, 0.0001);
let cum = 0;
const points = simp.map((p, i) => {
	if (i) cum += hav(simp[i - 1], p);
	return [+p[0].toFixed(5), +p[1].toFixed(5), +cum.toFixed(2)];
});
const out = {
	attribution:
		'Trail geometry © OpenStreetMap contributors, ODbL (openstreetmap.org/copyright). Built by scripts/fetch-trail.mjs.',
	fetched: new Date().toISOString().slice(0, 10),
	format: 'points: [lon, lat, cumulativeMiles], ordered southeast (Shirlington, mile 0) to northwest (Purcellville)',
	lengthMiles: +cum.toFixed(2),
	points
};
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(
	`path: ${waysUsed} ways, ${gaps} gaps bridged, ${line.length} -> ${points.length} points, ${cum.toFixed(2)} mi -> ${OUT.pathname}`
);
