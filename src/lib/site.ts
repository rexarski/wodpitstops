/** Site-wide constants. */
export const SITE = {
	name: 'W&OD Pit Stops',
	slug: 'wodpitstops',
	description:
		'A crowd-sourced guide to where to eat, drink and refill water along the W&OD Trail, by mile marker from Shirlington to Purcellville. Riders and runners add the stops.',
	/** GitHub repository that hosts the data; issue templates live under .github/ISSUE_TEMPLATE. */
	repo: 'https://github.com/rexarski/wodpitstops',
	/** Suggest-a-place form. A title prefix can be appended with ?title=. */
	suggest: 'https://github.com/rexarski/wodpitstops/issues/new?template=new-place.yml',
	/** Report-a-correction form. */
	correct: 'https://github.com/rexarski/wodpitstops/issues/new?template=correction.yml',
	email: 'rexarski@gmail.com',
	trailMiles: 45,
	/** Published CSV of every stop; built by scripts/build-csv.mjs into static/. */
	csv: 'wod-pit-stops.csv'
};
