// Sanity checks for places.json: duplicate ids, unknown categories, and geocoded
// coordinates that sit far from the trail point for their mile (a sign Nominatim
// matched the wrong place). Run after scripts/geocode.mjs.
//   node scripts/check-places.mjs          # report
//   node scripts/check-places.mjs --fix    # drop coordinates/address of outliers
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../src/lib/data/places.json', import.meta.url));
const trail = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../src/lib/data/trail.json', import.meta.url)), 'utf8'));
const places = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const fix = process.argv.includes('--fix');
// Secondary kinds (`also`) must come from the same list.
const CATS = ['brewery', 'bar', 'restaurant', 'coffee', 'water-restroom', 'bike-shop', 'park', 'trailhead', 'landmark'];
const MAX_MILES_OFF = 2.5; // Lost Rhino is a real 2-mile detour; wrong geocodes are usually 10+ miles out

const pts = trail.points;
const R = 3958.8, rad = (x) => (x * Math.PI) / 180;
const hav = (a, b) => {
	const dLat = rad(b[1] - a[1]), dLon = rad(b[0] - a[0]);
	const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(s));
};
// distance from a point to the nearest trail vertex (good enough at 0.2 mi spacing)
const toTrail = (p) => Math.min(...pts.map((t) => hav(p, [t[0], t[1]])));
function pointAtMile(m) {
	let i = 1;
	while (i < pts.length - 1 && pts[i][2] < m) i++;
	const a = pts[i - 1], b = pts[i], t = (m - a[2]) / (b[2] - a[2] || 1);
	return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

let problems = 0;
const ids = new Set();
for (const p of places) {
	if (ids.has(p.id)) { console.log('DUP id', p.id); problems++; }
	ids.add(p.id);
	if (!CATS.includes(p.category)) { console.log('BAD category', p.id, p.category); problems++; }
	for (const c of p.also ?? []) if (!CATS.includes(c)) { console.log('BAD also', p.id, c); problems++; }
	if (p.lat != null && p.lon != null) {
		const d = hav([p.lon, p.lat], pointAtMile(p.mile));
		const dt = toTrail([p.lon, p.lat]);
		if (d > MAX_MILES_OFF || dt > MAX_MILES_OFF) {
			problems++;
			console.log(`OUTLIER ${p.id}: ${d.toFixed(2)} mi from mile ${p.mile}, ${dt.toFixed(2)} mi from trail (${p.address ?? ''})`);
			if (fix) { delete p.lat; delete p.lon; delete p.address; delete p.geocoded; console.log('  -> coordinates removed; will sit on the trail at its mile'); }
		}
	}
}
if (fix) fs.writeFileSync(FILE, JSON.stringify(places, null, '\t') + '\n');
console.log(`${places.length} places, ${places.filter((p) => p.lat != null).length} with coordinates, ${problems} problem(s)`);
