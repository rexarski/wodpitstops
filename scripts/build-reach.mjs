// Writes src/lib/data/reach.json: a polygon covering everything within about five
// minutes of easy riding (one mile) of the trail, drawn on the map as a flat grey
// fill. Rerun after fetch-trail.mjs.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import buffer from '@turf/buffer';
import simplify from '@turf/simplify';

const TRAIL = fileURLToPath(new URL('../src/lib/data/trail.json', import.meta.url));
const OUT = fileURLToPath(new URL('../src/lib/data/reach.json', import.meta.url));
const MILES = 1;

const trail = JSON.parse(fs.readFileSync(TRAIL, 'utf8'));
const line = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: trail.points.map((p) => [p[0], p[1]]) } };
const poly = buffer(line, MILES, { units: 'miles', steps: 16 });
const slim = simplify(poly, { tolerance: 0.0003, highQuality: true });
const round = (c) => c.map((ring) => ring.map(([x, y]) => [Math.round(x * 1e5) / 1e5, Math.round(y * 1e5) / 1e5]));
const geometry =
	slim.geometry.type === 'Polygon'
		? { type: 'Polygon', coordinates: round(slim.geometry.coordinates) }
		: { type: 'MultiPolygon', coordinates: slim.geometry.coordinates.map(round) };
fs.writeFileSync(
	OUT,
	JSON.stringify({
		attribution: 'Derived from trail.json (© OpenStreetMap contributors, ODbL)',
		radiusMiles: MILES,
		note: 'About five minutes of easy riding either side of the trail.',
		type: 'Feature',
		properties: {},
		geometry
	})
);
const n = geometry.type === 'Polygon' ? geometry.coordinates.flat().length : geometry.coordinates.flat(2).length;
console.log(`${geometry.type}, ${n} vertices -> ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
