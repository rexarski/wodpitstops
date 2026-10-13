export type Category =
	| 'brewery'
	| 'bar'
	| 'restaurant'
	| 'coffee'
	| 'water-restroom'
	| 'bike-shop'
	| 'park'
	| 'trailhead'
	| 'landmark';

export interface Place {
	id: string;
	name: string;
	category: Category;
	/** Secondary kinds, for places that are two things at once (a bike shop with a café). */
	also?: Category[];
	/** Nearest W&OD mile marker (0 = Shirlington, ~45 = Purcellville). */
	mile: number;
	town: string;
	/** Human description of distance from the trail, e.g. "right on the trail". */
	offTrail?: string;
	url?: string;
	notes?: string;
	tags?: string[];
	/** Street address, when geocoded. */
	address?: string;
	/** Precise location; when absent the marker sits on the trail at `mile`. */
	lon?: number;
	lat?: number;
	/** How lat/lon were obtained ("nominatim", "manual"). */
	geocoded?: string;
	/** Search string used by scripts/geocode.mjs when the name alone does not resolve. */
	query?: string;
	/** Skip geocoding; the marker belongs on the trail at `mile` (bridges, gaps, junctions). */
	noGeocode?: boolean;
	/** Where this entry came from, for attribution and later verification. */
	source?: string;
	/** True once someone has confirmed it in person recently. */
	verified?: boolean;
}

/** A place with its running number across the whole trail. */
export interface Numbered {
	place: Place;
	n: number;
}

export interface Segment {
	id: string;
	title: string;
	/** Short mile range and county line shown above the chapter title. */
	range: string;
	from: number;
	to: number;
	county: string;
	towns: string[];
	body: string[];
}

export interface Trail {
	attribution: string;
	fetched: string;
	format: string;
	lengthMiles: number;
	/** [lon, lat, cumulativeMiles] */
	points: [number, number, number][];
}

export const CATEGORY_LABEL: Record<Category, string> = {
	brewery: 'Brewery',
	bar: 'Bar',
	restaurant: 'Restaurant',
	coffee: 'Coffee & bakery',
	'water-restroom': 'Water & restrooms',
	'bike-shop': 'Bike shop',
	park: 'Park',
	trailhead: 'Trailhead & parking',
	landmark: 'Landmark'
};
export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];
/** Primary kind first, then any secondary kinds. */
export const kindsOf = (p: Place): Category[] => [p.category, ...(p.also ?? [])];

export interface Elevation {
	attribution: string;
	method?: string;
	fetched: string;
	format: string;
	minFt: number;
	maxFt: number;
	/** [mile, feet] */
	samples: [number, number][];
}

/** Linear interpolation of elevation (feet) at a mile. */
export function elevationAt(e: Elevation, mile: number): number {
	const s = e.samples;
	if (mile <= s[0][0]) return s[0][1];
	for (let i = 1; i < s.length; i++) {
		if (s[i][0] >= mile) {
			const [m0, f0] = s[i - 1];
			const [m1, f1] = s[i];
			return Math.round(f0 + ((f1 - f0) * (mile - m0)) / (m1 - m0 || 1));
		}
	}
	return s[s.length - 1][1];
}
