// Fills address / lat / lon for places that lack them, using OpenStreetMap's
// Nominatim (free, 1 request/second, attribution required).
//   node scripts/geocode.mjs            # only places missing coordinates
//   node scripts/geocode.mjs --force    # re-geocode everything
// Prints every miss so it can be fixed by hand in places.json. Landmarks on the
// trail itself (bridges, gaps, depots) are expected to miss; they sit at `mile`.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../src/lib/data/places.json', import.meta.url));
const force = process.argv.includes('--force');
const places = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const UA = { 'User-Agent': 'wodpitstops/0.1 geocoder (github.com/rexarski/wodpitstops)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(q) {
	const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=us&q=${encodeURIComponent(q)}`;
	const r = await fetch(url, { headers: UA });
	if (!r.ok) throw new Error('HTTP ' + r.status);
	return (await r.json())[0];
}
function formatAddress(a) {
	const line1 = [a.house_number, a.road].filter(Boolean).join(' ');
	const city = a.town || a.city || a.village || a.hamlet || a.suburb || a.county;
	return [line1, city, [a.state === 'Virginia' ? 'VA' : a.state, a.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}
// Reject hits that are not in Northern Virginia or are far from the trail corridor.
const inCorridor = (lat, lon) => lat > 38.75 && lat < 39.25 && lon > -77.85 && lon < -77.0;

let hits = 0;
const misses = [];
for (const p of places) {
	if (p.noGeocode) continue; // trail features (bridges, gaps, junctions) sit at their mile
	if (!force && p.lat != null && p.lon != null && p.address) continue;
	const queries = [p.query, `${p.name}, ${p.town}, Virginia`, `${p.name}, Virginia`].filter(Boolean);
	let found = null;
	for (const q of queries) {
		try {
			const hit = await search(q);
			await sleep(1100);
			if (hit && inCorridor(+hit.lat, +hit.lon)) {
				found = hit;
				break;
			}
		} catch (e) {
			console.warn('  ', p.id, e.message);
			await sleep(2000);
		}
	}
	if (!found) {
		misses.push(p.id);
		continue;
	}
	p.lat = +(+found.lat).toFixed(5);
	p.lon = +(+found.lon).toFixed(5);
	p.address = formatAddress(found.address ?? {});
	p.geocoded = 'nominatim';
	hits++;
	console.log('ok  ', p.id, '→', p.address, `(${found.type})`);
}
fs.writeFileSync(FILE, JSON.stringify(places, null, '\t') + '\n');
console.log(`\n${hits} geocoded, ${misses.length} misses:`, misses.join(', '));
