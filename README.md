# W&OD Pit Stops

**A crowd-sourced guide to where to eat, drink and refill water along the W&OD Trail**, listed by mile marker from Shirlington (mile 0) to Purcellville (mile 45). Scroll down to travel northwest: a map follows you chapter by chapter, with an elevation profile, numbered stops, and a shaded band showing what is within about five minutes of riding.

Live site: https://rexarski.com/wodpitstops/

This is a companion project inspired by [Friends of the W&OD Trail](https://wodfriends.org). It is independent of FoWOD and NOVA Parks.

## It only works if you send things in

The list started from one Visit Fairfax article and two r/bikedc threads. Nothing has been verified in person yet. If you ride or run the trail, you know things this site does not: the fountain that is off, the patio that got bike racks, the taproom that closed, the bakery two blocks off the trail that everyone stops at.

- [Suggest a stop](https://github.com/rexarski/wodpitstops/issues/new?template=new-place.yml): name, nearest mile marker, why it is worth it. Partial submissions are welcome.
- [Report a correction](https://github.com/rexarski/wodpitstops/issues/new?template=correction.yml): closed, moved, wrong hours, wrong distance.
- Or email rexarski@gmail.com. A photo helps.

Every submission is read. Accepted ones go into [`src/lib/data/places.json`](src/lib/data/places.json) with the source credited, and the site, the reference table and the CSV rebuild from that one file. Pull requests that edit the JSON directly are welcome too.

## What is in the data

Each stop has a kind (brewery, bar, restaurant, coffee & bakery, water & restrooms, bike shop, park, trailhead & parking, landmark), optional secondary kinds, the nearest mile marker, distance off the trail, address and coordinates, notes, tags, and a `source` that says where it came from (a Visit Fairfax article, a Reddit thread id, a reader). The whole list is downloadable as [`wod-pit-stops.csv`](static/wod-pit-stops.csv).

## Develop

```
npm install
npm run dev        # local dev server
npm run build      # static build to build/ (rebuilds the CSV first)
npm run check      # type-check
npm run data       # rebuild trail, reach band, elevation, geocodes and CSV
node scripts/check-places.mjs  # duplicate ids, bad kinds, geocodes far from the trail
```

SvelteKit + Svelte 5, MapLibre with OpenFreeMap tiles, no API keys. Deploys on push to `main`: Netlify builds it (`netlify.toml`, `BASE_PATH=/wodpitstops`) and the main rexarski.com site proxies `/wodpitstops/*` to it; the GitHub Pages workflow still publishes a mirror at rexarski.github.io/wodpitstops. See [CLAUDE.md](CLAUDE.md) for the full layout, data model and design rules.

## Licenses

- Code: [MIT](LICENSE).
- Stop data (`src/lib/data/places.json`, the CSV): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit “W&OD Pit Stops contributors” and link back.
- Trail line and reach band are derived from OpenStreetMap, © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL. Base map tiles from [OpenFreeMap](https://openfreemap.org).
- Elevation: USGS 3D Elevation Program via the National Map, public domain.

## Credits

- [Friends of the W&OD Trail](https://wodfriends.org) and their [trail maps page](https://wodfriends.org/trail-map/) for the reference material on amenities and mile-marker elevations.
- [NOVA Parks](https://www.novaparks.com/parks/washington-and-old-dominion-railroad-regional-park) for trail facts.
- Starting list and chapter structure: Ali Morris, [“Best Stops Along the Washington & Old Dominion Trail”](https://www.fxva.com/blog/post/best-stops-along-the-wod-trail/), Visit Fairfax, April 12, 2024.
- r/bikedc threads [1mmr9sa](https://www.reddit.com/r/bikedc/comments/1mmr9sa/) and [i64koh](https://www.reddit.com/r/bikedc/comments/i64koh/) for the first curated additions.
- Addresses and coordinates: [Nominatim](https://nominatim.org). Icons: [Lucide](https://lucide.dev). Typeface: [Jost](https://github.com/indestructible-type/Jost). Layout and type after [nodaysoff.run](https://nodaysoff.run).
