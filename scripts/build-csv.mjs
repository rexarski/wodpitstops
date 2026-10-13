// Writes static/wod-pit-stops.csv from the data files: every stop with more
// fields than the page shows (address, coordinates, chapter, county, links).
//   node scripts/build-csv.mjs   (also runs before `npm run build`)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => JSON.parse(fs.readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8'));
const places = read('../src/lib/data/places.json');
const segments = read('../src/lib/data/segments.json');
const trail = read('../src/lib/data/trail.json');
const OUT = fileURLToPath(new URL('../static/wod-pit-stops.csv', import.meta.url));

const LABEL = {
	brewery: 'Brewery', bar: 'Bar', restaurant: 'Restaurant', coffee: 'Coffee & bakery',
	'water-restroom': 'Water & restrooms', 'bike-shop': 'Bike shop', park: 'Park', trailhead: 'Trailhead & parking', landmark: 'Landmark'
};
const pts = trail.points;
function pointAtMile(m) {
	let i = 1;
	while (i < pts.length - 1 && pts[i][2] < m) i++;
	const a = pts[i - 1], b = pts[i];
	const t = (m - a[2]) / (b[2] - a[2] || 1);
	return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
const segmentOf = (mile) =>
	segments.find((s, i) => mile >= s.from && (mile < s.to || (i === segments.length - 1 && mile <= s.to)));
const mapsUrl = (p) => {
	const q = p.lon != null && p.lat != null ? `${p.lat},${p.lon}` : `${p.name}, ${p.town}, VA`;
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};
const cell = (v) => {
	const s = v == null ? '' : String(v);
	return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const header = [
	'number', 'name', 'category', 'category_label', 'also_categories', 'mile', 'chapter', 'county', 'town', 'off_trail', 'address',
	'latitude', 'longitude', 'coordinate_source', 'website', 'google_maps_url', 'notes', 'tags', 'source', 'verified', 'id'
];
const rows = places
	.slice()
	.sort((a, b) => a.mile - b.mile)
	.map((p, i) => {
		const seg = segmentOf(p.mile);
		const hasCoords = p.lat != null && p.lon != null;
		const [lon, lat] = hasCoords ? [p.lon, p.lat] : pointAtMile(p.mile);
		return [
			i + 1, p.name, p.category, LABEL[p.category] ?? p.category, (p.also ?? []).join('; '), p.mile, seg?.title ?? '', seg?.county ?? '', p.town,
			p.offTrail ?? '', p.address ?? '', lat.toFixed(5), lon.toFixed(5),
			hasCoords ? (p.geocoded ?? 'manual') : 'trail point at mile marker (place itself not geocoded)',
			p.url ?? '', mapsUrl(p), p.notes ?? '', (p.tags ?? []).join('; '), p.source ?? '', p.verified ? 'yes' : 'no', p.id
		];
	});
const csv = '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
fs.writeFileSync(OUT, csv);
console.log(`${rows.length} rows, ${header.length} columns -> ${OUT}`);
