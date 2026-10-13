import type { Trail } from './types.js';

/**
 * Simple equirectangular projection of the trail into an SVG coordinate space.
 * x grows west→east, y grows north→south, so the SE start is bottom-right and
 * the NW finish is top-left, matching how the trail reads on a real map.
 */
export const VIEW_W = 1000;

export function makeProjection(trail: Trail, pad = 95) {
	const lons = trail.points.map((p) => p[0]);
	const lats = trail.points.map((p) => p[1]);
	const minLon = Math.min(...lons);
	const maxLon = Math.max(...lons);
	const minLat = Math.min(...lats);
	const maxLat = Math.max(...lats);
	const midLat = (minLat + maxLat) / 2;
	const kx = Math.cos((midLat * Math.PI) / 180);
	const w = (maxLon - minLon) * kx;
	const h = maxLat - minLat;
	const scale = (VIEW_W - 2 * pad) / w;
	const VIEW_H = Math.round(h * scale + 2 * pad);
	const project = ([lon, lat]: [number, number]): [number, number] => [
		pad + (lon - minLon) * kx * scale,
		pad + (maxLat - lat) * scale
	];
	return { project, VIEW_H, scale, kx };
}

export type Projection = ReturnType<typeof makeProjection>;

/** Interpolated [lon, lat] at a given cumulative mile along the trail. */
export function pointAtMile(trail: Trail, mile: number): [number, number] {
	const pts = trail.points;
	const m = Math.max(0, Math.min(mile, pts[pts.length - 1][2]));
	let i = 1;
	while (i < pts.length - 1 && pts[i][2] < m) i++;
	const a = pts[i - 1];
	const b = pts[i];
	const span = b[2] - a[2] || 1;
	const t = (m - a[2]) / span;
	return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Trail vertices between two miles, including interpolated endpoints. */
export function sliceByMiles(trail: Trail, from: number, to: number): [number, number][] {
	const out: [number, number][] = [pointAtMile(trail, from)];
	for (const p of trail.points) if (p[2] > from && p[2] < to) out.push([p[0], p[1]]);
	out.push(pointAtMile(trail, to));
	return out;
}

export function toPath(pts: [number, number][], project: Projection['project']): string {
	return pts
		.map((p, i) => {
			const [x, y] = project(p);
			return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
		})
		.join(' ');
}

export interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}

export function bbox(pts: [number, number][], project: Projection['project'], pad = 40, minW = 260): Box {
	const xs: number[] = [];
	const ys: number[] = [];
	for (const p of pts) {
		const [x, y] = project(p);
		xs.push(x);
		ys.push(y);
	}
	let x0 = Math.min(...xs) - pad;
	let x1 = Math.max(...xs) + pad;
	let y0 = Math.min(...ys) - pad;
	let y1 = Math.max(...ys) + pad;
	if (x1 - x0 < minW) {
		const c = (x0 + x1) / 2;
		x0 = c - minW / 2;
		x1 = c + minW / 2;
	}
	const minH = minW * 0.6;
	if (y1 - y0 < minH) {
		const c = (y0 + y1) / 2;
		y0 = c - minH / 2;
		y1 = c + minH / 2;
	}
	return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
