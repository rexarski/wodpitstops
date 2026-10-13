<script lang="ts">
	// Lucide icons (ISC licence), one per kind of stop. Black and white line icons only.
	import Beer from '@lucide/svelte/icons/beer';
	import Martini from '@lucide/svelte/icons/martini';
	import Utensils from '@lucide/svelte/icons/utensils';
	import Coffee from '@lucide/svelte/icons/coffee';
	import Droplets from '@lucide/svelte/icons/droplets';
	import Wrench from '@lucide/svelte/icons/wrench';
	import Trees from '@lucide/svelte/icons/trees';
	import CircleParking from '@lucide/svelte/icons/circle-parking';
	import Landmark from '@lucide/svelte/icons/landmark';
	import { CATEGORY_LABEL, type Category } from '#lib/types.js';

	const ICONS = {
		brewery: Beer,
		bar: Martini,
		restaurant: Utensils,
		coffee: Coffee,
		'water-restroom': Droplets,
		'bike-shop': Wrench,
		park: Trees,
		trailhead: CircleParking,
		landmark: Landmark
	} as const;

	let { category, size = 16 }: { category: Category; size?: number } = $props();
	const Icon = $derived(ICONS[category]);
</script>

<Icon {size} strokeWidth={1.75} aria-label={CATEGORY_LABEL[category]} role="img" />
