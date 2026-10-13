import { CATEGORIES, kindsOf, type Category, type Place } from './types.js';

/**
 * Shared UI state: which kinds of stops are shown.
 * Model: "All" is the resting state. Clicking a kind while everything is shown
 * narrows the list to that kind; further clicks add or remove kinds; removing
 * the last selected kind returns to "All".
 */
class Filters {
	active = $state<Set<Category>>(new Set(CATEGORIES));

	get all() {
		return this.active.size === CATEGORIES.length;
	}
	toggle(c: Category) {
		if (this.all) {
			this.active = new Set([c]);
			return;
		}
		const next = new Set(this.active);
		if (next.has(c)) next.delete(c);
		else next.add(c);
		this.active = next.size ? next : new Set(CATEGORIES);
	}
	reset() {
		this.active = new Set(CATEGORIES);
	}
	show(p: Place) {
		return kindsOf(p).some((c) => this.active.has(c));
	}
}

export const filters = new Filters();
