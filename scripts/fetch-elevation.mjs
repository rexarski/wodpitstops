// Builds src/lib/data/elevation.json: elevation samples along the trail line.
//   node scripts/fetch-elevation.mjs
// Reads src/lib/data/trail.json, samples a point every STEP miles, and asks the
// USGS 3D Elevation Program (3DEP) point service for bare-earth elevation at each
// one. 3DEP is a lidar-derived ground model (1 m in Northern Virginia), so unlike
// satellite DEMs it does not count tree canopy or buildings. Falls back to
// Open-Meteo (Copernicus GLO-90, a surface model) only if USGS fails for a point.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const TRAIL = fileURLToPath(new URL('../src/lib/data/trail.json', import.meta.url));
const OUT = fileURLToPath(new URL('../src/lib/data/elevation.json', import.meta.url));
const STEP = 0.2; // miles between samples
const trail = JSON.parse(fs.readFileSync(TRAIL, 'utf8'));
const pts = trail.points;
const end = pts[pts.length - 1][2];

function pointAtMile(m) {
	let i = 1;
	while (i < pts.length - 1 && pts[i][2] < m) i++;
	const a = pts[i - 1];
	const b = pts[i];
	const t = (m - a[2]) / (b[2] - a[2] || 1);
	return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

const miles = [];
for (let m = 0; m < end; m += STEP) miles.push(+m.toFixed(2));
miles.push(+end.toFixed(2));
const coords = miles.map(pointAtMile);

async function usgs([lon, lat]) {
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const r = await fetch(
				`https://epqs.nationalmap.gov/v1/json?x=${lon.toFixed(6)}&y=${lat.toFixed(6)}&units=Feet&wkid=4326&includeDate=false`,
				{ headers: { 'User-Agent': 'wodpitstops/0.1 (elevation build script)' } }
			);
			if (!r.ok) throw new Error('HTTP ' + r.status);
			const j = await r.json();
			const v = Number(j.value);
			if (Number.isFinite(v) && v > -1000) return Math.round(v);
			throw new Error('no value');
		} catch (e) {
			await new Promise((res) => setTimeout(res, 800 * (attempt + 1)));
		}
	}
	return null;
}

async function openMeteo(batch) {
	const url =
		'https://api.open-meteo.com/v1/elevation?latitude=' +
		batch.map((c) => c[1].toFixed(5)).join(',') +
		'&longitude=' +
		batch.map((c) => c[0].toFixed(5)).join(',');
	const j = await (await fetch(url)).json();
	return j.elevation.map((m) => Math.round(m * 3.28084));
}

// USGS: a few requests at a time, politely.
const usgsFt = new Array(coords.length).fill(null);
let next = 0;
async function worker() {
	while (next < coords.length) {
		const i = next++;
		usgsFt[i] = await usgs(coords[i]);
		if (i % 20 === 0) process.stdout.write(`\r${i}/${coords.length}`);
	}
}
await Promise.all(Array.from({ length: 4 }, worker));
process.stdout.write('\n');

// Open-Meteo for comparison and as a fallback.
const meteoFt = [];
for (let i = 0; i < coords.length; i += 100) meteoFt.push(...(await openMeteo(coords.slice(i, i + 100))));

let fallbacks = 0;
const samples = miles.map((m, i) => {
	let ft = usgsFt[i];
	if (ft == null) {
		ft = meteoFt[i];
		fallbacks++;
	}
	return [m, ft];
});
const diffs = usgsFt.map((v, i) => (v == null ? null : v - meteoFt[i])).filter((d) => d != null);
const meanDiff = diffs.reduce((s, d) => s + d, 0) / diffs.length;
const maxDiff = Math.max(...diffs.map(Math.abs));
const out = {
	attribution:
		'Elevation: USGS 3D Elevation Program (3DEP) bare-earth DEM via the National Map Elevation Point Query Service, sampled every 0.2 mi along the OpenStreetMap trail line. Public domain.',
	method: `Points every ${STEP} mi along the trail line; USGS 3DEP point query (feet, NAVD88). ${fallbacks} of ${samples.length} points fell back to Open-Meteo (Copernicus GLO-90).`,
	fetched: new Date().toISOString().slice(0, 10),
	format: 'samples: [mile, feet]',
	minFt: Math.min(...samples.map((s) => s[1])),
	maxFt: Math.max(...samples.map((s) => s[1])),
	samples
};
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(
	`${samples.length} samples, ${out.minFt}–${out.maxFt} ft, ${fallbacks} fallbacks; USGS vs Copernicus: mean ${meanDiff.toFixed(1)} ft, max |diff| ${maxDiff} ft -> ${OUT}`
);
const hi = samples.reduce((b, s) => (s[1] > b[1] ? s : b));
console.log('high point at mile', hi[0], hi[1], 'ft; checks:', [0, 6, 11.6, 20, 34, 37.8, 41, 44].map((m) => `${m}→${samples.find((s) => s[0] >= m)?.[1]}`).join(' '));
