import type { Place } from './types.js';

/** Google Maps search link: exact coordinates when known, otherwise name + town. */
export function mapsUrl(p: Place): string {
	const q = p.lon != null && p.lat != null ? `${p.lat},${p.lon}` : `${p.name}, ${p.town}, VA`;
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** "oldoxbrewery.com" for display next to a link. */
export function hostname(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}
